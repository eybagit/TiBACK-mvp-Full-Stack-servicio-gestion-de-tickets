# 💬 Mapa Detallado de Chats en Tiempo Real - Referencia Técnica Completa

**Última actualización:** 2025-12-29  
**Propósito:** Documentación exhaustiva de chats WebSocket, rutas, componentes y handlers

---

## 📋 Tabla de Contenidos

1. [Contexto General](#contexto-general)
2. [Arquitectura Actual de Chats](#arquitectura-actual-de-chats)
3. [Chat 1: Comentarios (3 Roles)](#chat-1-comentarios-3-roles)
4. [Chat 2: Analista-Cliente](#chat-2-analista-cliente)
5. [Chat 3: Supervisor-Analista](#chat-3-supervisor-analista)
6. [Estructura de Archivos](#estructura-de-archivos)
7. [Plan de Migración a global_tickets](#plan-de-migración-a-global_tickets)

---

## 🎯 Contexto General

### Arquitectura WebSocket Actual
- **Rooms Específicas por Ticket:** Cada chat usa rooms individuales
  - `chat_analista_cliente_{ticket_id}`
  - `chat_supervisor_analista_{ticket_id}`
- **Join/Leave Manual:** Usuarios deben unirse explícitamente a cada room
- **Sincronización:** Tiempo real mediante eventos específicos

### Arquitectura Objetivo (Opción 1 - Recomendada)
- **Room Global:** `global_tickets` - Todos los eventos de chat se emiten aquí
- **Filtrado:** Frontend filtra eventos por permisos y participantes
- **Sincronización:** Mismo patrón que tickets
- **Seguridad Futura:** JWT middleware para validación en backend

### Tipos de Chat

**Chat 1: Comentarios (3 Roles)**
- Participantes: Cliente + Analista + Supervisor
- Propósito: Comunicación grupal sobre el ticket
- Almacenamiento: Tabla `Comentarios` (sin prefijo especial)
- Acceso: Todos los roles involucrados en el ticket

**Chat 2: Analista-Cliente (2 Roles)**
- Participantes: Analista ↔ Cliente
- Propósito: Comunicación directa para resolver el ticket
- Almacenamiento: Tabla `Comentarios` con prefijo `CHAT_ANALISTA_CLIENTE:`
- Acceso: Solo analista asignado y cliente dueño

**Chat 3: Supervisor-Analista (2 Roles)**
- Participantes: Supervisor ↔ Analista
- Propósito: Coordinación y supervisión del trabajo
- Almacenamiento: Tabla `Comentarios` con prefijo `CHAT_SUPERVISOR_ANALISTA:`
- Acceso: Solo supervisor asignado y analista asignado

### Principios de Diseño
1. **Backend emite, frontend filtra** - Consistencia con tickets
2. **Sin gestión manual de rooms** - Simplicidad
3. **Estado único en BD** - Comentarios con prefijo especial
4. **Metadata de participantes** - Para filtrado correcto

---

## 🏗️ Arquitectura Actual de Chats

### Almacenamiento en Base de Datos

**Tabla:** `Comentarios`

**Tipos de Mensajes:**
1. **Comentarios (Chat 3 Roles):** Sin prefijo - Visibles para cliente, analista y supervisor
2. **Chat Analista-Cliente:** Prefijo `CHAT_ANALISTA_CLIENTE:` - Solo analista y cliente
3. **Chat Supervisor-Analista:** Prefijo `CHAT_SUPERVISOR_ANALISTA:` - Solo supervisor y analista

**Campos Relevantes:**
- `id_ticket` - Ticket al que pertenece el mensaje
- `texto` - Mensaje (con o sin prefijo según el tipo)
- `fecha_comentario` - Timestamp del mensaje
- `id_cliente` - ID del cliente (si es autor)
- `id_analista` - ID del analista (si es autor)
- `id_supervisor` - ID del supervisor (si es autor)
- `id_gestion` - ID de gestión (opcional)

### Eventos WebSocket Actuales

**Comentarios (Chat 3 Roles):**
- `nuevo_comentario` - Evento emitido a `global_tickets`
- `comentario_agregado` - Evento crítico emitido a `room_ticket_{ticket_id}`

**Chat Analista-Cliente:**
- `nuevo_mensaje_chat_analista_cliente` - Evento específico del chat
- `nuevo_mensaje_chat` - Evento general (emitido a `room_ticket_{ticket_id}`)

**Chat Supervisor-Analista:**
- `nuevo_mensaje_chat_supervisor_analista` - Evento específico del chat
- `nuevo_mensaje_chat` - Evento general (emitido a `room_ticket_{ticket_id}`)

---

## 💬 CHAT 1: Comentarios (3 Roles)

### 1.1 Contexto

**Participantes:** Cliente + Analista + Supervisor  
**Propósito:** Comunicación grupal sobre el progreso del ticket  
**Acceso:** Todos los roles involucrados en el ticket  
**Almacenamiento:** Sin prefijo especial en `texto`

> ⚠️ **IMPORTANTE:** Este chat YA usa `global_tickets` - No requiere migración

---

### 1.2 Cargar Comentarios del Ticket

**Método:** GET  
**Endpoint:** `/api/tickets/{id}/comentarios`

#### Backend
- **Ruta:** `src/api/routes/comentario_routes.py`
  - Función: `get_ticket_comentarios()` (L25-56)
  - Decorador: `@require_role(['cliente', 'analista', 'supervisor', 'administrador'])`
  - Validación de permisos:
    - Cliente: Solo sus propios tickets (L38-39)
    - Analista: Solo tickets asignados a él (L42-46)
    - Supervisor/Admin: Todos los tickets
  - Query: Filtra por `id_ticket`, ordena por `fecha_comentario` (L48-49)

#### Frontend - Página Completa
- **Componente:** `src/front/pages/ComentariosTicket.jsx`
  - Hook: `useComentariosData()` (L24-42)
  - Función: `cargarDatos()` en hook
  - Estado: `comentarios`, `historialTicket`

#### Frontend - Componente Embebido
- **Componente:** `src/front/components/ComentariosTicketEmbedded.jsx`
  - Hook: `useComentariosData()` (L30-48)
  - Uso: Dentro de `ClientePage.jsx`, `AnalistaPage.jsx`, `SupervisorPage.jsx`

---

### 1.3 Agregar Comentario

**Método:** POST  
**Endpoint:** `/api/comentarios`  
**Body:** `{ id_ticket, texto, [id_gestion] }`

#### Backend
- **Ruta:** `src/api/routes/comentario_routes.py`
  - Función: `create_comentario()` (L59-120)
  - Decorador: `@require_role(['analista', 'supervisor', 'cliente', 'administrador'])`
  - Lógica de autor: Determina automáticamente según rol del usuario (L69-72)
  - Commit: Guarda en BD (L82)

- **Emisión WebSocket:** `src/api/routes/comentario_routes.py`
  - **YA USA global_tickets** ✅ (L87-95)
  - Evento: `nuevo_comentario` (L90)
  - Room: `global_tickets` (L95)
  - Evento crítico: `comentario_agregado` a `room_ticket_{ticket_id}` (L100)

#### Frontend - Página Completa
- **Componente:** `src/front/pages/ComentariosTicket.jsx`
  - Hook: `useComentariosTranscripcion()` (L44-54)
  - Función: `agregarComentario()` en `useComentariosData`
  - Componente: `<ComentarioForm>` (L161-170)

#### Frontend - Componente Embebido
- **Componente:** `src/front/components/ComentariosTicketEmbedded.jsx`
  - Hook: `useComentariosTranscripcion()` (L51-61)
  - Función: `agregarComentario()` en `useComentariosData`
  - Componente: `<ComentarioForm>` (L189-197)

---

### 1.4 Sincronización en Tiempo Real

#### Backend
- **Emisión:** `src/api/routes/comentario_routes.py` (L87-100)
  - **YA USA global_tickets** ✅
  - Emite a `global_tickets` (todos reciben)
  - También emite evento crítico a room específica (compatibilidad)

#### Frontend - Hook WebSocket
- **Hook:** `src/front/pages/comentarios/hooks/useComentariosWebSocket.js`
  - Join Room: `joinTicketRoom()` (línea a verificar)
  - Listener: `socket.on('nuevo_comentario')` (línea a verificar)
  - Handler: Recarga `cargarDatos(false)` al recibir evento
  - Leave Room: `leaveTicketRoom()` en cleanup

---

### 1.5 Acceso al Chat de Comentarios

#### Cliente
- **Dashboard:** `src/front/protectedViewsRol/cliente/ClientePage.jsx`
  - Vista: `activeView.startsWith('comentarios-')`
  - Componente: `<ComentariosTicketEmbedded>`
  - Botón: En `TicketRow.jsx` - "Ver Comentarios"

#### Analista
- **Dashboard:** `src/front/protectedViewsRol/analista/AnalistaPage.jsx`
  - Vista: Similar a cliente
  - Componente: `<ComentariosTicketEmbedded>`

#### Supervisor
- **Dashboard:** `src/front/protectedViewsRol/supervisor/SupervisorPage.jsx`
  - Vista: Similar a cliente y analista
  - Componente: `<ComentariosTicketEmbedded>`

#### Página Completa
- **Ruta:** `/ticket/:ticketId/comentarios`
- **Componente:** `ComentariosTicket.jsx`
- **Acceso:** Todos los roles

---

## 💬 CHAT 2: Analista-Cliente

### 2.1 Contexto

**Participantes:** Analista ↔ Cliente  
**Propósito:** Comunicación directa para resolver el ticket  
**Acceso:** Solo analista asignado y cliente dueño del ticket  
**Almacenamiento:** Prefijo `CHAT_ANALISTA_CLIENTE:` en `texto`

---

### 2.2 Cargar Mensajes del Chat

**Método:** GET  
**Endpoint:** `/api/tickets/{ticket_id}/chat-analista-cliente`

#### Backend
- **Ruta:** `src/api/routes/chat_routes.py`
  - Función: `obtener_chat_analista_cliente()` (L16-60)
  - Decorador: `@require_auth`
  - Query: Filtra comentarios con prefijo `CHAT_ANALISTA_CLIENTE:`
  - Orden: Ascendente por `fecha_comentario`

#### Frontend - Página Completa
- **Componente:** `src/front/pages/ChatAnalistaCliente.jsx`
  - Función: `cargarMensajes()` (L191-213)
  - Estado: `mensajes` (L34)
  - Loading: `loading` (L36)

#### Frontend - Componente Embebido
- **Componente:** `src/front/components/ChatAnalistaClienteEmbedded.jsx`
  - Función: `cargarMensajes()` (L133-155)
  - Uso: Dentro de `ClientePage.jsx` y `AnalistaPage.jsx`

---

### 2.3 Enviar Mensaje

**Método:** POST  
**Endpoint:** `/api/chat-analista-cliente`  
**Body:** `{ id_ticket, mensaje }`

#### Backend
- **Ruta:** `src/api/routes/chat_routes.py`
  - Función: `enviar_mensaje_analista_cliente()` (L195-263)
  - Decorador: `@require_auth`
  - Validación: Solo analistas y clientes pueden enviar
  - Prefijo: Agrega `CHAT_ANALISTA_CLIENTE:` al mensaje
  - Commit: Guarda en BD

- **Emisión WebSocket:** `src/api/routes/chat_routes.py`
  - Room específica: `chat_analista_cliente_{ticket_id}` (L228)
  - Evento: `nuevo_mensaje_chat_analista_cliente` (L228-237)
  - Room general: `room_ticket_{ticket_id}` (L240)
  - Evento: `nuevo_mensaje_chat` (L240-249)

#### Frontend - Página Completa
- **Componente:** `src/front/pages/ChatAnalistaCliente.jsx`
  - Función: `enviarMensaje()` (L215-263)
  - Input: `nuevoMensaje` (L35)
  - Método: POST a `/api/chat-analista-cliente`
  - Recarga: `cargarMensajes(false)` después de enviar

#### Frontend - Componente Embebido
- **Componente:** `src/front/components/ChatAnalistaClienteEmbedded.jsx`
  - Función: `enviarMensaje()` (L157-205)

---

### 1.4 Sincronización en Tiempo Real

#### Backend
- **Emisión:** `src/api/routes/chat_routes.py` (L228-249)
  - Emite a 2 rooms simultáneamente
  - Room específica para listeners del chat
  - Room general del ticket para sincronización

#### Frontend - Página Completa
- **Componente:** `src/front/pages/ChatAnalistaCliente.jsx`
  - Join Room: `joinChatAnalistaCliente()` (L168)
  - Listener: `socket.on('nuevo_mensaje_chat_analista_cliente')` (L175)
  - Handler: `handleNuevoMensaje()` (L172-178)
  - Leave Room: `leaveChatAnalistaCliente()` (L183)
  - Cleanup: useEffect cleanup (L180-185)

#### Frontend - Componente Embebido
- **Componente:** `src/front/components/ChatAnalistaClienteEmbedded.jsx`
  - Join Room: `joinChatAnalistaCliente()` (L110)
  - Listener: `socket.on('nuevo_mensaje_chat_analista_cliente')` (L119)
  - Handler: `handleNuevoMensaje()` (L114-120)
  - Leave Room: `leaveChatAnalistaCliente()` (L125)

---

### 1.5 Acceso al Chat

#### Cliente
- **Dashboard:** `src/front/protectedViewsRol/cliente/ClientePage.jsx`
  - Vista: `activeView.startsWith('chat-')` (L249)
  - Componente: `<ChatAnalistaClienteEmbedded>` (L249-253)
  - Botón: En `TicketRow.jsx` (L193-198, L313-318)

- **Página Completa:** `src/front/pages/ChatAnalistaCliente.jsx`
  - Ruta: `/ticket/:ticketId/chat-analista-cliente`
  - Acceso: Roles `['analista', 'cliente']`

#### Analista
- **Dashboard:** `src/front/protectedViewsRol/analista/AnalistaPage.jsx`
  - Vista: Similar a cliente
  - Componente: `<ChatAnalistaClienteEmbedded>`

---

## 💬 CHAT 2: Supervisor-Analista

### 2.1 Contexto

**Participantes:** Supervisor ↔ Analista  
**Propósito:** Coordinación y supervisión del trabajo  
**Acceso:** Solo supervisor asignado y analista asignado al ticket

---

### 2.2 Cargar Mensajes del Chat

**Método:** GET  
**Endpoint:** `/api/tickets/{ticket_id}/chat-supervisor-analista`

#### Backend
- **Ruta:** `src/api/routes/chat_routes.py`
  - Función: `obtener_chat_supervisor_analista()` (L16-60)
  - Decorador: `@require_auth`
  - Query: Filtra comentarios con prefijo `CHAT_SUPERVISOR_ANALISTA:`
  - Orden: Ascendente por `fecha_comentario`

#### Frontend - Página Completa
- **Componente:** `src/front/pages/ChatSupervisorAnalista.jsx`
  - Función: `cargarMensajes()` (L191-213)
  - Estado: `mensajes` (L34)
  - Loading: `loading` (L36)

#### Frontend - Componente Embebido
- **Componente:** `src/front/components/ChatSupervisorAnalistaEmbedded.jsx`
  - Función: `cargarMensajes()` (L133-155)
  - Uso: Dentro de `SupervisorPage.jsx` y `AnalistaPage.jsx`

---

### 2.3 Enviar Mensaje

**Método:** POST  
**Endpoint:** `/api/chat-supervisor-analista`  
**Body:** `{ id_ticket, mensaje }`

#### Backend
- **Ruta:** `src/api/routes/chat_routes.py`
  - Función: `enviar_mensaje_supervisor_analista()` (L63-131)
  - Decorador: `@require_auth`
  - Validación: Solo supervisores y analistas pueden enviar
  - Prefijo: Agrega `CHAT_SUPERVISOR_ANALISTA:` al mensaje
  - Commit: Guarda en BD

- **Emisión WebSocket:** `src/api/routes/chat_routes.py`
  - Room específica: `chat_supervisor_analista_{ticket_id}` (L103)
  - Evento: `nuevo_mensaje_chat_supervisor_analista` (L104-113)
  - Room general: `room_ticket_{ticket_id}` (L116)
  - Evento: `nuevo_mensaje_chat` (L116-125)

#### Frontend - Página Completa
- **Componente:** `src/front/pages/ChatSupervisorAnalista.jsx`
  - Función: `enviarMensaje()` (L215-263)
  - Input: `nuevoMensaje` (L35)
  - Método: POST a `/api/chat-supervisor-analista`
  - Recarga: `cargarMensajes(false)` después de enviar

#### Frontend - Componente Embebido
- **Componente:** `src/front/components/ChatSupervisorAnalistaEmbedded.jsx`
  - Función: `enviarMensaje()` (L157-205)

---

### 2.4 Sincronización en Tiempo Real

#### Backend
- **Emisión:** `src/api/routes/chat_routes.py` (L103-125)
  - Emite a 2 rooms simultáneamente
  - Room específica para listeners del chat
  - Room general del ticket para sincronización

#### Frontend - Página Completa
- **Componente:** `src/front/pages/ChatSupervisorAnalista.jsx`
  - Join Room: `joinChatSupervisorAnalista()` (L168)
  - Listener: `socket.on('nuevo_mensaje_chat_supervisor_analista')` (L175)
  - Handler: `handleNuevoMensaje()` (L172-178)
  - Leave Room: `leaveChatSupervisorAnalista()` (L183)
  - Cleanup: useEffect cleanup (L180-185)

#### Frontend - Componente Embebido
- **Componente:** `src/front/components/ChatSupervisorAnalistaEmbedded.jsx`
  - Join Room: `joinChatSupervisorAnalista()` (L110)
  - Listener: `socket.on('nuevo_mensaje_chat_supervisor_analista')` (L119)
  - Handler: `handleNuevoMensaje()` (L114-120)
  - Leave Room: `leaveChatSupervisorAnalista()` (L125)

---

### 2.5 Acceso al Chat

#### Supervisor
- **Dashboard:** `src/front/protectedViewsRol/supervisor/SupervisorPage.jsx`
  - Vista: `activeView.startsWith('supervisor-chat-')` (L258)
  - Componente: `<ChatSupervisorAnalistaEmbedded>` (L258-262)
  - Botón: En `TicketRow.jsx` (L237-241, L373-380)

- **Página Completa:** `src/front/pages/ChatSupervisorAnalista.jsx`
  - Ruta: `/ticket/:ticketId/chat-supervisor-analista`
  - Acceso: Roles `['supervisor', 'analista']`

#### Analista
- **Dashboard:** `src/front/protectedViewsRol/analista/AnalistaPage.jsx`
  - Vista: Similar a supervisor
  - Componente: `<ChatSupervisorAnalistaEmbedded>`

---

## 📁 Estructura Completa de Archivos

### Backend - Rutas

```
src/api/routes/
└── chat_routes.py
    ├── obtener_chat_analista_cliente() [L16-60]
    ├── enviar_mensaje_analista_cliente() [L195-263]
    ├── obtener_chat_supervisor_analista() [L138-182]
    └── enviar_mensaje_supervisor_analista() [L63-131]
```

### Frontend - Páginas Completas

```
src/front/pages/
├── ChatAnalistaCliente.jsx
│   ├── cargarMensajes() [L191-213]
│   ├── enviarMensaje() [L215-263]
│   ├── handleNuevoMensaje() [L172-178]
│   └── useEffect WebSocket [L161-185]
│
└── ChatSupervisorAnalista.jsx
    ├── cargarMensajes() [L191-213]
    ├── enviarMensaje() [L215-263]
    ├── handleNuevoMensaje() [L172-178]
    └── useEffect WebSocket [L161-185]
```

### Frontend - Componentes Embebidos

```
src/front/components/
├── ChatAnalistaClienteEmbedded.jsx
│   ├── cargarMensajes() [L133-155]
│   ├── enviarMensaje() [L157-205]
│   ├── handleNuevoMensaje() [L114-120]
│   └── useEffect WebSocket [L103-127]
│
└── ChatSupervisorAnalistaEmbedded.jsx
    ├── cargarMensajes() [L133-155]
    ├── enviarMensaje() [L157-205]
    ├── handleNuevoMensaje() [L114-120]
    └── useEffect WebSocket [L103-127]
```

### Frontend - Vistas de Rol

```
src/front/protectedViewsRol/
├── cliente/
│   ├── ClientePage.jsx
│   │   └── Vista chat [L249-253]
│   └── components/
│       ├── TicketRow.jsx [L193-198, L313-318]
│       └── ClienteChat.jsx (tabla de tickets con chat)
│
├── analista/
│   └── AnalistaPage.jsx
│       └── Vista chat (similar a cliente)
│
└── supervisor/
    ├── SupervisorPage.jsx
    │   └── Vista chat [L258-262]
    └── components/
        └── TicketRow.jsx [L237-241, L373-380]
```

### Frontend - Actions y Utilidades

```
src/front/store/actions/
├── chatActions.js
│   ├── loadMensajesAnalistaCliente() [L15-44]
│   ├── loadMensajesSupervisorAnalista() [L50-79]
│   ├── enviarMensajeAnalistaCliente() [L85-122]
│   └── enviarMensajeSupervisorAnalista() [L128-165]
│
└── websocketActions.js
    ├── joinChatAnalistaCliente() [L244-248]
    ├── leaveChatAnalistaCliente() [L255-259]
    ├── joinChatSupervisorAnalista() [L222-226]
    └── leaveChatSupervisorAnalista() [L233-237]
```

---

## 🚀 Plan de Migración a global_tickets

### Objetivo
Migrar de rooms específicas por ticket a `global_tickets` con filtrado en frontend.

### Fase 1: Backend - Modificar Emisión (2-3 horas)

#### Paso 1.1: Actualizar `chat_routes.py`

**Cambios en `enviar_mensaje_analista_cliente()`:**
```python
# Línea ~228: Reemplazar emisión a room específica
# ANTES:
socketio.emit('nuevo_mensaje_chat_analista_cliente', {...}, room=f'chat_analista_cliente_{ticket_id}')

# DESPUÉS:
from api.routes.utils_routes import emit_to_global
emit_to_global('nuevo_mensaje_chat', {
    'tipo': 'chat_analista_cliente',
    'ticket_id': ticket_id,
    'mensaje': mensaje,
    'autor': {...},
    'participantes': {
        'cliente_id': ticket.id_cliente,
        'analista_id': ticket.asignacion_actual.id_analista if ticket.asignacion_actual else None
    },
    'timestamp': datetime.now().isoformat()
})
```

**Cambios en `enviar_mensaje_supervisor_analista()`:**
```python
# Línea ~104: Reemplazar emisión a room específica
# ANTES:
socketio.emit('nuevo_mensaje_chat_supervisor_analista', {...}, room=f'chat_supervisor_analista_{ticket_id}')

# DESPUÉS:
emit_to_global('nuevo_mensaje_chat', {
    'tipo': 'chat_supervisor_analista',
    'ticket_id': ticket_id,
    'mensaje': mensaje,
    'autor': {...},
    'participantes': {
        'supervisor_id': ticket.asignacion_actual.id_supervisor if ticket.asignacion_actual else None,
        'analista_id': ticket.asignacion_actual.id_analista if ticket.asignacion_actual else None
    },
    'timestamp': datetime.now().isoformat()
})
```

#### Paso 1.2: Eliminar Emisión a Room General

**Eliminar líneas:**
- `enviar_mensaje_analista_cliente()`: L240-249 (emisión a `room_ticket_{ticket_id}`)
- `enviar_mensaje_supervisor_analista()`: L116-125 (emisión a `room_ticket_{ticket_id}`)

---

### Fase 2: Frontend - Actualizar Listeners (2-3 horas)

#### Paso 2.1: Modificar `useWebSocketEvents.js`

**Agregar handler para chats:**
```javascript
// Agregar listener para nuevo_mensaje_chat
socket.on('nuevo_mensaje_chat', (data) => {
    console.log('💬 Nuevo mensaje de chat:', data);
    
    // Filtrar por tipo y permisos
    if (data.tipo === 'chat_analista_cliente') {
        // Validar permisos
        if (user.role === 'cliente' && data.participantes.cliente_id === user.id) {
            // Actualizar chat
            dispatch({ type: 'CHAT_ADD_MENSAJE', payload: data });
        }
        if (user.role === 'analista' && data.participantes.analista_id === user.id) {
            // Actualizar chat
            dispatch({ type: 'CHAT_ADD_MENSAJE', payload: data });
        }
    }
    
    if (data.tipo === 'chat_supervisor_analista') {
        // Validar permisos
        if (user.role === 'supervisor' && data.participantes.supervisor_id === user.id) {
            // Actualizar chat
            dispatch({ type: 'CHAT_ADD_MENSAJE', payload: data });
        }
        if (user.role === 'analista' && data.participantes.analista_id === user.id) {
            // Actualizar chat
            dispatch({ type: 'CHAT_ADD_MENSAJE', payload: data });
        }
    }
});
```

#### Paso 2.2: Eliminar Join/Leave de Rooms Específicas

**Archivos a modificar:**
- `ChatAnalistaCliente.jsx` (L168, L183)
- `ChatSupervisorAnalista.jsx` (L168, L183)
- `ChatAnalistaClienteEmbedded.jsx` (L110, L125)
- `ChatSupervisorAnalistaEmbedded.jsx` (L110, L125)

**Cambios:**
```javascript
// ELIMINAR:
joinChatAnalistaCliente(store.websocket.socket, parseInt(ticketId));
leaveChatAnalistaCliente(socket, parseInt(ticketId));

// Ya no es necesario - todos están en global_tickets
```

#### Paso 2.3: Actualizar Listeners Específicos

**Reemplazar:**
```javascript
// ANTES:
socket.on('nuevo_mensaje_chat_analista_cliente', handleNuevoMensaje);

// DESPUÉS:
socket.on('nuevo_mensaje_chat', (data) => {
    if (data.tipo === 'chat_analista_cliente' && data.ticket_id === parseInt(ticketId)) {
        handleNuevoMensaje(data);
    }
});
```

---

### Fase 3: Testing (1-2 horas)

#### Test 1: Chat Analista-Cliente
- [ ] Cliente envía mensaje → Analista lo recibe
- [ ] Analista envía mensaje → Cliente lo recibe
- [ ] Otro cliente NO recibe mensajes
- [ ] Otro analista NO recibe mensajes

#### Test 2: Chat Supervisor-Analista
- [ ] Supervisor envía mensaje → Analista lo recibe
- [ ] Analista envía mensaje → Supervisor lo recibe
- [ ] Otro supervisor NO recibe mensajes
- [ ] Cliente NO recibe mensajes

#### Test 3: Múltiples Usuarios
- [ ] 2 chats simultáneos funcionan correctamente
- [ ] Mensajes no se cruzan entre chats
- [ ] Sincronización en tiempo real funciona

---

### Fase 4: Limpieza (1 hora)

#### Eliminar Código Obsoleto

**Backend:**
- [ ] Eliminar funciones de join/leave de rooms específicas en `app.py`
- [ ] Eliminar rooms específicas de chat

**Frontend:**
- [ ] Eliminar `joinChatAnalistaCliente()` de `websocketActions.js`
- [ ] Eliminar `leaveChatAnalistaCliente()` de `websocketActions.js`
- [ ] Eliminar `joinChatSupervisorAnalista()` de `websocketActions.js`
- [ ] Eliminar `leaveChatSupervisorAnalista()` de `websocketActions.js`

---

## 📝 Notas Importantes

### Diferencias con Tickets

**Almacenamiento:**
- Tickets: Tabla `Ticket` con campos específicos
- Chats: Tabla `Comentarios` con prefijos en `texto`

**Participantes:**
- Tickets: Múltiples roles pueden ver (según estado)
- Chats: Solo 2 participantes específicos

**Filtrado:**
- Tickets: Por rol y asignación
- Chats: Por participantes exactos del chat

### Seguridad Actual

**Nivel:** 6/10 ⚠️

**Vulnerabilidades:**
- Filtrado solo en frontend
- Cliente malicioso puede modificar código y ver otros chats
- No hay auditoría de accesos

**Solución Futura:**
- Implementar JWT middleware (ver `mapaDeDatos/websockets/seguridadSugerencias.md`)
- Validar permisos en backend antes de emitir
- Metadata de participantes en cada evento

---

## 🔄 Historial de Actualizaciones

### 2025-12-29 - Actualización: Agregado Chat de 3 Roles
- ✅ Documentados 3 chats existentes:
  1. **Comentarios (3 Roles):** Cliente + Analista + Supervisor
  2. **Analista-Cliente (2 Roles):** Comunicación directa
  3. **Supervisor-Analista (2 Roles):** Coordinación
- ✅ Identificado que Comentarios YA usa `global_tickets` ✅
- ✅ Mapeadas todas las rutas, componentes y handlers
- ✅ Agregado plan de migración para los 2 chats restantes

### 2025-12-29 - Creación del Documento
- ✅ Documentados 2 chats existentes: Analista-Cliente y Supervisor-Analista
- ✅ Mapeadas todas las rutas, componentes y handlers
- ✅ Agregado plan de migración a `global_tickets`
- ✅ Identificadas líneas exactas de código

---

**Última actualización:** 2025-12-29  
**Mantenido por:** Equipo de desarrollo TiBACK  
**Chats documentados:** 3 (Comentarios 3 Roles, Analista-Cliente, Supervisor-Analista)  
**Estado:** Comentarios usa `global_tickets` ✅ | Otros 2 chats usan rooms específicas ⚠️

