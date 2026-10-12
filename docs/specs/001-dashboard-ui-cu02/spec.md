# Spec 001 - Interfaz del Dashboard Epidemiológico y Auditoría de Morbilidades (CU-02)
Estado: aprobada

## Contexto y objetivo
El Consultorio Núñez Tenorio procesa manualmente morbilidades que generan cuellos de botella en la entrega de reportes semanales al vicerrectorado. Esta funcionalidad dota al personal de una interfaz visual desconectada que permite ingresar texto de partes médicos, auditar datos faltantes en una tabla reactiva, visualizar alertas tempranas y exportar a hojas Excel preformateadas en 2 clics.

## Usuarios / Actores
- **Estadístico / Epidemiólogo (Trabajador Asistencial)**: Único operador humano acreditado para ingresar, auditar y aprobar lotes.
- **Médico Asistencial**: Emisor del texto plano vía Telegram (actor externo indirecto).

## Historias de usuario
- **HU-1**: Como Estadístico, quiero pegar el texto crudo del parte médico en un área de texto con validación en tiempo real para incorporarlo al sistema sin digitar manualmente campo por campo.
- **HU-2**: Como Estadístico, quiero visualizar los registros en una tabla interactiva con celdas editables y filas destacadas en rojo si faltan datos para subsanar inconsistencias antes de la exportación.
- **HU-3**: Como Estadístico, quiero aprobar el lote completo y generar el consolidado en Excel en un máximo de dos clics para optimizar el tiempo de entrega institucional.

## Requisitos funcionales (Criterios de Aceptación en EARS)
- **RF-1**: CUANDO el Estadístico introduce texto en el campo de recepción, EL SISTEMA evalúa la cadena en tiempo real mediante la expresión regular `^CI:(?P<ci>.*)\|NOM:(?P<nom>.*)\|EDAD:(?P<edad>\d+)\|DX:(?P<dx>.*)$` y aplica un borde indicador visual (verde para formato válido, rojo para estructura corrupta).
- **RF-2**: CUANDO el Estadístico pulsa el botón "Procesar" con un payload válido, EL SISTEMA ejecuta una petición Fetch asíncrona enviando el encabezado `X-CSRFToken`, inserta el registro en estado `PENDIENTE` en PostgreSQL y agrega la fila a la tabla activa sin recargar la página.
- **RF-3**: EL SISTEMA resalta de manera permanente con color de fondo suave (`#FADBD8`) cualquier fila cuyo registro contenga valores nulos o vacíos en los campos antropométricos o filiatorios requeridos.
- **RF-4**: CUANDO el Estadístico modifica directamente el contenido de una celda editable en la tabla, EL SISTEMA persiste el cambio mediante `PATCH /api/v1/morbilidad/validar/` y actualiza la alerta visual si el registro queda íntegro.
- **RF-5**: MIENTRAS existan registros con inconsistencias críticas (cédula o diagnóstico vacíos) en la bandeja, EL SISTEMA mantiene inhabilitado el botón primario "Aprobar Lote e Inyectar en Excel".
- **RF-6 (Paso 1 del flujo de 2 clics)**: CUANDO el Estadístico pulsa "Aprobar Lote e Inyectar en Excel", EL SISTEMA despliega una ventana modal interactiva con el resumen cuantitativo de registros a exportar.
- **RF-7 (Paso 2 del flujo de 2 clics)**: CUANDO el Estadístico pulsa "Confirmar Inyección" dentro del modal, EL SISTEMA ejecuta `POST /api/v1/export/excel/`, bloquea la interfaz mostrando un indicador de progreso y actualiza el estado de las filas a `VALIDADO`.
- **RF-8**: SI la plantilla institucional de Excel se encuentra bloqueada por estar abierta en el sistema operativo, ENTONCES EL SISTEMA genera automáticamente una copia con sufijo `_timestamp.xlsx` y notifica al usuario sin perder los datos.
- **RF-9**: EL SISTEMA renderiza métricas epidemiológicas dinámicas (picos semanales y top patologías) utilizando exclusivamente librerías locales de Chart.js almacenadas en `/static/vendor/`.

## Requisitos no funcionales
- **RNF-1**: La interfaz debe cumplir con la paleta de colores de baja saturación cognitiva (`#2C3E50` cabeceras, `#ECF0F1` fondo neutro).
- **RNF-2**: Tiempo de respuesta de actualización de celdas en la interfaz inferior a 150 ms sobre el servidor local.
- **RNF-3**: Interfaz adaptable que soporte sin desbordamiento horizontal resoluciones entre 1024x768 y 1920x1080 píxeles.
- **RNF-4**: Consumo cero de ancho de banda externo (operación 100% offline).

## Casos límite
- Texto pegado con espacios accidentales o saltos de línea múltiples: el analizador debe limpiar caracteres de escape antes de evaluar el regex.
- Registro con edad fuera de rango biológico (menor a 0 o mayor a 125): el sistema marca la celda en advertencia.
- Ingreso de cédula existente en la misma fecha: el sistema muestra advertencia de reconsulta sin abortar el flujo.

## Fuera de alcance
- Conexión autónoma vía webhook o polling directo a servidores de Telegram.
- Generación de reportes gráficos en PDF para vicerrectorados (objeto de la Spec 002).
- Gestión y alta de nuevos usuarios administradores.

## Criterios de finalización
- Verificación visual con el MCP de Chrome DevTools ejecutando el ciclo completo en 1024px y 1366px.
- Todas las peticiones asíncronas transmiten el token CSRF sin arrojar errores 403 en consola.
- Demostración del flujo de 2 clics validada de punta a punta.