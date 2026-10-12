# Plan Técnico: Spec 001 - Dashboard UI y Auditoría de Morbilidades
Cubre: RF-1 a RF-9 de `specs/001-dashboard-ui-cu02/spec.md`

## Archivos que se crean o modifican
- `templates/base.html`: Estructura HTML5 base, metadatos, cabecera institucional UNEXCA, contenedor de alertas y carga de assets estáticos locales.
- `templates/dashboard.html`: Estructura semántica del Dashboard (Panel de métricas, Textarea de Telegram, Tabla reactiva y Modal de 2 clics).
- `static/css/dashboard.css`: Estilos visuales con variables CSS (`--primary: #2C3E50`, `--bg: #ECF0F1`, `--alert: #FADBD8`).
- `static/vendor/chartjs/chart.umd.js`: Librería compilada de Chart.js para consumo offline estricto.
- `static/js/dashboard.js`: Lógica del cliente (validación regex, llamadas Fetch seguras, manipulación del DOM y gráficos).

## Funciones puras de lógica en JavaScript (Módulo `static/js/dashboard.js`)
- `validarEstructuraTelegram(textoCrudo)`: Evalúa el texto contra el patrón Regex. Retorna objeto `{ valido: boolean, datos: object | null }`.
- `formatearFechaLocal(fecha)`: Genera string `AAAA-MM-DD` sin desfases de zona horaria UTC.
- `calcularCompletitudFila(registro)`: Evalúa si existen campos obligatorios en blanco y retorna array de campos faltantes.

## Algoritmo de validación y captura en Frontend (Pseudocódigo)
```text
Función alEscribirTextoTelegram(evento):
    cadena = evento.target.valor.trim()
    resultado = validarEstructuraTelegram(cadena)
    Si resultado.valido es Verdadero:
        AplicarClaseVisual(campoTexto, "borde-exito")
        HabilitarBoton(btnProcesar)
    Sino:
        AplicarClaseVisual(campoTexto, "borde-error")
        DeshabilitarBoton(btnProcesar)
FinFunción

Función procesarLoteDosClics():
    // Clic 1
    total = ContarFilasValidas()
    MostrarModalConfirmacion("¿Desea aprobar e inyectar " + total + " registros?")
    // Clic 2
    AlConfirmarModal:
        MostrarSpinner()
        csrf = ObtenerCSRFToken()
        respuesta = FetchPost("/api/v1/export/excel/", headers={'X-CSRFToken': csrf})
        Si respuesta.status == 200:
            ActualizarFilasAEstadoValidado()
            OcultarModal()
            LanzarNotificacion("Inyección exitosa en plantilla institucional")
FinFunción