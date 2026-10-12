# MEMORY.md — SIGECNT

Memoria del proyecto. Breve (máximo ~50 líneas) y enfocada en contexto crítico.

## Estado actual
- T1 a T8 de Spec 001 están completadas. T7 cubre RF-9 y T8 cubre RF-1 y el caso límite de edad biológica.
- El dashboard valida, audita, grafica métricas locales y permite confirmar la inyección de registros íntegros en exactamente dos clics.

## Decisiones (y por qué)
- **Django Templates + JS Vanilla (sin SPA compilada):** Se descartan frameworks como React/Vue/Vite para eliminar tiempos de compilación, dependencias de `npm` y fragilidad de empaquetado en la estación de trabajo local (PC con recursos limitados), garantizando carga inmediata y mantenimiento directo.
- **Persistencia PostgreSQL On-Premises (Localhost:5432):** Se exige soberanía absoluta de los datos clínicos de pacientes, integridad transaccional estricta y aislamiento de red sin depender de servicios en la nube (SaaS/BaaS) ni conexión a internet.
- **Iconografía con SVGs puros inline y Chart.js local:** Evita solicitudes HTTP externas (cero CDNs), previene fallos visuales offline y dota a la interfaz de micro-interacciones livianas.
- **Ingreso de partes clínicos:** `static/js/dashboard.js` limpia saltos de línea, valida el formato RF-1 y habilita Procesar sólo con un payload válido; el `POST` JSON envía `X-CSRFToken` y añade una fila únicamente tras respuesta satisfactoria. `templates/preview.html` carga este script para la auditoría local.
- **Grilla del dashboard:** se usa `minmax(0, 1fr)` y `min-inline-size: 0` en tarjetas para evitar el desbordamiento horizontal detectado a 1024 px.
- **Auditoría de filas:** cada celda requerida usa `data-campo`; `calcularCompletitudFila` mantiene el fondo `#FADBD8`, marca las celdas vacías y deshabilita la aprobación sólo si cédula o diagnóstico están vacíos. Al perder foco, los cambios usan `PATCH /api/v1/morbilidad/validar/` con CSRF y se revierten si falla la persistencia.
- **Inyección en Excel:** el primer clic abre un modal accesible con el conteo de filas íntegras; el segundo ejecuta `POST /api/v1/export/excel/` con CSRF. Durante la operación se bloquea la interfaz y, si responde con éxito, sólo las filas exportadas pasan a `VALIDADO`. Una respuesta con copia alternativa notifica el caso de archivo bloqueado.
- **Validación T6:** Chrome DevTools verificó el flujo UI T3–T5 con respuestas locales simuladas, las cabeceras CSRF en POST/PATCH, 0 errores de consola, 0 recursos 404 y ausencia de desbordamiento a 1024×768 y 1366×768.
- **Gráficos T7:** `dashboard.js` instancia gráficos Chart.js locales de línea y barras con datos mockup; el contenedor impide el desbordamiento transitorio durante el redimensionamiento.
- **Validador T8:** la Regex base mantiene `EDAD:\d+` según RF-1; cédula o diagnóstico vacíos y edades fuera de 0–125 inhabilitan Procesar. La edad negativa se detecta aparte sólo para conservar la advertencia visual de rango.

## Aprendizajes y errores a evitar
- Nunca enlazar claves foráneas entre `usuarios` (`CustomUser`) y `morbilidad_detalle`.
- Siempre adjuntar `'X-CSRFToken'` en cualquier llamada Fetch asíncrona (`POST`, `PUT`, `PATCH`).
- Respetar de forma innegociable el flujo de 2 clics para validación e inyección en Excel.
- Utilizar siempre el término explícito "Estadístico / Epidemiólogo (Trabajador Asistencial)".
- El repositorio todavía no contiene proyecto Django ni endpoints de morbilidad; los clientes T3/T4 quedan preparados para sus contratos, pero no se puede verificar persistencia real ni ejecutar `manage.py test` hasta que exista backend.

## Próximos pasos
- Esperar revisión o una nueva solicitud; persiste la necesidad de backend Django para certificar persistencia y exportación real.
