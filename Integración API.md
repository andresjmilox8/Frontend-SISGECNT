# Integración API — Frontend ↔ Backend (Spec 001 / CU-02)

Este documento define la interfaz de comunicación esperada por `static/js/dashboard.js` para la persistencia en PostgreSQL y exportación institucional con `openpyxl`.

---

## 1. Encabezados Obligatorios
Toda petición mutable (`POST`, `PATCH`, `PUT`, `DELETE`) originada en el cliente incluye:
```http
Content-Type: application/json
X-CSRFToken: <valor_del_token_csrf_en_cookie_o_input>
```

---

## 2. Definición de Endpoints

### 2.1. Ingesta de Morbilidad (Manual / Telegram)
- **Ruta:** `/api/v1/morbilidad/ingresar/`
- **Método:** `POST`
- **Descripción:** Recibe la cadena validada por el frontend e inserta el registro clínico en estado `PENDIENTE`.

#### Request Body
```json
{
  "texto_telegram": "CI:12345678|NOM:Juan Perez|EDAD:25|DX:Rinofaringitis Aguda",
  "semana_id": 28
}
```

#### Response (201 Created)
```json
{
  "status": "success",
  "id": 103,
  "estado": "PENDIENTE",
  "registro": {
    "cedula": "12345678",
    "nombre": "Juan Perez",
    "edad": 25,
    "diagnostico": "Rinofaringitis Aguda",
    "es_indigena": false,
    "talla": null,
    "peso": null,
    "direccion": ""
  }
}
```

#### Response (400 Bad Request)
```json
{
  "status": "error",
  "message": "Formato de mensaje inválido o campos obligatorios vacíos."
}
```

---

### 2.2. Auditoría y Edición Inline de Filas
- **Ruta:** `/api/v1/morbilidad/validar/`
- **Método:** `PATCH`
- **Descripción:** Actualiza los campos complementados o corregidos por el Epidemiólogo en la bandeja de pendientes.

#### Request Body
```json
{
  "id_morbilidad": 101,
  "campo": "talla",
  "valor": "1.72"
}
```
*(Opcionalmente lote completo):*
```json
{
  "id_morbilidad": [101, 102],
  "estado": "VALIDADO"
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "modificados": 1
}
```

---

### 2.3. Aprobación de Lote e Inyección en Excel (2do Clic)
- **Ruta:** `/api/v1/export/excel/`
- **Método:** `POST`
- **Descripción:** Consolida todas las morbilidades del período activo en la plantilla oficial `.xlsx`.

#### Request Body
```json
{
  "id_semana": 28,
  "id_year": 2026,
  "ids_morbilidad": [101, 102, 103]
}
```

#### Response Normal (200 OK)
```json
{
  "status": "success",
  "archivo": "morbilidad_semana_28.xlsx",
  "registros_inyectados": 3,
  "timestamp": "2026-10-10T23:18:00"
}
```

#### Response con Contingencia de Archivo Bloqueado (200 OK - Warning)
Si el archivo `.xlsx` se encuentra abierto en Excel en la máquina local:
```json
{
  "status": "contingency",
  "archivo": "morbilidad_semana_28_20261010_231800.xlsx",
  "registros_inyectados": 3,
  "advertencia": "Plantilla principal en uso. Se generó copia de respaldo para evitar pérdida de información."
}
```

---

## 3. Consideraciones de Base de Datos (PostgreSQL)

1. **Desacoplamiento Estricto:** La tabla `morbilidad_detalle` no debe tener claves foráneas vinculadas a `usuarios` / `CustomUser`.
2. **Soft Delete:** Al pulsar el botón de descartar en la interfaz (`🗑️`), debe actualizarse el campo `soft_delete = TRUE`, sin ejecutar sentencias `DELETE` directas sobre la base de datos.