import { product } from './content/product';

export interface Env {
  ASSETS: Fetcher;
  LEADS_WEBHOOK_URL?: string;
  POSTAL_CODES_DB?: D1Database;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
}

type LeadPayload = {
  name?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  state?: string;
  version?: string;
  delivery?: string;
  message?: string;
};

type CheckoutPayload = {
  postalCode?: string;
  settlement?: string;
  state?: string;
  municipality?: string;
  street?: string;
  externalNumber?: string;
  internalNumber?: string;
  delivery?: string;
  references?: string;
  version?: string;
  paymentMethod?: string;
  name?: string;
  whatsapp?: string;
  email?: string;
  terms?: string;
  deliveryEstimateWindow?: string;
  deliveryEstimateCarrier?: string;
};

type PostalCodeRow = {
  cp: string;
  state: string;
  municipality: string;
  settlement: string;
  settlement_type: string | null;
};

type DeliveryRuleRow = {
  carrier: string;
  service_label: string;
  min_business_days: number;
  max_business_days: number;
  target_cost_mxn: number;
  cutoff_hour_local: number;
  notes: string | null;
};

const DELIVERY_TIME_ZONE = 'America/Mexico_City';
const DELIVERY_ORIGIN = 'San Nicolás de los Garza, Nuevo León';

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {})
    }
  });
}

function validateLead(payload: LeadPayload) {
  const errors: string[] = [];
  if (!payload.name || payload.name.trim().length < 2) errors.push('name_required');
  if (!payload.whatsapp || payload.whatsapp.trim().length < 8) errors.push('whatsapp_required');
  return errors;
}

function normalizePostalCode(value: string | null) {
  return (value || '').replace(/\D/g, '').slice(0, 5);
}

function cleanString(value: unknown, maxLength = 160) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validateCheckout(payload: CheckoutPayload) {
  const errors: string[] = [];
  const version = product.versions.find((item) => item.id === payload.version);
  const paymentMethod = payload.paymentMethod === 'oxxo' ? 'oxxo' : 'card';

  if (!version) errors.push('version_required');
  if (!/^\d{5}$/.test(normalizePostalCode(payload.postalCode || null))) errors.push('postal_code_required');
  if (!cleanString(payload.state)) errors.push('state_required');
  if (!cleanString(payload.municipality)) errors.push('municipality_required');
  if (!cleanString(payload.settlement)) errors.push('settlement_required');
  if (!cleanString(payload.street)) errors.push('street_required');
  if (!cleanString(payload.externalNumber, 40)) errors.push('external_number_required');
  if (!cleanString(payload.name, 120) || cleanString(payload.name, 120).length < 2) errors.push('name_required');
  if (!cleanString(payload.whatsapp, 32) || cleanString(payload.whatsapp, 32).length < 8) errors.push('whatsapp_required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanString(payload.email, 180))) errors.push('email_required');
  if (!payload.terms) errors.push('terms_required');

  return { errors, version, paymentMethod };
}

function appendStripeParam(params: URLSearchParams, key: string, value: unknown) {
  const cleaned = cleanString(value, 500);
  if (cleaned) params.append(key, cleaned);
}

function getMexicoNowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DELIVERY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value || '';

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number(value('hour')),
    minute: Number(value('minute'))
  };
}

function addCalendarDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isBusinessDay(dateString: string, holidays: Set<string>) {
  const day = new Date(`${dateString}T12:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6 && !holidays.has(dateString);
}

function nextBusinessDay(dateString: string, holidays: Set<string>) {
  let date = dateString;
  while (!isBusinessDay(date, holidays)) {
    date = addCalendarDays(date, 1);
  }
  return date;
}

function addBusinessDays(dateString: string, days: number, holidays: Set<string>) {
  let date = dateString;
  let remaining = Math.max(0, days);

  while (remaining > 0) {
    date = addCalendarDays(date, 1);
    if (isBusinessDay(date, holidays)) remaining -= 1;
  }

  return date;
}

function formatDateForMexico(dateString: string) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(`${dateString}T12:00:00Z`));
}

function formatDeliveryWindow(minDate: string, maxDate: string) {
  if (minDate === maxDate) return formatDateForMexico(minDate);
  return `${formatDateForMexico(minDate)} a ${formatDateForMexico(maxDate)}`;
}

async function getHolidaySet(db: D1Database, startDate: string) {
  const endDate = addCalendarDays(startDate, 45);
  const result = await db
    .prepare(
      `select holiday_date
       from delivery_holidays
       where holiday_date between ? and ?`
    )
    .bind(startDate, endDate)
    .all<{ holiday_date: string }>();

  return new Set(result.results.map((row) => row.holiday_date));
}

async function findDeliveryRule(db: D1Database, cp: string, state: string) {
  const cpPrefix3 = cp.slice(0, 3);
  const cpPrefix2 = cp.slice(0, 2);

  const result = await db
    .prepare(
      `select carrier, service_label, min_business_days, max_business_days, target_cost_mxn, cutoff_hour_local, notes
       from delivery_rules
       where active = 1
         and (
           (match_type = 'cp' and match_value = ?)
           or (match_type = 'cp_prefix' and match_value in (?, ?))
           or (match_type = 'state' and match_value = ?)
           or (match_type = 'national' and match_value = '*')
         )
       order by
         case match_type
           when 'cp' then 1
           when 'cp_prefix' then 2
           when 'state' then 3
           else 4
         end,
         priority asc
       limit 1`
    )
    .bind(cp, cpPrefix3, cpPrefix2, state)
    .first<DeliveryRuleRow>();

  return result;
}

async function createDeliveryEstimate(cp: string, settlement: string, env: Env) {
  if (!env.POSTAL_CODES_DB) {
    return json({ ok: false, error: 'postal_database_not_configured' }, { status: 503 });
  }

  const postalResult = await env.POSTAL_CODES_DB
    .prepare(
      `select cp, state, municipality, settlement, settlement_type
       from postal_codes
       where cp = ?
       order by case when settlement = ? then 0 else 1 end, settlement asc
       limit 1`
    )
    .bind(cp, settlement)
    .first<PostalCodeRow>();

  if (!postalResult) {
    return json({ ok: false, error: 'postal_code_not_found' }, { status: 404 });
  }

  const rule = await findDeliveryRule(env.POSTAL_CODES_DB, cp, postalResult.state);
  if (!rule) {
    return json({ ok: false, error: 'delivery_rule_not_found' }, { status: 404 });
  }

  const now = getMexicoNowParts();
  const holidays = await getHolidaySet(env.POSTAL_CODES_DB, now.date);
  const todayIsBusinessDay = isBusinessDay(now.date, holidays);
  const beforeCutoff = todayIsBusinessDay && now.hour < rule.cutoff_hour_local;
  const shipDate = beforeCutoff ? now.date : nextBusinessDay(addCalendarDays(now.date, 1), holidays);
  const minDate = addBusinessDays(shipDate, rule.min_business_days, holidays);
  const maxDate = addBusinessDays(shipDate, rule.max_business_days, holidays);
  const windowLabel = formatDeliveryWindow(minDate, maxDate);
  const cutoffLabel = `${String(rule.cutoff_hour_local).padStart(2, '0')}:00`;
  const shipReason = beforeCutoff
    ? `Si completas tu pedido antes de las ${cutoffLabel}, lo preparamos para salir hoy.`
    : todayIsBusinessDay
      ? `Por la hora, la salida se toma el siguiente día hábil.`
      : `Por fin de semana o día inhábil, la salida se toma el siguiente día hábil.`;

  return json({
    ok: true,
    cp,
    settlement: settlement || postalResult.settlement,
    state: postalResult.state,
    municipality: postalResult.municipality,
    origin: DELIVERY_ORIGIN,
    carrier: rule.carrier,
    serviceLabel: rule.service_label,
    targetCostMxn: rule.target_cost_mxn,
    cutoffHourLocal: rule.cutoff_hour_local,
    currentLocalDate: now.date,
    shipsOn: shipDate,
    delivery: {
      minDate,
      maxDate,
      minBusinessDays: rule.min_business_days,
      maxBusinessDays: rule.max_business_days,
      windowLabel
    },
    headline: `Entrega estimada: ${windowLabel}`,
    detail: `${shipReason} Estimación calculada desde ${DELIVERY_ORIGIN}.`,
    notes: rule.notes
  });
}

async function createStripePaymentIntent(payload: CheckoutPayload, env: Env, request: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PUBLISHABLE_KEY) {
    return json({ ok: false, error: 'stripe_not_configured' }, { status: 503 });
  }

  const { errors, version, paymentMethod } = validateCheckout(payload);
  if (errors.length > 0 || !version) return json({ ok: false, errors }, { status: 422 });

  const postalCode = normalizePostalCode(payload.postalCode || null);
  const name = cleanString(payload.name, 120);
  const email = cleanString(payload.email, 180);
  const whatsapp = cleanString(payload.whatsapp, 32);
  const state = cleanString(payload.state, 120);
  const municipality = cleanString(payload.municipality, 120);
  const settlement = cleanString(payload.settlement, 180);
  const street = cleanString(payload.street, 180);
  const externalNumber = cleanString(payload.externalNumber, 40);
  const internalNumber = cleanString(payload.internalNumber, 40);
  const line1 = `${street} ${externalNumber}`.trim();
  const line2 = [internalNumber && `Int. ${internalNumber}`, settlement].filter(Boolean).join(', ');
  const origin = new URL(request.url).origin;

  const params = new URLSearchParams();
  params.append('amount', String(version.amount));
  params.append('currency', version.currency);
  params.append('description', `${version.name} - Guías Universitarias`);
  params.append('receipt_email', email);
  params.append('payment_method_types[]', paymentMethod);
  if (paymentMethod === 'oxxo') {
    params.append('payment_method_options[oxxo][expires_after_days]', '3');
  }
  params.append('metadata[source]', 'landing_checkout');
  params.append('metadata[version]', version.id);
  params.append('metadata[version_name]', version.name);
  params.append('metadata[payment_method]', paymentMethod);
  params.append('metadata[delivery]', cleanString(payload.delivery, 80));
  params.append('metadata[customer_name]', name);
  params.append('metadata[customer_email]', email);
  params.append('metadata[whatsapp]', whatsapp);
  params.append('metadata[postal_code]', postalCode);
  params.append('metadata[state]', state);
  params.append('metadata[municipality]', municipality);
  params.append('metadata[settlement]', settlement);
  params.append('metadata[street]', street);
  params.append('metadata[external_number]', externalNumber);
  appendStripeParam(params, 'metadata[internal_number]', internalNumber);
  params.append('metadata[address_line1]', line1);
  appendStripeParam(params, 'metadata[address_line2]', line2);
  appendStripeParam(params, 'metadata[delivery_estimate_window]', payload.deliveryEstimateWindow);
  appendStripeParam(params, 'metadata[delivery_estimate_carrier]', payload.deliveryEstimateCarrier);
  appendStripeParam(params, 'metadata[references]', payload.references);
  params.append('shipping[name]', name);
  params.append('shipping[phone]', whatsapp);
  params.append('shipping[address][line1]', line1);
  appendStripeParam(params, 'shipping[address][line2]', line2);
  params.append('shipping[address][postal_code]', postalCode);
  params.append('shipping[address][city]', municipality);
  params.append('shipping[address][state]', state);
  params.append('shipping[address][country]', 'MX');

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  const stripeResponse = (await response.json()) as {
    id?: string;
    client_secret?: string;
    livemode?: boolean;
    error?: { message?: string; type?: string };
  };

  if (!response.ok || !stripeResponse.client_secret) {
    return json(
      {
        ok: false,
        error: 'stripe_payment_intent_failed',
        message: stripeResponse.error?.message || 'No se pudo preparar el pago.'
      },
      { status: 502 }
    );
  }

  return json({
    ok: true,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    clientSecret: stripeResponse.client_secret,
    paymentIntentId: stripeResponse.id,
    amount: version.amount,
    currency: version.currency,
    paymentMethod,
    livemode: Boolean(stripeResponse.livemode),
    version: {
      id: version.id,
      name: version.name,
      price: version.price
    },
    returnUrl: `${origin}/checkout/success`
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/postal-code') {
      const cp = normalizePostalCode(url.searchParams.get('cp'));

      if (!/^\d{5}$/.test(cp)) {
        return json({ ok: false, error: 'invalid_postal_code' }, { status: 400 });
      }

      if (!env.POSTAL_CODES_DB) {
        return json({ ok: false, error: 'postal_database_not_configured' }, { status: 503 });
      }

      try {
        const result = await env.POSTAL_CODES_DB
          .prepare(
            `select cp, state, municipality, settlement, settlement_type
             from postal_codes
             where cp = ?
             order by settlement asc`
          )
          .bind(cp)
          .all<PostalCodeRow>();

        if (!result.results.length) {
          return json({ ok: false, error: 'postal_code_not_found' }, { status: 404 });
        }

        const first = result.results[0];

        return json({
          ok: true,
          cp,
          state: first.state,
          municipality: first.municipality,
          settlements: result.results.map((row) => ({
            name: row.settlement,
            type: row.settlement_type
          }))
        });
      } catch {
        return json({ ok: false, error: 'postal_lookup_failed' }, { status: 500 });
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/delivery-estimate') {
      const cp = normalizePostalCode(url.searchParams.get('cp'));
      const settlement = cleanString(url.searchParams.get('settlement'), 180);

      if (!/^\d{5}$/.test(cp)) {
        return json({ ok: false, error: 'invalid_postal_code' }, { status: 400 });
      }

      try {
        return await createDeliveryEstimate(cp, settlement, env);
      } catch {
        return json({ ok: false, error: 'delivery_estimate_failed' }, { status: 500 });
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/leads') {
      let payload: LeadPayload;

      try {
        payload = await request.json();
      } catch {
        return json({ ok: false, errors: ['invalid_json'] }, { status: 400 });
      }

      const errors = validateLead(payload);
      if (errors.length > 0) return json({ ok: false, errors }, { status: 422 });

      const enrichedPayload = {
        ...payload,
        source: 'landing_mvp',
        receivedAt: new Date().toISOString()
      };

      if (env.LEADS_WEBHOOK_URL) {
        ctx.waitUntil(
          fetch(env.LEADS_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrichedPayload)
          })
        );
      }

      return json({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/api/stripe/payment-intent') {
      let payload: CheckoutPayload;

      try {
        payload = await request.json();
      } catch {
        return json({ ok: false, errors: ['invalid_json'] }, { status: 400 });
      }

      return createStripePaymentIntent(payload, env, request);
    }

    return env.ASSETS.fetch(request);
  }
};
