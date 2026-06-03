export interface Env {
  ASSETS: Fetcher;
  LEADS_WEBHOOK_URL?: string;
  POSTAL_CODES_DB?: D1Database;
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

    return env.ASSETS.fetch(request);
  }
};
