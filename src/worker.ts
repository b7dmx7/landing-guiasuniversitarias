export interface Env {
  ASSETS: Fetcher;
  LEADS_WEBHOOK_URL?: string;
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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
