# Guías Universitarias Landing MVP

Landing page mobile-first para vender guías físicas impresas de preparación EXANI-II®.

## Objetivo del MVP

Publicar una landing funcional en horas, no días:

1. Presentar producto físico.
2. Mostrar versiones Clásica y Plus.
3. Llevar a pago externo.
4. Abrir WhatsApp Business con mensaje precargado.
5. Capturar leads mediante formulario conectado a webhook.
6. Dejar base limpia para futuras rutas: guías, exámenes, universidades y artículos.

## Stack

- Astro
- TypeScript
- CSS mobile-first propio
- Cloudflare Workers + Static Assets

## Comandos

```bash
npm install
npm run dev
npm run build
npm run worker:dev
npm run deploy
```

## Antes de publicar

Editar:

- `src/content/site.ts`
- `src/content/product.ts`
- `src/content/faq.ts`
- `public/images/cover-placeholder.svg`

Configurar enlaces reales:

- WhatsApp
- Facebook
- Mercado Pago / Stripe / transferencia
- Webhook de leads

## Webhook de leads

El Worker acepta `POST /api/leads`.

Para configurarlo:

```bash
wrangler secret put LEADS_WEBHOOK_URL
```

El endpoint reenvía el lead en JSON al webhook configurado.

## Aviso legal

Este repo incluye aviso de independencia respecto a Ceneval. No retirar sin revisión legal.
