# SPEC — Landing MVP Guías Universitarias

## 1. Contexto

Guías Universitarias venderá cuadernillos físicos tamaño carta para preparación del EXANI-II®. El producto tendrá dos versiones: Clásica y Plus. La landing debe funcionar como página de venta inmediata mientras se desarrolla una aplicación web más amplia con evaluaciones, catálogo universitario, artículos y recursos.

## 2. Objetivo principal

Convertir visitantes en compradores mediante un flujo simple:

Visitante → entiende producto → compara versiones → elige guía → abre pago externo → confirma datos → recibe seguimiento por WhatsApp.

## 3. Objetivos secundarios

- Capturar leads que no compran inmediatamente.
- Canalizar dudas a WhatsApp Business.
- Reforzar confianza con Facebook.
- Validar mensajes, precios, objeciones y demanda.
- Dejar estructura técnica lista para crecer.

## 4. Alcance MVP

Incluye:

- Landing principal mobile-first.
- Sección de producto físico.
- Comparativa Clásica vs Plus.
- CTAs a pago externo.
- CTA a WhatsApp Business.
- CTA a Facebook.
- Formulario de contacto.
- Preguntas frecuentes.
- Rutas base para crecimiento.
- Aviso legal.
- Endpoint Worker para reenviar leads a webhook.

No incluye:

- Carrito propio.
- Inventario.
- Login.
- Dashboard administrativo.
- Pagos nativos dentro del sitio.
- Base de datos propia.
- Automatización avanzada postventa.

## 5. Conversión primaria

CTA principal: `Comprar guía`.

La landing debe privilegiar compra sobre conversación. WhatsApp y Facebook existen como soporte, no como reemplazo del checkout.

## 6. Conversión secundaria

CTA secundaria: `Preguntar por WhatsApp`.

Debe abrir WhatsApp con mensaje precargado que incluya intención, versión y ciudad cuando sea posible.

## 7. Usuarios objetivo

- Aspirante que presentará EXANI-II®.
- Padre/madre/tutor que comprará material físico.
- Aspirante indeciso que necesita claridad sobre qué estudiar.
- Estudiante que prefiere material impreso para concentrarse.

## 8. Promesa de valor

Guía física, clara y organizada para practicar el EXANI-II® con reactivos propios, respuestas, procedimientos y argumentaciones.

Evitar promesas absolutas como “asegura tu lugar”. Usar: “prepárate mejor para competir por tu lugar”.

## 9. Mensaje central

“Guía impresa para preparar el EXANI-II® con reactivos propios, respuestas, procedimientos y argumentaciones.”

## 10. Estructura de página

1. Hero.
2. Barra de confianza/logística.
3. Versiones y precios.
4. Diferenciadores.
5. Qué incluye.
6. Cómo se entrega.
7. Historia/confianza.
8. Preguntas frecuentes.
9. Formulario de contacto.
10. CTA final.
11. Footer legal.

## 11. Requisitos mobile-first

- Primer pantallazo debe mostrar título, promesa, portada y CTA.
- Botón sticky inferior en móvil: Comprar + WhatsApp.
- Texto legible sin zoom.
- Secciones en tarjetas verticales.
- Comparativa sin tablas anchas en móvil.
- Imágenes optimizadas.
- Carga rápida.

## 12. Rutas MVP

- `/`
- `/guias`
- `/guias/exani-ii`
- `/guias/exani-ii/clasica`
- `/guias/exani-ii/plus`
- `/examenes`
- `/examenes/exani-ii`
- `/universidades`
- `/articulos`
- `/contacto`
- `/checkout/success`
- `/checkout/pending`
- `/privacidad`
- `/terminos`

## 13. Datos del formulario

MVP:

- Nombre
- WhatsApp
- Correo
- Estado
- Ciudad
- Versión de interés
- Método de entrega
- Mensaje

No pedir dirección completa antes del pago.

## 14. Eventos mínimos

- `click_buy_hero`
- `click_view_pricing`
- `click_buy_clasica`
- `click_buy_plus`
- `click_whatsapp`
- `click_facebook`
- `submit_contact_form`

## 15. Criterios de aceptación

- La landing se entiende en menos de 10 segundos en móvil.
- Se ven las dos versiones sin buscar demasiado.
- Hay al menos 3 rutas claras de conversión: compra, WhatsApp, formulario.
- El visitante entiende que el producto es físico.
- El visitante entiende que hay envío sin costo a México.
- Existe aviso legal de independencia respecto a Ceneval.
- El sitio compila sin errores.
- El sitio despliega en Cloudflare Workers.
