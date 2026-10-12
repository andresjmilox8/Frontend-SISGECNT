# SIGECNT — Sistema de Gestión del Centro Núñez Tenorio (UNEXCA)
## Entrega de Frontend, Interfaz Reactiva y Contrato de Integración

Este repositorio contiene la arquitectura de Frontend, plantillas de renderizado servidor (Django Templates), estilos institucionales y controladores JavaScript Vanilla para el **Caso de Uso CU-02 (Dashboard Epidemiológico y Auditoría de Morbilidades)**, desarrollado bajo metodología Spec-Driven Development (SDD).

El frontend está **100% probado, validado en offline y libre de errores de consola/404**. No utiliza frameworks compilados (sin React, Vue ni dependencias `npm`/`vite`), ni consume librerías desde CDNs externas.

---

## 📁 Estado y Estructura de Archivos Entregados

```text
contexto-agente/
├── templates/
│   ├── base.html            # Layout maestro con cabecera institucional UNEXCA y bloque de mensajes
│   ├── dashboard.html       # Grid analítico, formulario Telegram, tabla editable y modal de 2 clics
│   └── preview.html         # Maqueta estática autónoma para previsualización inmediata
├── static/
│   ├── css/
│   │   └── dashboard.css    # Paleta (#2C3E50 / #ECF0F1), sombras multicapa, alertas (#FADBD8) y grid
│   ├── js/
│   │   └── dashboard.js     # Reactividad DOM, Chart.js, validación Regex, edición inline y Fetch seguro
│   └── vendor/
│       └── chartjs/
│           └── chart.umd.js # Bundle local compilado de Chart.js v4.5.1 (estrictamente offline)
├── docs/
│   ├── CONTRATO_API_BACKEND.md # Especificación técnica de endpoints requeridos para Gabriel
│   ├── constitution.md      # Reglas innegociables de arquitectura institucional
│   └── specs/001-dashboard-ui-cu02/
│       ├── spec.md          # Requisitos funcionales (RF-1 a RF-9 en formato EARS)
│       ├── plan.md          # Plan arquitectónico del módulo
│       └── tasks.md         # Registro de tareas T1 a T8 completadas en Frontend
├── AGENTS.md                # Directrices del agente y stack local
└── MEMORY.md                # Registro de decisiones y estado del flujo SDD
```

---

## ⚙️ Lo que Gabriel (Backend Lead) debe conectar en Django

### 1. Configuración de Archivos Estáticos y Plantillas en `settings.py`
Asegurar que Django sirva correctamente las carpetas entregadas:

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        # ...
    },
]

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
```

### 2. Endpoints Requeridos (Django REST Framework)
El archivo `static/js/dashboard.js` ya emite peticiones asíncronas con la cabecera obligatoria `'X-CSRFToken'`. Solo resta mapear las rutas en `urls.py` e implementar las vistas:

| Método | Endpoint | Acción esperada en Backend |
|---|---|---|
| `POST` | `/api/v1/morbilidad/ingresar/` | Parsea el texto del parte médico, inserta en `morbilidad_detalle` con estado `PENDIENTE` y retorna `{ id: <int>, estado: "PENDIENTE", registro: {...} }`. |
| `PATCH` | `/api/v1/morbilidad/validar/` | Actualiza en PostgreSQL celdas modificadas inline (talla, peso, dirección, etc.). |
| `POST` | `/api/v1/export/excel/` | Disparado por el segundo clic del modal. Marca el lote como `VALIDADO`, inyecta en la plantilla `.xlsx` vía `openpyxl` y retorna la URL o confirmación del archivo. |

> **Nota Crítica sobre Excel Bloqueado (RF-8):** Si la plantilla institucional `.xlsx` está abierta en la máquina del consultorio y lanza `PermissionError`, el backend debe atrapar la excepción y generar automáticamente el archivo de respaldo con el formato `nombre_plantilla_YYYYMMDD_HHMMSS.xlsx`.

---

## 🔬 Verificaciones de Calidad Realizadas (Chrome DevTools MCP)

1. **0 Errores de Red:** Todos los recursos locales (`dashboard.css`, `chart.umd.js`, `dashboard.js`) cargan con código `HTTP 200`.
2. **0 Excepciones JavaScript:** Evaluado con `node --check` e inspección en consola activa.
3. **Resolución Responsiva:** Validado sin scroll horizontal ni fugas de diseño en `1024×768` y `1366×768` (pantallas estándar del consultorio).
4. **Validación de Partes Médicos (RF-1):** 
   - Regex estricta: `^CI:(?<ci>[^|]+)\|NOM:(?<nom>[^|]+)\|EDAD:(?<edad>\d+)\|DX:(?<dx>[^|]+)$`.
   - Control de rango biológico: Edades menores a 0 o mayores a 125 años quedan bloqueadas visualmente con advertencia.
5. **Flujo de 2 Clics (RF-6 / RF-7):** El botón de aprobación despliega el modal interactivo con el conteo de filas aptas (Clic 1) y ejecuta el despacho con bloqueo visual de interfaz (Clic 2).

---

## 🚀 Cómo probar la interfaz de forma inmediata (Pre-Django)

Para verificar el renderizado visual y la funcionalidad interactiva antes de iniciar el servidor de Django:
1. Abrir la carpeta del proyecto en VS Code.
2. Hacer clic derecho sobre `templates/preview.html`.
3. Seleccionar **"Open with Live Server"** (o navegar a `http://127.0.0.1:5500/templates/preview.html`).