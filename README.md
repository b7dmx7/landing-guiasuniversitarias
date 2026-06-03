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
7. Preparar checkout sin VPS con Cloudflare Workers, D1 y Stripe.

## Stack

- Astro
- TypeScript
- CSS mobile-first propio
- Cloudflare Workers + Static Assets
- Cloudflare D1 para catálogo de códigos postales y pedidos futuros

## Comandos

```bash
npm install
npm run dev
npm run build
npm run worker:dev
npm run worker:dev:remote
npm run deploy
```

Para probar el formulario de compra con la D1 real de Cloudflare, usar:

```bash
npm run worker:dev:remote -- --port 8788
```

`npm run dev` levanta Astro en local, pero no ejecuta el Worker ni consulta D1.

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

## Código postal con D1

El Worker ya incluye `GET /api/postal-code?cp=00000` para consultar colonias por código postal cuando exista el binding `POSTAL_CODES_DB`.

Pasos pendientes en Cloudflare:

```bash
wrangler d1 create landing-guiasuniversitariasdb
wrangler d1 migrations apply landing-guiasuniversitariasdb --remote
```

Después de crear la base, agregar el binding real a `wrangler.toml` con el `database_id` que entregue Wrangler:

```toml
[[d1_databases]]
binding = "POSTAL_CODES_DB"
database_name = "landing-guiasuniversitariasdb"
database_id = "bbbb2d62-3654-4e17-9187-41fab693aa0c"
```

Las migraciones viven en `migrations/`. El catálogo SEPOMEX/Correos de México fue cargado en D1 con 158,416 registros y 31,874 códigos postales distintos.

El catálogo oficial indica que se proporciona gratuitamente para uso particular y que no está permitida su comercialización ni distribución a terceros.

## Webhook de leads

El Worker acepta `POST /api/leads`.

Para configurarlo:

```bash
wrangler secret put LEADS_WEBHOOK_URL
```

El endpoint reenvía el lead en JSON al webhook configurado.

## Aviso legal

Este repo incluye aviso de independencia respecto a Ceneval. No retirar sin revisión legal.
