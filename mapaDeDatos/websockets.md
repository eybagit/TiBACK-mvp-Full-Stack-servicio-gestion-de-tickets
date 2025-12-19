# Guía Profesional de WebSockets para TiBack

## 🎯 Arquitectura Recomendada: Hybrid Optimistic Pattern

### Principio Fundamental
**"Actualización Optimista + Notificación WebSocket + Sincronización Selectiva"**

```
Usuario → UI Instantánea → Backend → WebSocket → Otros Usuarios
  (0ms)      (optimista)    (guardar)  (notificar)   (actualizar)
```

---

## 📋 Reglas de Oro

### ✅ DO (Hacer)

#### 1. Siempre Enviar Datos Completos en Eventos
```python
# ✅ CORRECTO
socketio.emit('ticket_created', {
    'ticket': ticket.to_dict(),  # Datos completos
    'timestamp': datetime.now().isoformat()
}, room='role_cliente')

# ❌ INCORRECTO
socketio.emit('ticket_created', {
    'ticket_id': ticket.id  # Solo ID, fuerza fetch
})
```

#### 2. Actualización Optimista + Confirmación
```javascript
// ✅ CORRECTO: UI instantánea
async function asignarTicket(ticketId, analistaId) {
    // 1. Actualizar UI inmediatamente
    updateTicketLocal(ticketId, { 
        estado: 'asignado', 
        id_analista: analistaId 
    });
    
    // 2. Enviar al backend
    await fetch('/api/tickets/asignar', {
        method: 'POST',
        body: JSON.stringify({ ticketId, analistaId })
    });
}

// ❌ INCORRECTO: Esperar respuesta
async function asignarTicket(ticketId, analistaId) {
    await fetch('/api/tickets/asignar', ...);
    updateTicketLocal(ticketId, ...); // Demora perceptible
}
```

#### 3. Rooms Específicos por Rol y Recurso
```python
# ✅ CORRECTO: Granular y eficiente
socketio.emit('ticket_asignado', data, room='role_analista')
socketio.emit('nuevo_comentario', data, room=f'ticket_{ticket_id}')
socketio.emit('notificacion_personal', data, room=f'user_{user_id}')

# ❌ INCORRECTO: Broadcast global
socketio.emit('ticket_asignado', data, broadcast=True)  # Todos reciben
```

#### 4. Manejo de Reconexión
```javascript
// ✅ CORRECTO: Resincronizar al reconectar
socket.on('connect', () => {
    setConnected(true);
    // Solo resincronizar datos críticos
    fetchTickets();
    joinRooms();
});

socket.on('disconnect', () => {
    setConnected(false);
    showReconnectingMessage();
});
```

#### 5. Soportar Funciones Updater en Setters
```javascript
// ✅ CORRECTO: Soportar ambos patrones
const setTickets = (dataOrFn) => {
    if (typeof dataOrFn === 'function') {
        const newData = dataOrFn(tickets);
        dispatch({ type: 'SET_TICKETS', payload: newData });
    } else {
        dispatch({ type: 'SET_TICKETS', payload: dataOrFn });
    }
};

// Permite ambos usos:
setTickets([...newTickets]);           // Datos directos
setTickets(prev => [...prev, ticket]); // Función updater
```

### ❌ DON'T (No Hacer)

#### 1. No Hacer Fetch Completo en Cada Evento
```javascript
// ❌ INCORRECTO: Recarga todo
socket.on('ticket_updated', () => {
    fetchAllTickets(); // Causa flasheo visual
});

// ✅ CORRECTO: Actualización local
socket.on('ticket_updated', (data) => {
    if (data.ticket_id) {
        updateTicketLocal(data.ticket_id, data.cambios);
    }
});
```

#### 2. No Usar Delays para Sincronización
```javascript
// ❌ INCORRECTO: Delay arbitrario
socket.on('ticket_created', () => {
    setTimeout(() => fetchTickets(), 1500); // Demora perceptible
});

// ✅ CORRECTO: Inmediato
socket.on('ticket_created', (data) => {
    if (data.ticket) {
        addTicketLocal(data.ticket);
    }
});
```

#### 3. No Emitir Sin Datos Completos
```python
# ❌ INCORRECTO
socketio.emit('ticket_updated', {'ticket_id': 123})

# ✅ CORRECTO
socketio.emit('ticket_updated', {
    'ticket_id': 123,
    'ticket': ticket.to_dict(),
    'cambios': {'estado': 'asignado'}
})
```

---

## 🏗️ Estructura de Eventos para TiBack

### Eventos Principales

| Evento | Emisor | Receptor | Datos Requeridos | Room |
|--------|--------|----------|------------------|------|
| `ticket_created` | Backend | Cliente | `{ticket: {...}}` | `role_cliente` |
| `ticket_asignado` | Backend | Analista | `{ticket: {...}, analista_id}` | `role_analista` |
| `ticket_updated` | Backend | Todos | `{ticket_id, cambios: {...}}` | `ticket_{id}` |
| `ticket_cerrado` | Backend | Todos | `{ticket_id, estado}` | `ticket_{id}` |
| `ticket_reabierto` | Backend | Todos | `{ticket_id, estado}` | `ticket_{id}` |
| `nuevo_comentario` | Backend | Ticket room | `{ticket_id, comentario: {...}}` | `ticket_{id}` |
| `critical_ticket_update` | Backend | Roles | `{ticket_id, action, priority}` | `role_{rol}` |

### Estructura de Rooms

```python
# Rooms por rol
'role_supervisor'   # Todos los supervisores
'role_analista'     # Todos los analistas
'role_cliente'      # Todos los clientes

# Rooms por recurso específico
'ticket_123'        # Usuarios viendo ticket 123
'ticket_456'        # Usuarios viendo ticket 456

# Rooms por usuario individual
'user_1'            # Usuario específico ID 1
'user_2'            # Usuario específico ID 2
```

---

## 🔄 Patrón de Implementación

### Backend (Python/Flask-SocketIO)

```python
from flask_socketio import emit, join_room

@app.route('/api/tickets/asignar', methods=['POST'])
def asignar_ticket():
    data = request.json
    ticket_id = data['ticket_id']
    analista_id = data['analista_id']
    
    # 1. Validar
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return {'error': 'Ticket no encontrado'}, 404
    
    # 2. Guardar en BD
    ticket.estado = 'asignado'
    ticket.id_analista = analista_id
    db.session.commit()
    
    # 3. Emitir WebSocket con datos completos
    socketio.emit('ticket_asignado', {
        'ticket_id': ticket.id,
        'analista_id': analista_id,
        'ticket': ticket.to_dict(),  # ✅ Datos completos
        'timestamp': datetime.now().isoformat()
    }, room='role_analista')
    
    # 4. Notificar a supervisor
    socketio.emit('ticket_updated', {
        'ticket_id': ticket.id,
        'cambios': {'estado': 'asignado', 'id_analista': analista_id}
    }, room='role_supervisor')
    
    return {'success': True, 'ticket': ticket.to_dict()}
```

### Frontend (React/JavaScript)

```javascript
// Hook de WebSocket
useEffect(() => {
    if (!socket || !connected) return;
    
    // Helper para actualización local
    const updateTicketLocal = (ticketId, changes) => {
        setTickets(prev => Array.isArray(prev) 
            ? prev.map(t => t.id === ticketId ? { ...t, ...changes } : t)
            : prev
        );
    };
    
    const addTicketLocal = (ticket) => {
        setTickets(prev => {
            const exists = Array.isArray(prev) && prev.some(t => t.id === ticket.id);
            if (exists) {
                return prev.map(t => t.id === ticket.id ? ticket : t);
            }
            return Array.isArray(prev) ? [ticket, ...prev] : [ticket];
        });
    };
    
    // Handlers
    const handleTicketAsignado = (data) => {
        const esParaMi = data.analista_id === miId;
        if (esParaMi) {
            if (data.ticket) {
                // ✅ Datos completos: actualización local
                addTicketLocal(data.ticket);
            } else {
                // ⚠️ Fallback: fetch específico
                fetch(`/api/tickets/${data.ticket_id}`)
                    .then(res => res.json())
                    .then(ticket => addTicketLocal(ticket))
                    .catch(err => console.debug('Error:', err));
            }
        }
    };
    
    const handleTicketUpdated = (data) => {
        if (data.ticket_id && data.cambios) {
            updateTicketLocal(data.ticket_id, data.cambios);
        }
    };
    
    // Registrar listeners
    socket.on('ticket_asignado', handleTicketAsignado);
    socket.on('ticket_updated', handleTicketUpdated);
    
    // Cleanup
    return () => {
        socket.off('ticket_asignado', handleTicketAsignado);
        socket.off('ticket_updated', handleTicketUpdated);
    };
}, [socket, connected, miId]);
```

---

## 🚀 Optimizaciones Avanzadas

### 1. Debouncing para Eventos Frecuentes
```javascript
let typingTimeout;
socket.on('typing_indicator', (data) => {
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        updateTypingStatus(data);
    }, 300);
});
```

### 2. Batch Updates
```python
# Backend: Agrupar múltiples cambios
ticket_ids = []
for ticket in tickets_to_close:
    ticket.estado = 'cerrado'
    ticket_ids.append(ticket.id)

db.session.commit()

# Emitir una vez con todos los IDs
socketio.emit('tickets_bulk_updated', {
    'ticket_ids': ticket_ids,
    'estado': 'cerrado',
    'timestamp': datetime.now().isoformat()
}, room='role_supervisor')
```

### 3. Heartbeat para Detectar Desconexiones
```javascript
// Frontend
setInterval(() => {
    if (socket.connected) {
        socket.emit('ping', { timestamp: Date.now() });
    }
}, 30000); // Cada 30 segundos

socket.on('pong', (data) => {
    const latency = Date.now() - data.timestamp;
    console.debug(`Latencia: ${latency}ms`);
});
```

### 4. Retry con Backoff Exponencial
```javascript
let retryCount = 0;
const maxRetries = 5;

socket.on('disconnect', () => {
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
    
    setTimeout(() => {
        if (retryCount < maxRetries) {
            socket.connect();
            retryCount++;
        }
    }, retryDelay);
});

socket.on('connect', () => {
    retryCount = 0; // Reset en conexión exitosa
});
```

---

## 📊 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIO (Supervisor)                                       │
│  ↓                                                          │
│  1. Click "Asignar Ticket"                                 │
│  2. Actualización Optimista Local (0ms) ✅                 │
│  3. POST /api/tickets/asignar                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Flask)                                            │
│  ↓                                                          │
│  1. Validar datos                                          │
│  2. Guardar en BD                                          │
│  3. Emitir WebSocket:                                      │
│     - 'ticket_asignado' → role_analista (datos completos)  │
│     - 'ticket_updated' → role_supervisor (cambios)         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  ANALISTA (Recibe WebSocket)                                │
│  ↓                                                          │
│  1. socket.on('ticket_asignado')                           │
│  2. Verificar: ¿es para mí?                                │
│  3. Actualización Local Instantánea ✅                     │
│  4. Ticket aparece en lista (0ms)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Checklist de Implementación

### Backend
- [ ] Emitir eventos con datos completos (`ticket.to_dict()`)
- [ ] Usar rooms específicos (no broadcast global)
- [ ] Incluir timestamp en cada evento
- [ ] Validar datos antes de emitir
- [ ] Manejar errores de conexión
- [ ] Implementar heartbeat/ping-pong

### Frontend
- [ ] Actualización optimista antes de fetch
- [ ] Handlers WebSocket con datos completos
- [ ] Fallback con fetch específico si faltan datos
- [ ] Soportar funciones updater en setters
- [ ] Manejo de reconexión automática
- [ ] No hacer fetch completo en eventos
- [ ] Evitar delays/timeouts para sincronización

---

## 🔍 Debugging y Monitoreo

### Logs Recomendados
```javascript
// Frontend
socket.on('*', (eventName, data) => {
    console.debug(`📡 WS Event: ${eventName}`, data);
});

// Backend
@socketio.on('*')
def log_event(event, data):
    logger.debug(f"📡 WS Event: {event} - Data: {data}")
```

### Métricas Importantes
- Latencia de eventos (ping-pong)
- Tasa de reconexiones
- Eventos perdidos
- Tamaño de payload

---

## 📚 Resumen Ejecutivo

**Patrón Recomendado:** Hybrid Optimistic
- ⚡ UI instantánea (actualización optimista)
- 🔄 Sincronización en tiempo real (WebSockets)
- 💾 Sin recargas visuales
- 🎯 Datos siempre consistentes

**Resultado:**
- **0ms** percepción de delay para el usuario
- **100%** sincronización entre roles
- **0** recargas de página
- **Experiencia fluida y profesional**
