# 🔐 FLUJO DE SEGURIDAD - TiBACK
## Guía Rápida de JWT y WebSocket Security

**Fecha:** 2025-12-30  
**Propósito:** Referencia rápida para solucionar inconsistencias de seguridad

---

## 📋 ÍNDICE DE FLUJOS

1. [Flujo HTTP - Login y JWT](#flujo-1-http---login-y-jwt)
2. [Flujo HTTP - Request con JWT](#flujo-2-http---request-protegido)
3. [Flujo WebSocket - Conexión](#flujo-3-websocket---conexión)
4. [Flujo WebSocket - Evento con Filtrado](#flujo-4-websocket---evento-filtrado)
5. [Flujo Completo - Crear Ticket](#flujo-5-completo---crear-ticket)

---

## FLUJO 1: HTTP - Login y JWT

### Descripción
Usuario hace login → Backend genera JWT → Retorna token

### Archivos Involucrados
- `src/api/routes/auth_routes.py`
- `src/api/jwt_utils.py`

### Secuencia Enumerada

**1. Cliente envía credenciales**
- **Endpoint:** `POST /api/auth/login`
- **Archivo:** `auth_routes.py`
- **Función:** `login()`
- **Línea:** ~25

**2. Validar credenciales en BD**
- **Archivo:** `auth_routes.py`
- **Línea:** ~30-45
- **Qué hace:** Query a tabla de usuario por email

**3. Generar JWT**
- **Archivo:** `jwt_utils.py`
- **Función:** `generate_token(user_id, email, role)`
- **Línea:** 16-36
- **Qué hace:** Crea payload con `user_id`, `email`, `role`, `iat`, `exp`

**4. Firmar JWT**
- **Archivo:** `jwt_utils.py`
- **Línea:** 36
- **Qué hace:** `jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)`

**5. Retornar token al cliente**
- **Archivo:** `auth_routes.py`
- **Línea:** ~50
- **Formato:** `{"access_token": "eyJ...", "user": {...}}`

### Estructura del JWT Generado
```json
{
  "user_id": 123,
  "email": "user@example.com",
  "role": "cliente",
  "iat": 1767119526,
  "exp": 1767205926
}
```

---

## FLUJO 2: HTTP - Request Protegido

### Descripción
Cliente hace request con JWT → Backend valida → Ejecuta si autorizado

### Archivos Involucrados
- Cualquier `*_routes.py`
- `src/api/jwt_utils.py`

### Secuencia Enumerada

**1. Cliente envía request con JWT**
- **Header:** `Authorization: Bearer eyJ...`
- **Ejemplo:** `GET /api/tickets`

**2. Decorator @require_role intercepta**
- **Archivo:** `jwt_utils.py`
- **Función:** `require_role(allowed_roles)`
- **Línea:** 72-103
- **Qué hace:** Wrapper que valida JWT antes de ejecutar función

**3. Extraer token del header**
- **Archivo:** `jwt_utils.py`
- **Función:** `get_token_from_request()`
- **Línea:** 106-116
- **Qué hace:** Lee `Authorization` header

**4. Validar y decodificar JWT**
- **Archivo:** `jwt_utils.py`
- **Función:** `verify_token(token)`
- **Línea:** 39-69
- **Qué hace:** 
  - `jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])`
  - Verifica firma criptográfica
  - Verifica expiración
  - Retorna payload si válido

**5. Verificar rol del usuario**
- **Archivo:** `jwt_utils.py`
- **Línea:** 88-89
- **Qué hace:** `if payload['role'] not in allowed_roles: return 403`

**6. Ejecutar función protegida**
- **Si autorizado:** Función original se ejecuta
- **Si no:** Return 401 (sin token) o 403 (sin permisos)

### Ejemplo de Ruta Protegida
```python
# Archivo: ticket_routes.py, Línea 37
@ticket_bp.route('/tickets', methods=['GET'])
@require_role(['administrador', 'supervisor', 'analista'])
def listar_tickets():
    # Solo ejecuta si JWT válido Y rol correcto
```

---

## FLUJO 3: WebSocket - Conexión

### Descripción
Cliente conecta WebSocket con JWT → Backend valida → Almacena sesión

### Archivos Involucrados
- `src/app.py`
- `src/api/jwt_utils.py`

### Secuencia Enumerada

**1. Cliente inicia conexión WebSocket**
- **Archivo:** Frontend `websocketActions.js`
- **Línea:** ~35
- **Qué envía:** `{auth: {token: localStorage.getItem('token')}}`

**2. Backend recibe conexión**
- **Archivo:** `app.py`
- **Función:** `handle_connect(auth=None)`
- **Línea:** 87-114
- **Evento:** `@socketio.on('connect')`

**3. Verificar JWT del handshake**
- **Archivo:** `app.py`
- **Línea:** 93-96
- **Qué hace:** `verify_token(auth['token'])`

**4. Almacenar sesión del usuario**
- **Archivo:** `app.py`
- **Línea:** 102-108
- **Qué hace:** 
  ```python
  # Diccionario global (línea 88)
  socket_sessions = {}
  
  # Al conectar:
  socket_sessions[request.sid] = {
      'user_id': user_data['user_id'],
      'role': user_data['role'],
      'email': user_data.get('email', ''),
      'connected_at': datetime.now().isoformat()
  }
  ```

**5. Unir usuario a room global_tickets**
- **Archivo:** `app.py`
- **Línea:** 112
- **Qué hace:** `join_room('global_tickets')`

**6. Confirmar conexión**
- **Archivo:** `app.py`
- **Línea:** 120-125
- **Evento emitido:** `connected`

**7. Limpiar sesión al desconectar**
- **Archivo:** `app.py`
- **Función:** `handle_disconnect()`
- **Línea:** 130-138
- **Qué hace:**
  ```python
  if request.sid in socket_sessions:
      session_data = socket_sessions.pop(request.sid)
  leave_room('global_tickets')
  ```

### Datos Almacenados por Conexión
- **SID (Session ID):** Identificador único del socket
- **user_id:** ID del usuario autenticado
- **role:** Rol del usuario
- **email:** Email del usuario
- **connected_at:** Timestamp de conexión

---

## FLUJO 4: WebSocket - Evento Filtrado

### Descripción
Backend emite evento con metadata → Middleware filtra por JWT → Solo autorizados reciben

### Archivos Involucrados
- `src/api/utils/websocket_utils.py`
- `src/api/middleware/websocket_auth.py`
- `src/api/utils/audit_logger.py`

### Secuencia Enumerada

**1. Backend quiere emitir evento**
- **Archivo:** `websocket_utils.py`
- **Función:** `emit_ticket_created(ticket)` (o similar)
- **Línea:** 94-109
- **Qué hace:** Construye metadata y llama `emit_ticket_event()`

**2. Construir metadata de permisos**
- **Archivo:** `websocket_utils.py`
- **Función:** `construir_metadata_permisos(ticket, tipo_evento)`
- **Línea:** 246-368
- **Qué hace:** Define `cliente_id`, `analista_id`, `supervisor_id`, `roles_permitidos`

**3. Agregar metadata al evento**
- **Archivo:** `websocket_utils.py`
- **Línea:** 107
- **Qué hace:** `'_permissions': metadata`

**4. Llamar función de emisión**
- **Archivo:** `websocket_utils.py`
- **Función:** `emit_ticket_event(event, ticket, action, extra_data)`
- **Línea:** 44-88

**5. Usar middleware de autorización**
- **Archivo:** `websocket_utils.py`
- **Línea:** 74-79
- **Qué hace:** 
  ```python
  enviados = emit_con_autorizacion(
      socketio=socketio,
      evento_nombre=event,
      evento_data=data,
      room='global_tickets'
  )
  ```

**6. Obtener SIDs del room**
- **Archivo:** `websocket_auth.py`
- **Función:** `emit_con_autorizacion()`
- **Línea:** 324-327
- **Qué hace:** `socketio.server.manager.rooms.get('/', {}).get(room, set())`

**7. Iterar sobre cada conexión**
- **Archivo:** `websocket_auth.py`
- **Línea:** 338-356
- **Loop:** Por cada SID en el room

**8. Validar JWT del socket**
- **Archivo:** `websocket_auth.py`
- **Función:** `validar_jwt_socket(socket_id, socketio)`
- **Línea:** 34-78
- **Qué hace:**
  - Importa `socket_sessions` desde `app.py`
  - Lee sesión: `socket_sessions.get(socket_id)`
  - Extrae `user_id`, `role`, `email`
  - **NOTA:** Ya NO re-decodifica JWT, usa datos de sesión almacenados al conectar

**9. Validar permisos del evento**
- **Archivo:** `websocket_auth.py`
- **Función:** `middleware_autorizacion_websocket()`
- **Línea:** 184-245
- **Qué hace:** Llama `validar_permiso(usuario, metadata)`

**10. Decidir permitir o denegar**
- **Archivo:** `websocket_auth.py`
- **Función:** `validar_permiso(usuario, metadata_evento)`
- **Línea:** 96-182
- **Algoritmo:**
  - Sin metadata → Permitir (público)
  - Administrador → Permitir siempre
  - Rol no en `roles_permitidos` → Denegar
  - Cliente: Solo si `cliente_id` coincide
  - Analista: Solo si `analista_id` coincide
  - Supervisor: Si `supervisor_id` coincide O `tipo_permiso="team"`

**11. Registrar decisión en logs**
- **Archivo:** `websocket_auth.py`
- **Línea:** 233-237
- **Funciones:**
  - `log_evento_permitido()` si autorizado
  - `log_evento_denegado()` si denegado

**12. Emitir solo a autorizados**
- **Archivo:** `websocket_auth.py`
- **Línea:** 347-348
- **Qué hace:** 
  - Si permitido: `socketio.emit(evento_nombre, evento_data, room=sid)`
  - Si denegado: No emite nada

**13. Retornar resumen**
- **Archivo:** `websocket_auth.py`
- **Línea:** 356-357
- **Log:** "📊 RESUMEN: X enviados, Y denegados de Z total"

### Decisiones de Filtrado por Rol

**Cliente:**
```python
# Línea 146-152 de websocket_auth.py
if cliente_id_evento == usuario["user_id"]:
    return True  # Ve el evento
else:
    return False  # NO ve el evento
```

**Analista:**
```python
# Línea 154-160
if analista_id_evento == usuario["user_id"]:
    return True  # Ve el evento
else:
    return False  # NO ve el evento
```

**Supervisor:**
```python
# Línea 162-176
if supervisor_id_evento == usuario["user_id"]:
    return True  # Asignó el ticket, lo ve
elif tipo_permiso == "team":
    return True  # Evento de equipo, todos ven
else:
    return False  # NO ve el evento
```

---

## FLUJO 5: COMPLETO - Crear Ticket

### Descripción
Flujo end-to-end: Cliente crea ticket → Backend procesa → WebSocket filtrado

### Archivos en Orden de Ejecución
1. `ticket_routes.py` (recibe request)
2. `jwt_utils.py` (valida JWT)
3. `Ticket` model (crea en BD)
4. `websocket_utils.py` (emite evento)
5. `websocket_auth.py` (filtra destinatarios)
6. `audit_logger.py` (registra decisiones)

### Secuencia Completa Enumerada

#### PARTE A: HTTP Request

**1. Cliente envía request**
- **Request:** `POST /api/tickets`
- **Headers:** `Authorization: Bearer eyJ...`
- **Body:** `{titulo, descripcion, prioridad}`

**2. Decorator intercepta**
- **Archivo:** `ticket_routes.py`, Línea 48
- **Decorator:** `@require_role(['cliente', 'administrador'])`

**3. Validar JWT (ver Flujo 2)**
- **Archivo:** `jwt_utils.py`
- **Resultado:** `user = {id: 123, role: 'cliente'}`

**4. Ejecutar función**
- **Archivo:** `ticket_routes.py`
- **Función:** `create_ticket()`
- **Línea:** 50-67

**5. Crear ticket en BD**
- **Archivo:** `ticket_routes.py`
- **Línea:** 61-64
- **Servicio:** `TicketService.create_ticket_for_cliente()`

#### PARTE B: WebSocket Emission

**6. Emitir evento WebSocket**
- **Archivo:** `ticket_routes.py`
- **Línea:** 66
- **Función:** `_emit_new_ticket_events(ticket, user)`

**7. Helper de emisión**
- **Archivo:** `ticket_routes.py`, Línea 407-412
- **Llama:** `emit_ticket_created(ticket)`

**8. Construir metadata (ver Flujo 4)**
- **Archivo:** `websocket_utils.py`
- **Función:** `construir_metadata_permisos()`
- **Línea:** 246-368
- **Resultado:**
  ```python
  {
    'cliente_id': 123,
    'analista_id': None,
    'supervisor_id': None,
    'roles_permitidos': ['cliente', 'supervisor', 'administrador'],
    'tipo_permiso': 'team',  # Supervisores ven tickets nuevos
    'ticket_id': 114
  }
  ```

**9. Emitir con middleware**
- **Archivo:** `websocket_utils.py`
- **Función:** `emit_ticket_event()`
- **Línea:** 74-79
- **Llama:** `emit_con_autorizacion()`

#### PARTE C: Filtrado por Cliente

**10. Obtener conexiones activas**
- **Archivo:** `websocket_auth.py`
- **Línea:** 324-327
- **Ejemplo:** `['sid_cliente_123', 'sid_cliente_456', 'sid_supervisor_789']`

**11. Validar Cliente 123 (dueño)**
- **Paso 11.1:** Obtener JWT del socket
  - **Archivo:** `websocket_auth.py`, Línea 54
  - **Token del handshake**

- **Paso 11.2:** Decodificar JWT
  - **Línea:** 69-73
  - **Resultado:** `{user_id: 123, role: 'cliente'}`

- **Paso 11.3:** Validar permisos
  - **Línea:** 146-152
  - **Condición:** `cliente_id (123) == user_id (123)` ✅
  - **Resultado:** `PERMITIR`

- **Paso 11.4:** Emitir evento
  - **Línea:** 347
  - **Acción:** `socketio.emit('ticket_created', data, room='sid_cliente_123')`

**12. Validar Cliente 456 (otro cliente)**
- **Paso 12.1:** Decodificar JWT → `{user_id: 456, role: 'cliente'}`
- **Paso 12.2:** Validar permisos
  - **Condición:** `cliente_id (123) == user_id (456)` ❌
  - **Resultado:** `DENEGAR`
- **Paso 12.3:** NO emitir (cliente nunca recibe el evento)

**13. Validar Supervisor 789**
- **Paso 13.1:** Decodificar JWT → `{user_id: 789, role: 'supervisor'}`
- **Paso 13.2:** Validar permisos
  - **Línea:** 162-174
  - **Condición:** `tipo_permiso == 'team'` ✅
  - **Resultado:** `PERMITIR`
- **Paso 13.3:** Emitir evento
  - **Acción:** `socketio.emit('ticket_created', data, room='sid_supervisor_789')`

**14. Logging**
- **Archivo:** `audit_logger.py`
- **Línea:** Variable según resultado
- **Logs generados:**
  ```
  {"tipo":"evento_permitido", "user_id":123, "razon":"cliente_id_coincide"}
  {"tipo":"evento_denegado", "user_id":456, "razon":"cliente_id_no_coincide"}
  {"tipo":"evento_permitido", "user_id":789, "razon":"supervisor_permisos_de_equipo_team"}
  ```

**15. Retornar respuesta HTTP**
- **Archivo:** `ticket_routes.py`
- **Línea:** 67
- **Response:** `{ticket: {...}}, 201 Created`

### Resultado Final

**Cliente 123 (dueño):**
- ✅ Recibe response HTTP
- ✅ Recibe evento WebSocket `ticket_created`

**Cliente 456 (otro):**
- ❌ NO recibe response HTTP (no hizo request)
- ❌ NO recibe evento WebSocket (filtrado)

**Supervisor 789:**
- ❌ NO recibe response HTTP
- ✅ Recibe evento WebSocket (tickets nuevos visibles para supervisores)

---

## 🔍 CHECKLIST DE DIAGNÓSTICO

### Problema: "Cliente ve tickets de otros"

**1. Verificar metadata en evento**
- **Archivo:** `websocket_utils.py`
- **Función:** `construir_metadata_permisos()`
- **Línea:** 246-368
- **Verificar:** `_permissions.cliente_id` tiene valor correcto

**2. Verificar JWT del socket**
- **Archivo:** `websocket_auth.py`
- **Función:** `validar_jwt_socket()`
- **Línea:** 77
- **Verificar:** `payload.get("user_id")` (NO "sub")

**3. Verificar middleware se ejecuta**
- **Archivo:** `websocket_utils.py`
- **Línea:** 74-79
- **Verificar:** Usa `emit_con_autorizacion()` (NO `socketio.emit()`)

**4. Verificar logs**
- **Archivo:** `logs/websocket_audit.log`
- **Buscar:** Eventos con "evento_denegado"
- **Si no hay denegaciones:** Middleware no está filtrando

### Problema: "Usuario no recibe eventos que debería"

**1. Verificar conexión WebSocket**
- **Archivo:** `app.py`, Línea 106
- **Verificar:** Usuario hace `join_room('global_tickets')`

**2. Verificar roles permitidos**
- **Archivo:** `websocket_utils.py`
- **Función:** `construir_metadata_permisos()`
- **Verificar:** Rol del usuario en `roles_permitidos`

**3. Verificar IDs coinciden**
- **Para cliente:** `metadata.cliente_id == usuario.user_id`
- **Para analista:** `metadata.analista_id == usuario.user_id`
- **Para supervisor:** `metadata.supervisor_id == usuario.user_id` O `tipo_permiso == 'team'`

---

## 📊 CONFIGURACIÓN JWT

### Variables de Entorno (.env)
```bash
JWT_SECRET_KEY=tu-clave-super-secreta-aqui
JWT_ALGORITHM=HS256
TOKEN_EXPIRE_HOURS=24
```

### Archivos de Configuración
- **Archivo:** `src/api/jwt_utils.py`
- **Líneas:** 9-13

---

## 🔒 PUNTOS CRÍTICOS DE SEGURIDAD

### 1. JWT Secret Key
- **Ubicación:** `.env` → `JWT_SECRET_KEY`
- **NUNCA** commitear en git
- **NUNCA** hardcodear en código

### 2. Middleware DEBE Usar emit_con_autorizacion
- **Archivo:** `websocket_utils.py`, Línea 74
- ✅ **CORRECTO:** `emit_con_autorizacion(...)`
- ❌ **INCORRECTO:** `socketio.emit(...)`

### 3. Metadata DEBE Incluir _permissions
- **Archivo:** `websocket_utils.py` y `ticket_routes.py`
- **TODA función** `emit_ticket_*` DEBE incluir `_permissions` en el data
- **Ejemplo en `ticket_routes.py` línea 377-385:**
  ```python
  data = {
      # ... otros campos ...
      '_permissions': {
          'cliente_id': ticket.id_cliente,
          'analista_id': id_analista,
          'supervisor_id': user['id'],  # supervisor que asigna
          'roles_permitidos': ['cliente', 'analista', 'supervisor', 'administrador'],
          'tipo_permiso': 'assigned',
          'ticket_id': ticket.id
      }
  }
  ```
- ✅ **Con `_permissions`:** Middleware filtra correctamente
- ❌ **Sin `_permissions`:** TODOS reciben el evento (BUG)

### 4. JWT Payload DEBE Usar user_id
- **Archivo:** `jwt_utils.py`, Línea 20-30
- ✅ **CORRECTO:** `'user_id': user_id` en payload
- ❌ **INCORRECTO:** `'sub'` o `'id'`

### 5. Sesiones de Socket en Diccionario Global
- **Archivo:** `app.py`, Línea 89
- ✅ **CORRECTO:** `socket_sessions = {}` (dict global)
- ❌ **INCORRECTO:** `socketio.session` (no existe en Flask-SocketIO)

### 6. Middleware Accede a Sesiones Correctamente
- **Archivo:** `websocket_auth.py`, Línea 34-45
- ✅ **CORRECTO:** 
  ```python
  from app import socket_sessions
  session_data = socket_sessions.get(socket_id)
  ```
- ❌ **INCORRECTO:** `socketio.session.get(socket_id)`

### 7. localStorage Solo Almacena Token por Rol
- **Archivo:** `src/front/store/actions/authActions.js`
- **Archivo:** `src/front/store/utils/tokenUtils.js`
- ✅ **CORRECTO:**
  ```javascript
  // Key = rol del usuario, Value = JWT
  localStorage.setItem("cliente", "eyJ...");
  ```
- ❌ **INCORRECTO:**
  ```javascript
  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("activeTicket", JSON.stringify(ticketData));
  ```

### 8. clearAllTokens Limpia TODOS los Datos Sensibles
- **Archivo:** `tokenUtils.js`, L118-147
- **Función:** `clearAllTokens()`
- **Limpia:**
  - Tokens de roles (cliente, analista, supervisor, administrador)
  - Datos legacy (activeChats, activeTicket, cliente_logIn_on)
  - sessionStorage también

---

**Creado:** 2025-12-30  
**Última actualización:** 2025-12-30 16:27  
**Versión:** 1.3 - Seguridad localStorage + sincronizado con código
