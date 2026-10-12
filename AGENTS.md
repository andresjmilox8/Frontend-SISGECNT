# AGENTS.md — SIGECNT (Frontend & UI Harness)

Operación de escritorio web local (100% On-Premises) para el Consultorio Núñez Tenorio (UNEXCA).
Actor único: "Estadístico / Epidemiólogo (Trabajador Asistencial)". Cero CDNs y cero nube.

## Stack & Arquitectura Frontend

- Django 5.x Templates + JavaScript Vanilla puro (sin React, Vue ni npm/build tools).
- Recursos locales: `/static/vendor/chartjs/chart.umd.js` e iconos en SVGs puros inline.
- Servidor local: 127.0.0.1:8000. Base de datos: PostgreSQL local (5432).

## Reglas Innegociables de UI (Cumplir FRONTEND-PAUTAS.md)

1. **Lectura obligatoria:** ANTES de generar o alterar HTML/CSS, lee `FRONTEND-PAUTAS.md`.
2. **Estilo visual:** Prohibido diseño plano o genérico. Usar elevación (`box-shadow`), bordes con opacidad sutil (`rgba(44, 62, 80, 0.12)`) y espaciados de 20-24px.
3. **Paleta corporativa:** Primario `#2C3E50`, Fondo `#ECF0F1`, Alerta incompleta `#FADBD8` / `#E74C3C`.
4. **Flujo de 2 clics (R4):** Clic 1: "Aprobar Lote" (abre modal); Clic 2: "Confirmar" (persiste en Excel).
5. **CSRF en Fetch:** Adjuntar siempre el encabezado `'X-CSRFToken'` en llamadas `POST/PUT/PATCH`.
6. **Resolución objetivo:** Optimizado exclusivamente para escritorios de consultorio (1024x768 a 1366x768 px).

## Flujo de Trabajo SDD

- Trabajar tarea por tarea según la spec activa (`specs/001-dashboard-ui-cu02/tasks.md`).
- Implementar sólo la tarea solicitada y detenerse de inmediato.
- Actualizar `MEMORY.md` al finalizar cada tarea.

## Verificación

- Cero peticiones de red externas (modo offline absoluto).
- Cero errores 404 y cero excepciones JS en consola auditado con Chrome DevTools MCP.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Forma de trabajar

- Planificar detalladamente antes de crear o modificar código, siguiendo la spec activa (`docs/specs/001-dashboard-ui-cu02/spec.md`).
- Realizar cambios pequeños y verificables paso a paso según las tareas (`tasks.md`).
- Explicar los resultados y validaciones técnicas realizadas al concluir cada tarea.

## Límites

- ✅ Siempre:
  - Actualizar `MEMORY.md` al finalizar cada tarea.
  - Implementar iconos con **SVGs puros inline**.
  - Garantizar el encabezado `'X-CSRFToken'` en llamadas Fetch asíncronas.
  - Mantener la paleta `#2C3E50`, `#ECF0F1`, `#FADBD8`.
  - Construir interfaces modernas (glassmorphism sutil, bordes limpios, espaciados orgánicos) y micro-interacciones fluidas.
- ⚠️ Pregunta antes:
  - Incorporar nuevas dependencias en `requirements.txt`.
  - Modificar esquemas de bases de datos o campos no previstos en la spec activa.
  - Alterar directrices establecidas en `docs/constitution.md`.
- 🚫 Nunca:
  - Utilizar librerías externas vía CDN o tipografías dependientes de conexión a internet.
  - Realizar peticiones de red hacia servidores o APIs externas de Telegram.
  - Establecer claves foráneas cruzadas entre `usuarios` y `morbilidad_detalle`.
  - Concatenar cadenas para consultas SQL (usar exclusivamente el ORM o consultas parametrizadas).
  - Romper el flujo estricto de los 2 clics para aprobación institucional.

## Verificación

- Comprobar que todas las vistas y recursos estáticos carguen con 0 errores 404 en entorno desconectado (offline).
- Validar mediante la herramienta Chrome DevTools que no existan errores de consola ni advertencias no capturadas.
- Verificar responsividad en resoluciones mínimas de 1024x768 y 1366x768 píxeles sin desbordamiento horizontal.
- Ejecutar pruebas automáticas de backend (`python manage.py test`) antes de considerar concluido un módulo.