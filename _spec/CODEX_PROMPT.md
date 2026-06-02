# Prompt maestro para Codex

Trabaja en este repositorio como desarrollador senior orientado a MVP. Sigue la especificación en `_spec/SPEC.md`, las tareas en `_spec/TASKS.md`, las decisiones en `_spec/DECISIONS.md` y los criterios de aceptación en `_spec/ACCEPTANCE.md`.

Objetivo: publicar una landing mobile-first de Guías Universitarias en unas horas, no construir una aplicación completa.

Prioridades:

1. Que compile.
2. Que se vea bien en móvil.
3. Que venda claramente las guías físicas.
4. Que tenga CTA de compra, WhatsApp y formulario.
5. Que sea fácil cambiar textos, precios y enlaces desde `src/content/`.
6. Que despliegue en Cloudflare Workers con static assets.

Restricciones:

- No agregar framework innecesario.
- No crear dashboard.
- No crear carrito propio.
- No usar base de datos en esta versión.
- No romper rutas existentes.
- No eliminar aviso legal.
- No prometer admisión garantizada.

Primera tarea:

1. Ejecuta `npm install`.
2. Ejecuta `npm run build`.
3. Corrige errores si existen.
4. Revisa la landing en mobile viewport.
5. Mejora solo lo que esté alineado con el MVP.

Cuando modifiques algo, actualiza el checklist correspondiente en `_spec/TASKS.md`.
