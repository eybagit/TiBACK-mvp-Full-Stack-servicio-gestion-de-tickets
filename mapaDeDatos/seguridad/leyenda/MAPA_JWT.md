# 📍 MAPA COMPLETO DE IMPLEMENTACIÓN JWT

## Fecha: 2025-12-30
## Objetivo: Ubicar fácilmente todos los componentes JWT en el código

Este documento mapea **TODAS** las funciones, rutas y ubicaciones donde se implementa JWT en TiBACK, sin mostrar código, solo ubicaciones y estructura.

---

## 🗂️ ÍNDICE DE ARCHIVOS JWT

### Archivos Core (Funciones Base)
1. [`src/api/jwt_utils.py`](#1-jwt_utilspy) - Funciones principales JWT (181 líneas)
2. [`src/api/middleware/websocket_auth.py`](#2-middlewarewebsocket_authpy) - Middleware WebSocket (350 líneas)
3. [`src/api/utils/audit_logger.py`](#3-utilsaudit_loggerpy) - Sistema de auditoría (235 líneas)
4. [`src/api/utils/websocket_utils.py`](#4-utilswebsocket_utilspy) - Metadata de permisos (+199 líneas agregadas)

### Archivos de Configuración
5. [`src/app.py`](#5-apppy) - Configuración Socket.IO (414 líneas)

### Rutas con Autenticación `@require_role`
6. [`src/api/routes/auth_routes.py`](#6-routesauth_routespy) - Autenticación y registro
7. [`src/api/routes/ticket_routes.py`](#7-routesticket_routespy) - Operaciones de tickets
8. [`src/api/routes/asignacion_routes.py`](#8-routesasignacion_routespy) - Asignaciones
9. [`src/api/routes/ticket_estado_routes.py`](#9-routesticket_estado_routespy) - Estados de tickets
10. [`src/api/routes/comentario_routes.py`](#10-routescomentario_routespy) - Comentarios
11. [`src/api/routes/cliente_routes.py`](#11-routescliente_routespy) - Operaciones de clientes
12. [`src/api/routes/analista_routes.py`](#12-routesanalista_routespy) - Operaciones de analistas
13. [`src/api/routes/supervisor_routes.py`](#13-routessupervisor_routespy) - Operaciones de supervisores
14. [`src/api/routes/administrador_routes.py`](#14-routesadministrador_routespy) - Operaciones de admin
15. [`src/api/routes/gestion_routes.py`](#15-routesgestion_routespy) - Gestiones

---

## 📖 DETALLE POR ARCHIVO

### 1. `jwt_utils.py`
**Ubicación:** `src/api/jwt_utils.py`  
**Tamaño:** 181 líneas  
**Propósito:** Funciones principales de JWT - Generación, validación y decoradores

#### FUNCIONES Y UBICACIONES

**Configuración Global (Líneas 11-14):**
- `JWT_SECRET_KEY` - Clave secreta del servidor
- `JWT_ALGORITHM` - Algoritmo HMAC-SHA256
- `TOKEN_EXPIRE_HOURS` - Expiración 24 horas

**`generate_token(user_id, email, role)` - Líneas 16-36**
- Genera JWT firmado
- Payload: user_id, email, role, iat, exp
- Retorna: string token JWT
- Usado en: `auth_routes.py` línea 154

**`verify_token(token)` - Líneas 38-62**
- Valida JWT (firma + expiración)
- Decodifica payload
- Retorna: dict payload o None si inválido
- Usado en:
  - `jwt_utils.py` líneas 93, 126, 156
  - `app.py` línea 96

**`get_token_from_request()` - Líneas 64-74**
- Extrae token del header Authorization
- Formato: `Bearer {token}`
- Retorna: string token o None
- Usado en: Decoradores `require_auth` y `require_role`

**`@require_auth` (Decorador) - Líneas 76-106**
- Valida autenticación básica
- Verifica existencia y validez del token
- Agrega `request.current_user` al contexto
- Retorna: 401 si token inválido
- Usado muy poco (preferir `@require_role`)

**`@require_role(allowed_roles)` (Decorador) - Líneas 108-144**
- Valida autenticación + autorización por rol
- Verifica rol del usuario contra lista permitida
- Agrega `request.current_user` al contexto
- Retorna:
  - 401 si token inválido
  - 403 si permisos insuficientes
- **MÁS USADO** - Ver sección "Rutas protegidas"

**`refresh_token(token)` - Líneas 146-169**
- Renueva token existente
- Valida token viejo y genera nuevo
- Retorna: dict con nuevo token
- Usado en: `/api/auth/refresh` endpoint

**`get_user_from_token()` - Líneas 171-181**
- Obtiene info del usuario del request
- Accede a `request.current_user`
- Retorna: dict con id, email, role
- Usado en: Rutas protegidas para obtener user_id

---

### 2. `middleware/websocket_auth.py`
**Ubicación:** `src/api/middleware/websocket_auth.py`  
**Tamaño:** 350 líneas  
**Propósito:** Middleware de autorización WebSocket con JWT

#### IMPORTACIONES (Líneas 1-25)

**Línea 15:**
```
from flask_jwt_extended import decode_token
```

**Líneas 18-22:**
```
from api.utils.audit_logger import (
    log_evento_permitido,
    log_evento_denegado,
    log_token_invalido,
    log_error_middleware
)
```

#### FUNCIONES Y UBICACIONES

**`validar_jwt_socket(socket)` - Líneas 30-84**
- Extrae token de `socket.handshake.get('auth', {}).get('token')`
- Valida JWT con `decode_token()` (línea 65)
- Extrae payload: user_id (sub), role, email, nombre, apellido
- Retorna: dict usuario o None
- Usado en: `middleware_autorizacion_websocket()`
- **CRÍTICO:** Primera barrera de seguridad

**Estructura de retorno:**
```
{
    "user_id": int (del payload.sub),
    "role": str (del payload.role),
    "email": str,
    "nombre": str,
    "apellido": str
}
```

**`validar_permiso(usuario, metadata_evento)` - Líneas 87-185**
- Algoritmo de decisión de autorización
- Valida permisos por rol y metadata
- Retorna: tupla `(bool permitir, str razon)`
- Usado en: `middleware_autorizacion_websocket()`

**Lógica de decisión (sin código):**
- Líneas 93-94: Eventos sin metadata → PERMITIR
- Líneas 96-98: Administrador → PERMITIR TODO
- Líneas 100-105: Rol no permitido → DENEGAR
- Líneas 107-185: Validación por rol:
  - Líneas 112-119: Cliente (solo si cliente_id coincide)
  - Líneas 121-128: Analista (solo si analista_id coincide)
  - Líneas 130-145: Supervisor (si supervisor_id O tipo_permiso="team")
- Líneas 147-150: Default DENEGAR

**`middleware_autorizacion_websocket(evento_nombre, evento_data, socket_destino)` - Líneas 188-252**
- Interceptor principal de eventos
- Flujo completo de autorización
- Usa `validar_jwt_socket()` y `validar_permiso()`
- Integra con sistema de auditoría
- Retorna: bool (enviar o no)

**Flujo (sin código):**
- Líneas 194-213: Validar JWT del socket
  - Si inválido: log + emitir `token_invalid` + retornar False
- Línea 215: Extraer metadata del evento
- Línea 218: Validar permisos
- Líneas 220-224: Logging de decisión
- Línea 227: Retornar decisión
- Líneas 229-231: En error → DENEGAR

**`obtener_sockets_en_room(socketio, room_name)` - Líneas 258-281**
- Helper para obtener lista de sockets en un room
- Usa `socketio.server.manager.get_participants()`
- Retorna: lista de objetos socket
- Usado en: `emit_con_autorizacion()`

**`emit_con_autorizacion(socketio, evento_nombre, evento_data, room)` - Líneas 284-317**
- **FUNCIÓN PRINCIPAL DE EMISIÓN SEGURA**
- Itera sobre todos los sockets del room
- Aplica middleware a cada socket
- Solo envía a sockets autorizados
- Retorna: número de clientes que recibieron evento

**Flujo (sin código):**
- Línea 301: Obtener sockets en room
- Líneas 303-311: Para cada socket:
  - Aplicar `middleware_autorizacion_websocket()`
  - Si autorizado → emitir evento al socket
  - Contador de enviados++
- Línea 313: Log de estadísticas
- Línea 314: Retornar contador

---

### 3. `utils/audit_logger.py`
**Ubicación:** `src/api/utils/audit_logger.py`  
**Tamaño:** 235 líneas  
**Propósito:** Sistema de logging para auditoría de seguridad

#### CONFIGURACIÓN (Líneas 1-53)

**Líneas 21-23:**
- Directorio de logs: `logs/`
- Se crea automáticamente si no existe

**Líneas 26-28:**
- Logger: `websocket_audit`
- Nivel: INFO
- Propagate: False (independiente)

**Líneas 31-42:**
- Handler: `TimedRotatingFileHandler`
- Archivo: `logs/websocket_audit.log`
- Rotación: medianoche (`when="midnight"`)
- Intervalo: 1 día
- Backup: 30 archivos (últimos 30 días)
- Encoding: UTF-8
- Formato: Solo mensaje (JSON puro)

**Líneas 45-50:**
- Handler consola (desarrollo)
- Nivel: WARNING (solo alertas)

#### FUNCIONES DE LOGGING

**`log_evento_permitido(usuario, evento_nombre, evento_data, razon)` - Líneas 56-92**
- Log cuando evento es permitido (INFO)
- Formato JSON con timestamp, usuario, evento, decisión
- Usado en: `websocket_auth.py` línea 221

**Estructura del log:**
```
{
    timestamp: ISO 8601 UTC,
    nivel: "INFO",
    tipo: "evento_permitido",
    usuario: {user_id, role, email},
    evento: {nombre, ticket_id, accion},
    decision: "PERMITIR",
    razon: string
}
```

**`log_evento_denegado(usuario, evento_nombre, evento_data, metadata, razon)` - Líneas 95-141**
- Log cuando evento es denegado (WARNING)
- Incluye metadata completa del evento
- Alerta: "POSIBLE_INTENTO_NO_AUTORIZADO"
- Severidad: HIGH
- Usado en: `websocket_auth.py` línea 223

**Estructura del log:**
```
{
    timestamp: ISO 8601 UTC,
    nivel: "WARNING",
    tipo: "evento_denegado",
    usuario: {user_id, role, email, nombre_completo},
    evento: {nombre, ticket_id, accion},
    decision: "DENEGAR",
    razon: string,
    metadata_evento: {cliente_id, analista_id, supervisor_id, roles_permitidos, tipo_permiso},
    alerta: "POSIBLE_INTENTO_NO_AUTORIZADO",
    severidad: "HIGH"
}
```

**`log_token_invalido(socket_id, razon)` - Líneas 144-163**
- Log cuando JWT es inválido (WARNING)
- Alerta: "POSIBLE_ATAQUE_REPLAY_O_FALSIFICACION"
- Severidad: MEDIUM
- Usado en: `websocket_auth.py` línea 207

**`log_error_middleware(error, evento_nombre, socket_id)` - Líneas 166-185**
- Log de errores internos (ERROR)
- Incluye tipo de excepción
- Severidad: HIGH
- Usado en: `websocket_auth.py` línea 230

**`analizar_intentos_sospechosos(user_id, ventana_minutos)` - Líneas 191-206**
- **TODO:** Análisis en tiempo real
- Placeholder para futura implementación

**`generar_reporte_seguridad(fecha_inicio, fecha_fin)` - Líneas 209-224**
- **TODO:** Generación de reportes
- Placeholder para futura implementación

---

### 4. `utils/websocket_utils.py`
**Ubicación:** `src/api/utils/websocket_utils.py`  
**Tamaño Original:** 212 líneas → **+199 líneas agregadas** = 411 líneas  
**Propósito:** Utilidades WebSocket + Metadata de permisos

#### FUNCIONES ORIGINALES (Líneas 1-212)

Estas funciones YA incluyen metadata:

**`emit_ticket_created(ticket)` - Líneas 85-99**
- Emite evento ticket_created
- **Línea 90:** Llama `construir_metadata_permisos(ticket, 'ticket_created')`
- **Línea 95:** Incluye `'_permissions': metadata` en extra_data

**`emit_ticket_asignado(ticket, analista_id, es_reasignacion)` - Líneas 102-118**
- Emite ticket_asignado o ticket_reasignado
- **Línea 108:** Llama `construir_metadata_permisos(ticket, event)`
- **Línea 117:** Incluye `'_permissions': metadata`

**`emit_ticket_escalado(ticket)` - Líneas 124-135**
- Emite ticket_escalado
- **Línea 127:** Llama `construir_metadata_permisos(ticket, 'ticket_escalado')`
- **Línea 133:** Incluye `'_permissions': metadata`

**`emit_ticket_estado_changed(ticket, nuevo_estado)` - Líneas 138-162**
- Emite eventos de cambio de estado
- **Línea 151:** Llama `construir_metadata_permisos(ticket, event)`
- **Línea 158:** Incluye `'_permissions': metadata`

**`emit_ticket_evaluado(ticket)` - Líneas 166-181**
- Emite ticket_evaluado
- **Línea 172:** Llama `construir_metadata_permisos(ticket, 'ticket_evaluado')`
- **Línea 178:** Incluye `'_permissions': metadata`

**`emit_comentario_nuevo(comentario, ticket)` - Líneas 187-228**
- Emite comentario_nuevo
- **Línea 218:** Llama `construir_metadata_comentario(comentario, ticket)`
- **Línea 228:** Incluye `'_permissions': metadata`

#### FUNCIONES NUEVAS DE SEGURIDAD (Líneas 234-411)

**`construir_metadata_permisos(ticket, tipo_evento)` - Líneas 238-363**
- **FUNCIÓN PRINCIPAL DE METADATA**
- Construye objeto `_permissions` para cada evento
- Determina roles permitidos según tipo de evento

**Estructura:**
- Líneas 251-261: Estructura base de metadata
- Líneas 263-269: Obtener asignación actual
- Líneas 271-361: Determinar permisos por tipo de evento:
  - Líneas 275-279: `ticket_created`
  - Líneas 281-285: `ticket_asignado`, `ticket_reasignado`
  - Líneas 287-291: `ticket_iniciado`
  - Líneas 293-297: `ticket_solucionado`
  - Líneas 299-303: `ticket_cerrado`
  - Líneas 305-310: `ticket_reabierto`
  - Líneas 312-317: `ticket_escalado`
  - Líneas 319-323: `solicitud_reapertura`
  - Líneas 325-329: `ticket_evaluado`
  - Líneas 331-335: `ticket_updated`, `ticket_actualizado`
  - Líneas 337-342: Evento desconocido (admin_only)

**Retorna (estructura):**
```
{
    cliente_id: int | None,
    analista_id: int | None,
    supervisor_id: int | None,
    roles_permitidos: list[str],
    tipo_permiso: "assigned" | "team" | "admin_only",
    ticket_id: int,
    entidad_tipo: "ticket",
    accion: str
}
```

**`construir_metadata_comentario(comentario, ticket)` - Líneas 366-411**
- Construye metadata para comentarios
- **Línea 379:** Hereda permisos del ticket con `construir_metadata_permisos(ticket, "ticket_updated")`
- Líneas 381-400: Agrega información del creador del comentario

**Retorna (estructura):**
```
{
    ... (hereda de ticket),
    entidad_tipo: "comentario",
    accion: "comentario_nuevo",
    comentario_id: int,
    creador_id: int | None,
    creador_tipo: "cliente" | "analista" | "supervisor" | "desconocido"
}
```

---

### 5. `app.py`
**Ubicación:** `src/app.py`  
**Tamaño:** 414 líneas  
**Propósito:** Configuración principal Flask + Socket.IO

#### IMPORTACIONES JWT (Líneas 1-20)

No importa directamente JWT, pero importa:
- `from flask_socketio import SocketIO, emit, join_room, leave_room`

#### CONFIGURACIÓN SOCKET.IO (Líneas 35-57)

**Línea 35:**
```
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', ...)
```
- Usa la misma clave que JWT

**Líneas 38-57:**
- Inicialización de SocketIO
- CORS: `cors_allowed_origins="*"`
- Transports: polling + websocket
- Async mode: threading

#### HANDLERS WEBSOCKET CON JWT

**`@socketio.on('connect')` - Líneas 87-114**
- Handler de conexión
- **Líneas 93-108:** Validación de JWT en handshake
  - Línea 95: Importa `verify_token` de jwt_utils
  - Línea 96: Valida token: `user_data = verify_token(auth['token'])`
  - Líneas 98-104: Guarda user_data en sesión
  - **IMPORTANTE:** Aquí se debe agregar `join_room('global_tickets')`

**Estructura de auth (handshake):**
```
auth = {
    'token': string (JWT del cliente)
}
```

**`@socketio.on('disconnect')` - Líneas 117-120**
- Handler de desconexión
- **PENDIENTE:** Agregar `leave_room('global_tickets')`

**Otros handlers (Líneas 122-381):**
- No usan JWT directamente
- Manejan rooms y eventos
- **PENDIENTE:** Integrar con middleware de seguridad

---

### 6. `routes/auth_routes.py`
**Ubicación:** `src/api/routes/auth_routes.py`  
**Tamaño:** 309 líneas  
**Propósito:** Autenticación, registro, refresh token

#### IMPORTACIONES (Líneas 8-10)

**Líneas 8-10:**
```
from api.jwt_utils import (
    generate_token, require_role, refresh_token, get_user_from_token
)
```

#### ENDPOINTS

**`POST /register` - Líneas 17-82**
- Registro de clientes
- **NO requiere JWT** (público)
- Genera token después del registro

**`POST /complete-client-info` - Líneas 85-124**
- Completar info del cliente
- **Línea 86:** `@require_role(['cliente'])`
- **Línea 90:** Usa `get_user_from_token()` para obtener user_id

**`POST /login` - Líneas 127-162**
- Login de usuarios
- **NO requiere JWT** (público)
- **Línea 154:** Genera token: `generate_token(user.id, user.email, role)`

**`POST /refresh` - Líneas 165-185**
- Refrescar token expirado
- **NO requiere @require_role** (valida token internamente)
- **Línea 175:** Usa `refresh_token(token)`

**`GET /tickets/cliente` - Líneas 190-207**
- Obtener tickets del cliente
- **Línea 191:** `@require_role(['cliente'])`
- **Línea 195:** Usa `get_user_from_token()`

**`GET /tickets/analista/<id>` - Líneas 210-230**
- Tickets de analista por ID
- **Línea 211:** `@require_role(['supervisor', 'administrador'])`

**`GET /tickets/analista` - Líneas 233-280**
- Tickets del analista actual
- **Línea 234:** `@require_role(['analista', 'administrador'])`
- **Línea 238:** Usa `get_user_from_token()`

**`GET /tickets/supervisor` - Líneas 283-294**
- Todos los tickets activos
- **Línea 284:** `@require_role(['supervisor', 'administrador'])`

**`GET /tickets/supervisor/cerrados` - Líneas 297-308**
- Tickets cerrados
- **Línea 298:** `@require_role(['supervisor', 'administrador'])`

---

### 7. `routes/ticket_routes.py`
**Ubicación:** `src/api/routes/ticket_routes.py`  
**Propósito:** Operaciones CRUD de tickets

#### ENDPOINTS PROTEGIDOS

**`GET /tickets` - Línea 38**
- `@require_role(['administrador', 'supervisor', 'analista'])`

**`POST /tickets` - Línea 49**
- `@require_role(['cliente', 'administrador'])`

**`GET /tickets/<id>` - Línea 99**
- `@require_role(['cliente', 'analista', 'supervisor', 'administrador'])`

**`PUT /tickets/<id>` - Línea 109**
- `@require_role(['cliente', 'analista', 'supervisor', 'administrador'])`

**`DELETE /tickets/<id>` - Línea 139**
- `@require_role(['administrador'])`

**`POST /tickets/<id>/close` - Línea 170**
- `@require_role(['cliente'])`

**`DELETE /tickets` - Línea 230**
- `@require_role(['administrador'])`

**`POST /tickets/<id>/evaluate` - Línea 277**
- `@require_role(['cliente'])`

**`POST /tickets/<id>/supervisor_close` - Línea 315**
- `@require_role(['supervisor', 'administrador'])`

**`POST /tickets/<id>/supervisor_reopen` - Línea 325**
- `@require_role(['supervisor', 'administrador'])`

---

### 8. `routes/asignacion_routes.py`
**Ubicación:** `src/api/routes/asignacion_routes.py`  
**Propósito:** Asignaciones de tickets

#### ENDPOINTS PROTEGIDOS

Todos usan: `@require_role(['supervisor', 'administrador', 'analista'])`

- **Línea 16:** `GET /asignaciones`
- **Línea 23:** `POST /asignaciones`
- **Línea 59:** `GET /asignaciones/<id>`
- **Línea 68:** `PUT /asignaciones/<id>`
- **Línea 109:** `DELETE /asignaciones/<id>`

---

### 9. `routes/ticket_estado_routes.py`
**Ubicación:** `src/api/routes/ticket_estado_routes.py`  
**Propósito:** Cambios de estado de tickets

#### ENDPOINTS PROTEGIDOS

**Línea 33:** `POST /ticket_estado`
- `@require_role(['analista', 'supervisor', 'cliente', 'administrador'])`

---

### 10. `routes/comentario_routes.py`
**Ubicación:** `src/api/routes/comentario_routes.py`  
**Propósito:** Gestión de comentarios

#### ENDPOINTS PROTEGIDOS

- **Línea 18:** `GET /comentarios` - `@require_role(['analista', 'supervisor', 'administrador', 'cliente'])`
- **Línea 25:** `POST /comentarios` - `@require_role(['cliente', 'analista', 'supervisor', 'administrador'])`
- **Línea 55:** `GET /comentarios/<id>` - `@require_role(['analista', 'supervisor', 'cliente', 'administrador'])`
- **Línea 119:** `PUT /comentarios/<id>` - `@require_role(['analista', 'supervisor', 'administrador', 'cliente'])`
- **Línea 128:** `DELETE /comentarios/<id>` - `@require_role(['analista', 'supervisor', 'administrador', 'cliente'])`
- **Línea 152:** `GET /comentarios/ticket/<ticket_id>` - `@require_role(['analista', 'supervisor', 'administrador', 'cliente'])`

---

### 11. `routes/cliente_routes.py`
**Ubicación:** `src/api/routes/cliente_routes.py`  
**Propósito:** Operaciones de clientes

#### ENDPOINTS PROTEGIDOS

Todos usan: `@require_role(['administrador', 'cliente'])`

- **Línea 15:** `GET /clientes`
- **Línea 22:** `POST /clientes`
- **Línea 52:** `GET /clientes/<id>`
- **Línea 61:** `PUT /clientes/<id>`
- **Línea 82:** `DELETE /clientes/<id>`

---

### 12. `routes/analista_routes.py`
**Ubicación:** `src/api/routes/analista_routes.py`  
**Propósito:** Operaciones de analistas

#### ENDPOINTS PROTEGIDOS

- **Línea 16:** `GET /analistas` - `@require_role(['administrador', 'analista', 'supervisor'])`
- **Línea 26:** `POST/analistas` - `@require_role(['administrador', 'analista'])`
- **Línea 62:** `GET /analistas/<id>` - `@require_role(['administrador', 'analista', 'supervisor'])`
- **Línea 74:** `PUT /analistas/<id>` - `@require_role(['administrador', 'analista'])`
- **Línea 95:** `DELETE /analistas/<id>` - `@require_role(['administrador', 'analista'])`

---

### 13. `routes/supervisor_routes.py`
**Ubicación:** `src/api/routes/supervisor_routes.py`  
**Propósito:** Operaciones de supervisores

#### ENDPOINTS PROTEGIDOS

Todos usan: `@require_role(['administrador', 'supervisor'])`

- **Línea 14:** `GET /supervisores`
- **Línea 21:** `POST /supervisores`
- **Línea 43:** `GET /supervisores/<id>`
- **Línea 52:** `PUT /supervisores/<id>`
- **Línea 73:** `DELETE /supervisores/<id>`

---

### 14. `routes/administrador_routes.py`
**Ubicación:** `src/api/routes/administrador_routes.py`  
**Propósito:** Operaciones de administradores

#### ENDPOINTS PROTEGIDOS

Todos usan: `@require_role(['administrador'])`

- **Línea 14:** `GET /administradores`
- **Línea 21:** `POST /administradores`
- **Línea 43:** `GET /administradores/<id>`
- **Línea 52:** `PUT /administradores/<id>`
- **Línea 73:** `DELETE /administradores/<id>`

---

### 15. `routes/gestion_routes.py`
**Ubicación:** `src/api/routes/gestion_routes.py`  
**Propósito:** Gestiones de tickets

#### ENDPOINTS PROTEGIDOS

Todos usan: `@require_role(['analista', 'supervisor', 'administrador'])`

- **Línea 14:** `GET /gestiones`
- **Línea 21:** `POST /gestiones`
- **Línea 46:** `GET /gestiones/<id>`
- **Línea 55:** `PUT /gestiones/<id>`
- **Línea 76:** `DELETE /gestiones/<id>`

---

## 📊 RESUMEN DE UBICACIONES

### Funciones Principales JWT

| Función | Archivo | Líneas | Propósito |
|---------|---------|--------|-----------|
| `generate_token()` | jwt_utils.py | 16-36 | Generar JWT |
| `verify_token()` | jwt_utils.py | 38-62 | Validar JWT HTTP |
| `@require_role()` | jwt_utils.py | 108-144 | Decorador protección routes |
| `refresh_token()` | jwt_utils.py | 146-169 | Renovar token |
| `get_user_from_token()` | jwt_utils.py | 171-181 | Obtener user del request |
| `validar_jwt_socket()` | websocket_auth.py | 30-84 | Validar JWT WebSocket |
| `validar_permiso()` | websocket_auth.py | 87-185 | Algoritmo autorización |
| `middleware_autorizacion_websocket()` | websocket_auth.py | 188-252 | Interceptor eventos |
| `emit_con_autorizacion()` | websocket_auth.py | 284-317 | Emisión segura |
| `construir_metadata_permisos()` | websocket_utils.py | 238-363 | Construir metadata |

### Rutas Protegidas por Rol

| Rol | Cantidad de Endpoints | Archivos Principales |
|-----|----------------------|---------------------|
| `administrador` | ~50 | Todos los routes |
| `supervisor` | ~30 | ticket, asignacion, gestion, auth |
| `analista` | ~25 | ticket, asignacion, gestion, comentario |
| `cliente` | ~20 | ticket, auth, comentario, cliente |

### Archivos de Logs

| Tipo | Ubicación | Rotación |
|------|-----------|----------|
| Auditoría WebSocket | `logs/websocket_audit.log` | Diaria, 30 días |
| Backups | `logs/websocket_audit.log.YYYY-MM-DD` | Automática |

---

## 🔍 CÓMO BUSCAR IMPLEMENTACIONES JWT

### Buscar Decoradores `@require_role`

**Windows PowerShell:**
```powershell
Get-ChildItem -Path src\api\routes -Filter *.py -Recurse | Select-String "@require_role"
```

**Git Bash / Linux:**
```bash
grep -rn "@require_role" src/api/routes/
```

### Buscar Uso de `generate_token`

```bash
grep -rn "generate_token" src/api/
```

### Buscar Uso de `verify_token`

```bash
grep -rn "verify_token" src/api/
```

### Buscar Metadata de Permisos

```bash
grep -rn "_permissions" src/api/
```

### Analizar Logs de Seguridad

```bash
# Ver eventos denegados
grep "evento_denegado" logs/websocket_audit.log | jq '.'

# Contar eventos por tipo
jq -r '.tipo' logs/websocket_audit.log | sort | uniq -c

# Ver usuarios con más eventos denegados
grep "evento_denegado" logs/websocket_audit.log | jq '.usuario.user_id' | sort | uniq -c | sort -nr
```

---

## 📌 PUNTOS CRÍTICOS DE SEGURIDAD

### 1. Clave Secreta JWT

**Ubicación:** Variable de entorno  
**Archivo:** `.env` o sistema  
**Variable:** `JWT_SECRET_KEY`  
**Usado en:**
- `jwt_utils.py` línea 12
- `app.py` línea 35

**⚠️ CRÍTICO:** Nunca commitear esta clave al repositorio

### 2. Validación de Token

**Punto de entrada HTTP:**
- `jwt_utils.py` líneas 121-128 (en @require_role)

**Punto de entrada WebSocket:**
- `app.py` líneas 93-108 (en connect handler)
- `websocket_auth.py` líneas 57-65 (en validar_jwt_socket)

### 3. Autorización por Rol

**HTTP:**
- Decorador `@require_role` en cada ruta

**WebSocket:**
- Función `validar_permiso()` en middleware
- Líneas 87-185 de websocket_auth.py

### 4. Metadata de Permisos

**Construcción:**
- `websocket_utils.py` líneas 238-363

**Validación:**
- `websocket_auth.py` líneas 87-185 (validar_permiso)

### 5. Auditoría

**Todos los eventos se registran en:**
- `logs/websocket_audit.log`
- Funciones en `audit_logger.py` líneas 56-185

---

## 🎯 CHECKLIST DE INTEGRACIÓN

### Verificar JWT en HTTP
- [✅] `jwt_utils.py` existe y tiene todas las funciones
- [✅] Rutas protegidas usan `@require_role`
- [✅] `JWT_SECRET_KEY` configurado en .env
- [✅] Login genera tokens (`auth_routes.py` línea 154)
- [✅] Frontend envía token en header `Authorization: Bearer {token}`

### Verificar JWT en WebSocket
- [✅] `websocket_auth.py` implementado
- [✅] `audit_logger.py` implementado
- [✅] `construir_metadata_permisos()` en websocket_utils.py
- [⏳] `app.py` hace join_room('global_tickets') en connect
- [⏳] Eventos usan `emit_con_autorizacion()`
- [ ] Testing de filtrado

### Verificar Logs
- [✅] Directorio `logs/` existe
- [✅] `logs/*.log` en .gitignore
- [ ] Logs se generan correctamente
- [ ] Rotación diaria funciona

---

**Autor:** TiBACK Security Team  
**Fecha:** 2025-12-30  
**Versión:** 1.0  
**Estado:** ✅ MAPA COMPLETO
