# 🚀 Plan Incremental de Migración de Chats a `global_tickets`

**Fecha de Creación:** 2025-12-29  
**Objetivo:** Migrar chats de rooms específicas a `global_tickets`  
**Estrategia:** Incremental con checkpoints de seguridad  
**Riesgo:** 2/10 (Muy Bajo)

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual](#estado-actual)
3. [Fase 1: Backend - Emisión Dual](#fase-1-backend---emisión-dual)
4. [Checkpoint 1: Verificar Compatibilidad](#checkpoint-1-verificar-compatibilidad)
5. [Fase 2: Frontend - Actualizar Listeners](#fase-2-frontend---actualizar-listeners)
6. [Checkpoint 2: Verificar Funcionalidad](#checkpoint-2-verificar-funcionalidad)
7. [Fase 3: Limpieza de Código](#fase-3-limpieza-de-código)
8. [Checkpoint 3: Verificación Final](#checkpoint-3-verificación-final)
9. [Rollback Plan](#rollback-plan)

---

## 🎯 Resumen Ejecutivo

### Objetivo
Migrar 2 chats de rooms específicas a `global_tickets`:
1. **Chat Analista-Cliente** (2 roles)
2. **Chat Supervisor-Analista** (2 roles)

> ℹ️ **Nota:** El chat de Comentarios (3 roles) YA usa `global_tickets` - No requiere migración.

### Estrategia
**Migración incremental en 3 fases** con checkpoints de seguridad después de cada fase.

### Duración Estimada
- **Fase 1:** 1-2 horas
- **Checkpoint 1:** 30 minutos
- **Fase 2:** 2-3 horas
- **Checkpoint 2:** 30 minutos
- **Fase 3:** 1 hora
- **Checkpoint 3:** 30 minutos
- **TOTAL:** 5-7 horas

---

## 📊 Estado Actual

### Chats Existentes

| Chat | Participantes | Room Actual | Estado |
|------|---------------|-------------|--------|
| **Comentarios** | Cliente + Analista + Supervisor | `global_tickets` | ✅ Ya migrado |
| **Analista-Cliente** | Analista ↔ Cliente | `chat_analista_cliente_{ticket_id}` | ⚠️ Requiere migración |
| **Supervisor-Analista** | Supervisor ↔ Analista | `chat_supervisor_analista_{ticket_id}` | ⚠️ Requiere migración |

### Archivos a Modificar

**Backend (2 archivos):**
- `src/api/routes/chat_routes.py`

**Frontend (4 archivos):**
- `src/front/pages/ChatAnalistaCliente.jsx`
- `src/front/pages/ChatSupervisorAnalista.jsx`
- `src/front/components/ChatAnalistaClienteEmbedded.jsx`
- `src/front/components/ChatSupervisorAnalistaEmbedded.jsx`

**Archivos que NO se tocan:**
- ✅ `src/api/routes/ticket_routes.py` - Tickets
- ✅ `src/api/routes/ticket_estado_routes.py` - Estados de tickets
- ✅ `src/front/hooks/useWebSocketEvents.js` - Listeners de tickets
- ✅ `src/front/protectedViewsRol/*/hooks/use*WebSocket.js` - Lógica de tickets

---

## 🔧 FASE 1: Backend - Emisión Dual

**Duración:** 1-2 horas  
**Objetivo:** Backend emite a AMBOS lugares (room específica + global_tickets)  
**Riesgo:** 0/10 (Sin riesgo - solo agregamos código)

### Paso 1.1: Backup del Código

```bash
# Crear rama de trabajo
git checkout -b feature/migrate-chats-to-global-tickets

# Commit inicial
git add .
git commit -m "Backup antes de migración de chats a global_tickets"
```

---

### Paso 1.2: Modificar `chat_routes.py` - Chat Analista-Cliente

**Archivo:** `src/api/routes/chat_routes.py`  
**Función:** `enviar_mensaje_analista_cliente()` (L195-263)

**Cambio en línea ~228:**

```python
# ANTES (línea 228-237):
socketio.emit('nuevo_mensaje_chat_analista_cliente', {
    'ticket_id': ticket_id,
    'mensaje': mensaje,
    'autor': {...},
    'fecha': datetime.now().isoformat()
}, room=f'chat_analista_cliente_{ticket_id}')

# DESPUÉS (AGREGAR emisión a global_tickets):
# 1. Emisión a room específica (MANTENER por ahora)
socketio.emit('nuevo_mensaje_chat_analista_cliente', {
    'ticket_id': ticket_id,
    'mensaje': mensaje,
    'autor': {
        'id': user_info['id'],
        'nombre': user_info.get('nombre', 'Usuario'),
        'rol': user_info['role']
    },
    'fecha': datetime.now().isoformat()
}, room=f'chat_analista_cliente_{ticket_id}')

# 2. NUEVA emisión a global_tickets
from api.routes.utils_routes import emit_to_global
emit_to_global('nuevo_mensaje_chat', {
    'tipo': 'chat_analista_cliente',
    'ticket_id': ticket_id,
    'mensaje': mensaje,
    'autor': {
        'id': user_info['id'],
        'nombre': user_info.get('nombre', 'Usuario'),
        'rol': user_info['role']
    },
    'participantes': {
        'cliente_id': ticket.id_cliente,
        'analista_id': ticket.asignacion_actual.id_analista if ticket.asignacion_actual else None
    },
    'fecha': datetime.now().isoformat()
})
```

**Cambio en línea ~240-249:**

```python
# ELIMINAR emisión a room_ticket_{ticket_id} (ya no es necesaria)
# general_room = f'room_ticket_{ticket_id}'
# socketio.emit('nuevo_mensaje_chat', {...}, room=general_room)
```

---

### Paso 1.3: Modificar `chat_routes.py` - Chat Supervisor-Analista

**Archivo:** `src/api/routes/chat_routes.py`  
**Función:** `enviar_mensaje_supervisor_analista()` (L63-131)

**Cambio en línea ~104:**

```python
# ANTES (línea 104-113):
socketio.emit('nuevo_mensaje_chat_supervisor_analista', {
    'ticket_id': ticket_id,
    'mensaje': mensaje,
    'autor': {...},
    'fecha': datetime.now().isoformat()
}, room=f'chat_supervisor_analista_{ticket_id}')

# DESPUÉS (AGREGAR emisión a global_tickets):
# 1. Emisión a room específica (MANTENER por ahora)
socketio.emit('nuevo_mensaje_chat_supervisor_analista', {
    'ticket_id': ticket_id,
    'mensaje': mensaje,
    'autor': {
        'id': user_info['id'],
        'nombre': user_info.get('nombre', 'Usuario'),
        'rol': user_info['role']
    },
    'fecha': datetime.now().isoformat()
}, room=f'chat_supervisor_analista_{ticket_id}')

# 2. NUEVA emisión a global_tickets
from api.routes.utils_routes import emit_to_global
emit_to_global('nuevo_mensaje_chat', {
    'tipo': 'chat_supervisor_analista',
    'ticket_id': ticket_id,
    'mensaje': mensaje,
    'autor': {
        'id': user_info['id'],
        'nombre': user_info.get('nombre', 'Usuario'),
        'rol': user_info['role']
    },
    'participantes': {
        'supervisor_id': ticket.asignacion_actual.id_supervisor if ticket.asignacion_actual else None,
        'analista_id': ticket.asignacion_actual.id_analista if ticket.asignacion_actual else None
    },
    'fecha': datetime.now().isoformat()
})
```

**Cambio en línea ~116-125:**

```python
# ELIMINAR emisión a room_ticket_{ticket_id} (ya no es necesaria)
# general_room = f'room_ticket_{ticket_id}'
# socketio.emit('nuevo_mensaje_chat', {...}, room=general_room)
```

---

### Paso 1.4: Commit de Cambios

```bash
git add src/api/routes/chat_routes.py
git commit -m "Fase 1: Backend emite chats a global_tickets (emisión dual)"
```

---

## ✅ CHECKPOINT 1: Verificar Compatibilidad

**Duración:** 30 minutos  
**Objetivo:** Confirmar que los cambios NO rompieron nada

### Test 1: Tickets Siguen Funcionando

- [ ] Crear un ticket nuevo
- [ ] Asignar ticket a analista
- [ ] Cambiar estado del ticket
- [ ] Verificar que TODOS los eventos de tickets funcionan en tiempo real

**Resultado Esperado:** ✅ Tickets funcionan exactamente igual que antes

---

### Test 2: Chats Siguen Funcionando (Modo Viejo)

- [ ] Abrir chat Analista-Cliente
- [ ] Enviar mensaje desde analista
- [ ] Verificar que cliente lo recibe
- [ ] Enviar mensaje desde cliente
- [ ] Verificar que analista lo recibe

**Resultado Esperado:** ✅ Chats funcionan exactamente igual que antes

---

### Test 3: Verificar Emisión Dual en Logs

```bash
# En el servidor, verificar logs
# Deberías ver AMBAS emisiones:
✅ WebSocket: nuevo_mensaje_chat_analista_cliente → chat_analista_cliente_123
✅ WebSocket: nuevo_mensaje_chat → global_tickets
```

**Resultado Esperado:** ✅ Se emite a ambos lugares

---

### ⚠️ Si Checkpoint 1 Falla

```bash
# Revertir cambios
git reset --hard HEAD~1
git checkout main

# Revisar qué salió mal
# Corregir y volver a intentar Fase 1
```

---

## 🔧 FASE 2: Frontend - Actualizar Listeners

**Duración:** 2-3 horas  
**Objetivo:** Frontend escucha desde `global_tickets` en lugar de rooms específicas  
**Riesgo:** 1/10 (Muy bajo - backend sigue emitiendo a ambos lugares)

### Paso 2.1: Actualizar `ChatAnalistaCliente.jsx`

**Archivo:** `src/front/pages/ChatAnalistaCliente.jsx`

**Cambio en línea ~161-185:**

```javascript
// ANTES:
useEffect(() => {
    if (ticketId && store.websocket.socket && store.websocket.connected) {
        // Unirse al room general del ticket
        joinTicketRoom(store.websocket.socket, parseInt(ticketId));
        // Unirse al room específico del chat analista-cliente
        joinChatAnalistaCliente(store.websocket.socket, parseInt(ticketId));

        const socket = store.websocket.socket;

        const handleNuevoMensaje = (data) => {
            if (data.ticket_id === parseInt(ticketId)) {
                setSincronizando(true);
                cargarMensajes(false).finally(() => setSincronizando(false));
            }
        };

        socket.on('nuevo_mensaje_chat_analista_cliente', handleNuevoMensaje);

        return () => {
            socket.off('nuevo_mensaje_chat_analista_cliente', handleNuevoMensaje);
            leaveTicketRoom(socket, parseInt(ticketId));
            leaveChatAnalistaCliente(socket, parseInt(ticketId));
        };
    }
}, [ticketId, store.websocket.socket, store.websocket.connected]);

// DESPUÉS:
useEffect(() => {
    if (ticketId && store.websocket.socket && store.websocket.connected) {
        // Solo unirse al room general (ya no necesitamos room específica)
        joinTicketRoom(store.websocket.socket, parseInt(ticketId));

        const socket = store.websocket.socket;

        const handleNuevoMensaje = (data) => {
            // Filtrar por tipo y ticket_id
            if (data.tipo === 'chat_analista_cliente' && data.ticket_id === parseInt(ticketId)) {
                // Validar permisos (filtrado en frontend)
                const userRole = store.auth.user?.role || tokenUtils.getRole(store.auth.token);
                const userId = store.auth.user?.id || tokenUtils.getUserId(store.auth.token);
                
                // Solo mostrar si el usuario es participante
                const esParticipante = (
                    (userRole === 'cliente' && data.participantes?.cliente_id === userId) ||
                    (userRole === 'analista' && data.participantes?.analista_id === userId) ||
                    userRole === 'administrador'
                );

                if (esParticipante) {
                    setSincronizando(true);
                    cargarMensajes(false).finally(() => setSincronizando(false));
                }
            }
        };

        // Escuchar evento genérico de chat desde global_tickets
        socket.on('nuevo_mensaje_chat', handleNuevoMensaje);

        return () => {
            socket.off('nuevo_mensaje_chat', handleNuevoMensaje);
            leaveTicketRoom(socket, parseInt(ticketId));
            // Ya no necesitamos leave de chat específico
        };
    }
}, [ticketId, store.websocket.socket, store.websocket.connected]);
```

---

### Paso 2.2: Actualizar `ChatAnalistaClienteEmbedded.jsx`

**Archivo:** `src/front/components/ChatAnalistaClienteEmbedded.jsx`

**Aplicar el mismo cambio que en Paso 2.1** (líneas ~103-127)

---

### Paso 2.3: Actualizar `ChatSupervisorAnalista.jsx`

**Archivo:** `src/front/pages/ChatSupervisorAnalista.jsx`

**Cambio en línea ~161-185:**

```javascript
// ANTES:
useEffect(() => {
    if (ticketId && store.websocket.socket && store.websocket.connected) {
        joinTicketRoom(store.websocket.socket, parseInt(ticketId));
        joinChatSupervisorAnalista(store.websocket.socket, parseInt(ticketId));

        const socket = store.websocket.socket;

        const handleNuevoMensaje = (data) => {
            if (data.ticket_id === parseInt(ticketId)) {
                setSincronizando(true);
                cargarMensajes(false).finally(() => setSincronizando(false));
            }
        };

        socket.on('nuevo_mensaje_chat_supervisor_analista', handleNuevoMensaje);

        return () => {
            socket.off('nuevo_mensaje_chat_supervisor_analista', handleNuevoMensaje);
            leaveTicketRoom(socket, parseInt(ticketId));
            leaveChatSupervisorAnalista(socket, parseInt(ticketId));
        };
    }
}, [ticketId, store.websocket.socket, store.websocket.connected]);

// DESPUÉS:
useEffect(() => {
    if (ticketId && store.websocket.socket && store.websocket.connected) {
        // Solo unirse al room general
        joinTicketRoom(store.websocket.socket, parseInt(ticketId));

        const socket = store.websocket.socket;

        const handleNuevoMensaje = (data) => {
            // Filtrar por tipo y ticket_id
            if (data.tipo === 'chat_supervisor_analista' && data.ticket_id === parseInt(ticketId)) {
                // Validar permisos
                const userRole = store.auth.user?.role || tokenUtils.getRole(store.auth.token);
                const userId = store.auth.user?.id || tokenUtils.getUserId(store.auth.token);
                
                const esParticipante = (
                    (userRole === 'supervisor' && data.participantes?.supervisor_id === userId) ||
                    (userRole === 'analista' && data.participantes?.analista_id === userId) ||
                    userRole === 'administrador'
                );

                if (esParticipante) {
                    setSincronizando(true);
                    cargarMensajes(false).finally(() => setSincronizando(false));
                }
            }
        };

        socket.on('nuevo_mensaje_chat', handleNuevoMensaje);

        return () => {
            socket.off('nuevo_mensaje_chat', handleNuevoMensaje);
            leaveTicketRoom(socket, parseInt(ticketId));
        };
    }
}, [ticketId, store.websocket.socket, store.websocket.connected]);
```

---

### Paso 2.4: Actualizar `ChatSupervisorAnalistaEmbedded.jsx`

**Archivo:** `src/front/components/ChatSupervisorAnalistaEmbedded.jsx`

**Aplicar el mismo cambio que en Paso 2.3** (líneas ~103-127)

---

### Paso 2.5: Commit de Cambios

```bash
git add src/front/pages/ChatAnalistaCliente.jsx
git add src/front/pages/ChatSupervisorAnalista.jsx
git add src/front/components/ChatAnalistaClienteEmbedded.jsx
git add src/front/components/ChatSupervisorAnalistaEmbedded.jsx
git commit -m "Fase 2: Frontend escucha chats desde global_tickets con filtrado"
```

---

## ✅ CHECKPOINT 2: Verificar Funcionalidad

**Duración:** 30 minutos  
**Objetivo:** Confirmar que chats funcionan con el nuevo sistema

### Test 1: Tickets Siguen Funcionando

- [ ] Crear un ticket nuevo
- [ ] Asignar ticket a analista
- [ ] Cambiar estado del ticket
- [ ] Verificar sincronización en tiempo real

**Resultado Esperado:** ✅ Tickets funcionan perfectamente

---

### Test 2: Chat Analista-Cliente con Nuevo Sistema

- [ ] Abrir chat Analista-Cliente
- [ ] Enviar mensaje desde analista
- [ ] Verificar que cliente lo recibe en tiempo real
- [ ] Enviar mensaje desde cliente
- [ ] Verificar que analista lo recibe en tiempo real
- [ ] Abrir otro chat (ticket diferente)
- [ ] Verificar que NO se cruzan mensajes

**Resultado Esperado:** ✅ Chat funciona con filtrado correcto

---

### Test 3: Chat Supervisor-Analista con Nuevo Sistema

- [ ] Abrir chat Supervisor-Analista
- [ ] Enviar mensaje desde supervisor
- [ ] Verificar que analista lo recibe
- [ ] Enviar mensaje desde analista
- [ ] Verificar que supervisor lo recibe
- [ ] Verificar que cliente NO ve estos mensajes

**Resultado Esperado:** ✅ Chat funciona con filtrado correcto

---

### Test 4: Filtrado de Permisos

- [ ] Cliente A abre chat de su ticket
- [ ] Cliente B NO debe ver mensajes del ticket de Cliente A
- [ ] Analista asignado ve mensajes
- [ ] Analista NO asignado NO ve mensajes

**Resultado Esperado:** ✅ Filtrado funciona correctamente

---

### Test 5: Múltiples Chats Simultáneos

- [ ] Abrir 2 chats Analista-Cliente diferentes
- [ ] Enviar mensajes en ambos
- [ ] Verificar que no se cruzan
- [ ] Verificar sincronización en ambos

**Resultado Esperado:** ✅ Múltiples chats funcionan sin problemas

---

### ⚠️ Si Checkpoint 2 Falla

```bash
# Revertir solo Fase 2
git reset --hard HEAD~1

# Backend sigue emitiendo a ambos lugares
# Chats funcionan con sistema viejo
# Revisar qué salió mal en frontend
```

---

## 🧹 FASE 3: Limpieza de Código

**Duración:** 1 hora  
**Objetivo:** Eliminar código obsoleto de rooms específicas  
**Riesgo:** 0/10 (Todo ya funciona con nuevo sistema)

### Paso 3.1: Eliminar Emisión a Rooms Específicas en Backend

**Archivo:** `src/api/routes/chat_routes.py`

**En `enviar_mensaje_analista_cliente()` (línea ~228-237):**

```python
# ELIMINAR estas líneas:
# socketio.emit('nuevo_mensaje_chat_analista_cliente', {
#     'ticket_id': ticket_id,
#     'mensaje': mensaje,
#     'autor': {...},
#     'fecha': datetime.now().isoformat()
# }, room=f'chat_analista_cliente_{ticket_id}')

# MANTENER solo:
emit_to_global('nuevo_mensaje_chat', {
    'tipo': 'chat_analista_cliente',
    ...
})
```

**En `enviar_mensaje_supervisor_analista()` (línea ~104-113):**

```python
# ELIMINAR estas líneas:
# socketio.emit('nuevo_mensaje_chat_supervisor_analista', {
#     'ticket_id': ticket_id,
#     'mensaje': mensaje,
#     'autor': {...},
#     'fecha': datetime.now().isoformat()
# }, room=f'chat_supervisor_analista_{ticket_id}')

# MANTENER solo:
emit_to_global('nuevo_mensaje_chat', {
    'tipo': 'chat_supervisor_analista',
    ...
})
```

---

### Paso 3.2: Eliminar Funciones de Join/Leave en Frontend

**Archivo:** `src/front/store/actions/websocketActions.js`

**Eliminar funciones (líneas ~222-259):**

```javascript
// ELIMINAR:
// joinChatSupervisorAnalista: (socket, ticketId) => { ... }
// leaveChatSupervisorAnalista: (socket, ticketId) => { ... }
// joinChatAnalistaCliente: (socket, ticketId) => { ... }
// leaveChatAnalistaCliente: (socket, ticketId) => { ... }
```

---

### Paso 3.3: Eliminar Handlers de Rooms en Backend (Opcional)

**Archivo:** `src/api/__init__.py` o donde estén definidos

**Buscar y eliminar:**

```python
# ELIMINAR si existen:
# @socketio.on('join_chat_analista_cliente')
# def handle_join_chat_analista_cliente(data): ...

# @socketio.on('leave_chat_analista_cliente')
# def handle_leave_chat_analista_cliente(data): ...

# @socketio.on('join_chat_supervisor_analista')
# def handle_join_chat_supervisor_analista(data): ...

# @socketio.on('leave_chat_supervisor_analista')
# def handle_leave_chat_supervisor_analista(data): ...
```

---

### Paso 3.4: Commit de Limpieza

```bash
git add src/api/routes/chat_routes.py
git add src/front/store/actions/websocketActions.js
git commit -m "Fase 3: Limpieza - Eliminado código obsoleto de rooms específicas"
```

---

## ✅ CHECKPOINT 3: Verificación Final

**Duración:** 30 minutos  
**Objetivo:** Confirmar que TODO funciona sin código obsoleto

### Test Completo del Sistema

- [ ] **Tickets:** Crear, asignar, cambiar estado → ✅ Funciona
- [ ] **Comentarios (3 roles):** Agregar comentario → ✅ Funciona
- [ ] **Chat Analista-Cliente:** Enviar mensajes → ✅ Funciona
- [ ] **Chat Supervisor-Analista:** Enviar mensajes → ✅ Funciona
- [ ] **Filtrado:** Solo participantes ven mensajes → ✅ Funciona
- [ ] **Múltiples chats:** No se cruzan mensajes → ✅ Funciona
- [ ] **Sincronización:** Tiempo real funciona → ✅ Funciona

---

### Verificar Logs del Servidor

```bash
# Deberías ver SOLO:
✅ WebSocket: nuevo_mensaje_chat → global_tickets
✅ WebSocket: ticket_asignado → global_tickets
✅ WebSocket: nuevo_comentario → global_tickets

# NO deberías ver:
❌ WebSocket: nuevo_mensaje_chat_analista_cliente → chat_analista_cliente_123
❌ WebSocket: nuevo_mensaje_chat_supervisor_analista → chat_supervisor_analista_123
```

---

### Merge a Main

```bash
# Si todo funciona perfectamente
git checkout main
git merge feature/migrate-chats-to-global-tickets
git push origin main

# Eliminar rama de trabajo
git branch -D feature/migrate-chats-to-global-tickets
```

---

## 🔄 Rollback Plan

### Si algo sale mal en cualquier fase:

```bash
# Opción 1: Revertir último commit
git reset --hard HEAD~1

# Opción 2: Revertir toda la rama
git checkout main
git branch -D feature/migrate-chats-to-global-tickets

# Opción 3: Revertir commits específicos
git revert <commit-hash>
```

### Puntos de Rollback Seguros:

1. **Después de Fase 1:** Backend emite a ambos lugares → Sistema funciona igual que antes
2. **Después de Fase 2:** Frontend usa nuevo sistema → Backend sigue emitiendo a ambos
3. **Después de Fase 3:** Código limpio → Todo funciona con nuevo sistema

---

## 📊 Resumen de Cambios

### Archivos Modificados (6):

**Backend (1):**
- ✅ `src/api/routes/chat_routes.py` - Emisión a global_tickets

**Frontend (5):**
- ✅ `src/front/pages/ChatAnalistaCliente.jsx` - Listener desde global_tickets
- ✅ `src/front/pages/ChatSupervisorAnalista.jsx` - Listener desde global_tickets
- ✅ `src/front/components/ChatAnalistaClienteEmbedded.jsx` - Listener desde global_tickets
- ✅ `src/front/components/ChatSupervisorAnalistaEmbedded.jsx` - Listener desde global_tickets
- ✅ `src/front/store/actions/websocketActions.js` - Eliminadas funciones obsoletas

### Código Eliminado:

- ❌ Emisión a rooms específicas en backend
- ❌ Funciones `joinChatAnalistaCliente()`, `leaveChatAnalistaCliente()`
- ❌ Funciones `joinChatSupervisorAnalista()`, `leaveChatSupervisorAnalista()`
- ❌ Handlers de join/leave en backend (si existen)

### Código Agregado:

- ✅ Emisión a `global_tickets` con metadata de participantes
- ✅ Filtrado en frontend por tipo y permisos
- ✅ Validación de participantes en cada mensaje

---

## 🎯 Beneficios Post-Migración

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Rooms** | 3 tipos (global + 2 específicas) | 1 tipo (solo global) |
| **Join/Leave** | Manual para cada chat | Automático |
| **Código** | ~200 líneas | ~150 líneas (-25%) |
| **Consistencia** | Diferente a tickets | Igual que tickets |
| **Mantenibilidad** | Media | Alta |
| **Preparado para JWT** | No | Sí |

---

## ✅ Checklist Final

### Antes de Empezar:
- [ ] Backup del código (git commit)
- [ ] Crear rama de trabajo
- [ ] Leer plan completo

### Durante la Migración:
- [ ] Completar Fase 1
- [ ] Pasar Checkpoint 1
- [ ] Completar Fase 2
- [ ] Pasar Checkpoint 2
- [ ] Completar Fase 3
- [ ] Pasar Checkpoint 3

### Después de Migración:
- [ ] Todos los tests pasan
- [ ] Código limpio (sin obsoleto)
- [ ] Merge a main
- [ ] Documentar cambios

---

**Última actualización:** 2025-12-29  
**Estado:** Plan listo para ejecución  
**Próximo paso:** Ejecutar Fase 1

