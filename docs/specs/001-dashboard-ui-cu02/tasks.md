# Tareas: Spec 001 - Dashboard UI y Auditoría de Morbilidades

- [X] **T1. Estructura base y recursos locales offline.** RF-9
  - Crear `templates/base.html` con la cabecera institucional persistente.
  - Ubicar `chart.umd.js` en `static/vendor/chartjs/`.
  - Configurar `static/css/dashboard.css` con la paleta de colores institucional.
  - *Hecho cuando*: La página cargue en navegador sin conexión a internet y la consola registre 0 errores de archivos faltantes (HTTP 404).

- [X] **T2. Maquetación del Dashboard y Grid analítico.** RF-9, RNF-1, RNF-3
  - Crear `templates/dashboard.html` estructurando los contenedores de gráficos, el panel de entrada y la tabla.
  - Instanciar gráficos de línea (picos) y barras horizontales (top patologías) con Chart.js consumiendo datos mockup locales.
  - *Hecho cuando*: Los dos gráficos se rendericen con diseño limpio y no exista desbordamiento en resoluciones de 1024px.

- [x] **T3. Módulo de ingreso y validador visual de Telegram.** RF-1, RF-2
  - Maquetar el `<textarea>` de recepción de texto.
  - Implementar en `static/js/dashboard.js` el validador en tiempo real con Regex en el evento `input`.
  - Conectar el botón "Procesar" con Fetch enviando `X-CSRFToken` a `/api/v1/morbilidad/ingresar/`.
  - *Hecho cuando*: El textarea cambie a borde verde/rojo según el formato pegado y el envío asíncrono agregue el registro a la tabla.

- [x] **T4. Tabla interactiva de pendientes y marcado de errores.** RF-3, RF-4, RF-5
  - Construir la tabla con soporte para celdas editables (`contenteditable` o inputs inline).
  - Implementar la función de resaltado en `#FADBD8` para registros con campos nulos.
  - Emitir peticiones `PATCH` con `X-CSRFToken` al modificar celdas para actualizar la persistencia.
  - *Hecho cuando*: Al vaciar una celda obligatoria la fila se pinte de rojo y el botón de aprobación quede deshabilitado.

- [x] **T5. Flujo de aprobación e inyección en 2 Clics.** RF-6, RF-7, RF-8
  - Maquetar la ventana modal accesible de confirmación.
  - Vincular Clic 1 (apertura con totalizador) y Clic 2 (disparo de `POST /api/v1/export/excel/`).
  - Implementar estado de carga (loader) y cambio visual a estado `VALIDADO`.
  - *Hecho cuando*: Se complete el ciclo de exportación en exactamente dos pulsaciones sin recargar la página.

- [x] **T6. Validación integral de la Spec con Chrome DevTools MCP.** RF-1 a RF-9, RNF-1, RNF-3, RNF-4
   - Ejecutar inspección automatizada en navegador con el servidor local activo.
   - Auditar vista responsive a 1024px y 1366px.
   - Verificar que no existan llamadas de red rotas ni fugas de diseño.
   - *Hecho cuando*: La consola reporte 0 excepciones JS y el flujo completo esté validado de punta a punta.

- [x] **T7. Instanciación local de gráficos epidemiológicos.** RF-9
  - Instanciar en `static/js/dashboard.js` los gráficos de línea de picos semanales y barras horizontales de top patologías mediante la copia local de Chart.js.
  - Usar exclusivamente datos mockup locales y la paleta institucional, sin solicitudes externas.
  - *Hecho cuando*: Ambos elementos `<canvas>` poseen una instancia Chart.js funcional, se visualizan a 1024px y 1366px y no generan errores de consola ni peticiones 404.

- [x] **T8. Endurecimiento del validador de partes clínicos.** RF-1, caso límite de edad biológica
  - Afinar en `static/js/dashboard.js` la validación de la estructura Telegram para distinguir campos críticos vacíos de un payload válido.
  - Validar el rango biológico de edad entre 0 y 125 y mostrar la advertencia visual correspondiente antes de procesar.
  - *Hecho cuando*: Un parte con cédula o diagnóstico vacío no habilita el procesamiento; edades fuera de rango quedan advertidas y los mensajes correctamente estructurados dentro del rango mantienen el indicador verde.
