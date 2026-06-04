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
  name?: string;
  whatsapp?: string;
  email?: string;
  terms?: string;
};

type PostalCodeRow = {
  cp: string;
  state: string;
  municipality: string;
  settlement: string;
  settlement_type: string | null;
};

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

  if (!version) errors.push('version_required');
  if (!/^\d{5}$/.test(normalizePostalCode(payload.postalCode || null))) errors.push('postal_code_required');
  if (!cleanString(payload.state)) errors.push('state_required');
  if (!cleanString(payload.municipality)) errors.push('municipality_required');
  if (!cleanString(payload.settlement)) errors.push('settlement_required');
  if (!cleanString(payload.street)) errors.push('street_required');
  if (!cleanString(payload.externalNumber)) errors.push('external_number_required');
  if (!cleanString(payload.name, 120) || cleanString(payload.name, 120).length < 2) errors.push('name_required');
  if (!cleanString(payload.whatsapp, 32) || cleanString(payload.whatsapp, 32).length < 8) errors.push('whatsapp_required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanString(payload.email, 180))) errors.push('email_required');
  if (!payload.terms) errors.push('terms_required');

  return { errors, version };
}

function appendStripeParam(params: URLSearchParams, key: string, value: unknown) {
  const cleaned = cleanString(value, 500);
  if (cleaned) params.append(key, cleaned);
}

async function createStripePaymentIntent(payload: CheckoutPayload, env: Env, request: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PUBLISHABLE_KEY) {
    return json({ ok: false, error: 'stripe_not_configured' }, { status: 503 });
  }

  const { errors, version } = validateCheckout(payload);
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
  params.append('automatic_payment_methods[enabled]', 'true');
  params.append('automatic_payment_methods[allow_redirects]', 'never');
  params.append('metadata[source]', 'landing_checkout');
  params.append('metadata[version]', version.id);
  params.append('metadata[delivery]', cleanString(payload.delivery, 80));
  params.append('metadata[postal_code]', postalCode);
  params.append('metadata[settlement]', settlement);
  params.append('metadata[whatsapp]', whatsapp);
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
