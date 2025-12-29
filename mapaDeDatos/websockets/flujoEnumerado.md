# 🗺️ Mapa Detallado de Flujos de Tickets - Referencia Técnica Completa

**Última actualización:** 2025-12-29  
**Propósito:** Documentación exhaustiva de eventos WebSocket, rutas, servicios y handlers

---

## 📋 Tabla de Contenidos

1. [Contexto General](#contexto-general)
2. [Estados y Eventos Oficiales](#estados-y-eventos-oficiales)
3. [Flujo 1: Ciclo Normal del Ticket](#flujo-1-ciclo-normal-del-ticket)
4. [Flujo 2: Ticket con Reapertura](#flujo-2-ticket-con-reapertura)
5. [Flujo 3: Ticket Escalado](#flujo-3-ticket-escalado)
6. [Estructura de Archivos](#estructura-de-archivos)

---

## 🎯 Contexto General

### Arquitectura WebSocket
- **Room Global:** `global_tickets` - Todos los eventos se emiten aquí
- **Filtrado:** Frontend filtra eventos por rol y permisos
- **Sincronización:** Tiempo real para todos los roles

### Principios de Diseño
1. **Un solo evento por acción** - Backend emite, frontend escucha
2. **Sin redundancia** - Frontend NO emite eventos de tickets
3. **Estado único** - Base de datos es la fuente de verdad
4. **Return inmediato** - Después de emitir WebSocket, retornar para evitar 500

---

## 📊 Estados y Eventos Oficiales

### Estados del Ticket
**Archivo:** `src/api/constants/ticket_enums.py` (Líneas 9-19)

```python
class TicketState(str, Enum):
    CREADO = 'creado'           # L14
    EN_ESPERA = 'en espera'     # L15
    EN_PROCESO = 'en proceso'   # L16
    SOLUCIONADO = 'solucionado' # L17
    CERRADO = 'cerrado'         # L18
    REABIERTO = 'reabierto'     # L19
```

> ⚠️ **IMPORTANTE:** `'escalado'` NO es un estado válido. Se detecta por: `estado='en espera'` + sin analista + comentario.

### Eventos WebSocket
**Archivo:** `src/api/constants/ticket_enums.py` (Líneas 32-43)

```python
class TicketEvent(str, Enum):
    CREATED = 'ticket_created'                # L34
    ASIGNADO = 'ticket_asignado'              # L35
    INICIADO = 'ticket_iniciado'              # L36
    SOLUCIONADO = 'ticket_solucionado'        # L37
    CERRADO = 'ticket_cerrado'                # L38
    REABIERTO = 'ticket_reabierto'            # L39
    ESCALADO = 'ticket_escalado'              # L40
    SOLICITUD_REAPERTURA = 'solicitud_reapertura' # L41
    ELIMINADO = 'ticket_eliminado'            # L42
```

---

## 🔄 FLUJO 1: Ciclo Normal del Ticket

### 1.1 Cliente Crea Ticket

**Estado:** → `creado` → `en_espera`  
**Evento:** `ticket_created`

#### Frontend

**Componente:** `NuevoTicketForm.jsx`
- Modal de creación de ticket
- Campos: título, descripción, prioridad
- Submit llama a `crearTicket()`

**Acción:** `src/front/store/actions/clienteActions.js`
```javascript
// Función: crearTicket (aproximadamente L50-80)
crearTicket: async (dispatch, token, ticketData, socketDispatch) => {
  // POST /api/tickets
  // Dispatch: CLIENTE_CREATE_TICKET
}
```

#### Backend

**Ruta:** `src/api/routes/ticket_routes.py`
```python
# Función: create_ticket (L48-80)
@ticket_bp.route('/tickets', methods=['POST'])
@require_role(['cliente', 'administrador'])
def create_ticket():
    # Crea ticket con TicketService.create_ticket_for_cliente()
    # Emite evento via _emit_new_ticket_events() que llama a emit_ticket_created()
```

**Servicio:** `src/api/services/ticket_service.py`
```python
# Método: create_ticket_for_cliente (L48-62)
@staticmethod
def create_ticket_for_cliente(cliente_id, titulo, descripcion, prioridad, url_imagen=None):
    ticket = Ticket(
        id_cliente=cliente_id,
        estado=TicketState.EN_ESPERA.value,  # L53
        ...
    )
    db.session.commit()
    return ticket
```

**Emisión WebSocket:** `src/api/utils/websocket_utils.py`
```python
# Función: emit_ticket_created (L95-105)
def emit_ticket_created(ticket):
    # Emite evento 'ticket_created' a global_tickets
    # Incluye ticket completo serializado
    return emit_ticket_event(
        event='ticket_created',
        ticket=ticket,
        action='creado',
        extra_data={'id_cliente': ticket.id_cliente}
    )
```

#### Frontend Handler

**Handler:** `src/front/hooks/useWebSocketEvents.js`
```javascript
// Función: handleTicketCreated (L103-149)
const handleTicketCreated = useCallback((data) => {
    // Valida evento
    // Filtra por rol (analistas solo ven tickets asignados)
    // Agrega ticket a lista si es del usuario
    // Evita duplicados
}, [role, store, setTickets]);

// Registro del listener (L238)
socket.on('ticket_created', handleTicketCreated);
```

---

### 1.2 Supervisor Asigna Analista

**Estado:** `creado`/`en_espera` → `en_espera`  
**Evento:** `ticket_asignado`

#### Frontend

**Componente:** `src/front/protectedViewsRol/supervisor/components/TicketRow.jsx`
```javascript
// Botón "Asignar" (L286, L422)
<button onClick={() => asignarTicket(...)}>Asignar</button>
```

**Acción:** `src/front/protectedViewsRol/supervisor/hooks/useSupervisorActions.js`
```javascript
// Función: asignarTicket (L22-43)
const asignarTicket = async (ticketId, analistaId, comentario) => {
    // POST /api/tickets/${ticketId}/asignar
    // Body: { id_analista, comentario }
    // NO emite eventos - backend lo hace
};
```

#### Backend

**Ruta:** `src/api/routes/ticket_routes.py`
```python
# Función: asignar_ticket (L325-385)
@ticket_bp.route('/tickets/<int:id>/asignar', methods=['POST'])
@require_role(['supervisor', 'administrador'])
def asignar_ticket(id):
    # L346-359: Elimina asignaciones anteriores (en TicketService)
    # L361-369: Crea nueva asignación (en TicketService)
    # L371: Agrega comentario (en TicketService)
    # L374-379: Prepara data y emite ticket_asignado via emit_ws_event()
    
    data = {
        'id': ticket.id,
        'ticket_id': ticket.id,
        'ticket': ticket.serialize(),  # SIEMPRE incluir ticket completo
        'id_analista': id_analista,
        'analista_nombre': f"{analista.nombre} {analista.apellido}",
        'tipo': 'asignado',
        ...
    }
    emit_ws_event(socketio, 'ticket_asignado', data, None)  # Emite a global_tickets
    db.session.refresh(asignacion)  # Refrescar para evitar ObjectDeletedError
    return jsonify(asignacion.serialize()), 200
```

**Servicio:** `src/api/services/ticket_service.py`
```python
# Método: asignar_ticket (L186-236)
@staticmethod
def asignar_ticket(ticket_id, supervisor_id, analista_id, comentario, es_reasignacion):
    # L196-199: Valida estados (en espera, reabierto)
    # L201-202: Elimina asignaciones anteriores
    # L204-210: Crea nueva asignación
    # L211: Cambia estado a EN_ESPERA
    ticket.estado = TicketState.EN_ESPERA.value
    # L214-222: Agrega comentarios (asignación + comentario opcional)
    # L233: time.sleep(0.1) para evitar race conditions
```

#### Frontend Handler

**Handler:** `src/front/hooks/useWebSocketEvents.js`
```javascript
// Función: handleTicketUpdate (L34-100)
const handleTicketUpdate = useCallback((data, eventName) => {
    // L52-71: Filtro para analistas (eliminar si ya no está asignado a mí)
    // L73-90: Filtro para clientes (eliminar si está cerrado)
    // L92-100: Actualizar o agregar ticket
    
    // Caso especial para analistas (L78-84)
    if (!ticketExists && data.tipo === 'asignado' && data.ticket) {
        return [data.ticket, ...prev];  // Agregar ticket recién asignado
    }
}, [role, store, setTickets]);

// Registro del listener (L252)
socket.on('ticket_asignado', handleTicketUpdate);
```

---

### 1.3 Analista Inicia Trabajo

**Estado:** `en_espera` → `en_proceso`  
**Evento:** `ticket_iniciado`

#### Frontend

**Componente:** `src/front/protectedViewsRol/analista/components/TicketRow.jsx`
```javascript
// Botón "Iniciar" (L318-330)
<button onClick={() => iniciarTicket(ticket.id)}>
    Iniciar
</button>
```

**Acción:** `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js`
```javascript
// Función: iniciarTicket (L13-32)
const iniciarTicket = async (ticketId) => {
    // PUT /api/tickets/${ticketId}/estado
    // Body: { estado: 'en_proceso' }  // Estado válido según enums
    // Backend emite evento automáticamente
    // NO emitir desde frontend - causaría duplicación
};
```

**Acción Legacy:** `src/front/store/actions/analistaActions.js`
```javascript
// Función: startWork (L151-176)
startWork: async (dispatch, token, ticketId, socket, emitCriticalAction, user) => {
    // PUT /api/tickets/${ticketId}/estado
    // Body: { estado: 'en proceso' }  // L165
    // Dispatch: ANALISTA_UPDATE_TICKET  // L170
}
```

#### Backend

**Ruta:** `src/api/routes/ticket_estado_routes.py`
```python
# Función: cambiar_estado_ticket (L32-207)
# Sección Analista → Iniciar (L94-103)

elif user['role'] == 'analista':
    if nuevo_estado_lower == TicketState.EN_PROCESO.value and estado_actual == TicketState.EN_ESPERA.value:
        result, error = TicketEstadoService.analista_iniciar_ticket(ticket, user['id'])  # L95
        if result:
            data = TicketEstadoService.build_ticket_event_data(ticket, 'en_proceso', user['id'], 'analista')  # L97
            emit_websocket_event(socketio, TicketEvent.INICIADO.value, data, None)  # L99 - Emite a global_tickets
            return jsonify(ticket.serialize()), 200  # L101 - Return inmediato para evitar 500
```

**Servicio:** `src/api/services/ticket_estado_service.py`
```python
# Método: analista_iniciar_ticket (L109-124)
@staticmethod
def analista_iniciar_ticket(ticket, user_id):
    # L113: Valida estado actual
    if estado_actual != 'en espera':
        return None, "Solo se pueden iniciar tickets en espera"
    
    # L118: Cambia estado
    ticket.estado = TicketState.EN_PROCESO.value
    
    # L116-117: Crea comentario
    TicketEstadoService.crear_comentario(
        ticket.id, "Analista inició trabajo en el ticket", id_analista=user_id
    )
    
    db.session.commit()
    time.sleep(0.1)  # Evitar race conditions
    return ticket, None
```

#### Frontend Handler

**Handler:** `src/front/hooks/useWebSocketEvents.js`
```javascript
// handleTicketUpdate (L34-100)
// Registrado en L254
socket.on('ticket_iniciado', handleTicketUpdate);
```

**Handler Específico:** `src/front/protectedViewsRol/cliente/hooks/useClienteWebSocket.js`
```javascript
// Función: handleTicketIniciado (L190-215)
const handleTicketIniciado = (data) => {
    if (data.ticket_id) {
        setTickets(prev => Array.isArray(prev) 
            ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'en_proceso' } : t)
            : prev
        );  // L192-195
        // Log para desarrollo
        if (import.meta.env.DEV) {
            console.log(`🎯 Ticket ${data.ticket_id} iniciado - Analista trabajando en él`);
        }
    }
};

// Registro (L225)
socket.on('ticket_iniciado', handleTicketIniciado);
```

---

### 1.4 Analista Soluciona Ticket

**Estado:** `en_proceso` → `solucionado`  
**Evento:** `ticket_solucionado`

#### Frontend

**Componente:** `src/front/protectedViewsRol/analista/components/TicketRow.jsx`
```javascript
// Botón "Solucionar" (L331-343)
<button onClick={() => solucionarTicket(ticket.id)}>
    Solucionar
</button>
```

**Acción:** `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js`
```javascript
// Función: solucionarTicket (L35-52)
const solucionarTicket = async (ticketId) => {
    // PUT /api/tickets/${ticketId}/estado
    // Body: { estado: 'solucionado' }
    // Backend emite 'ticket_solucionado' automáticamente
    // NO emitir desde frontend - causaría duplicación
};
```

#### Backend

**Ruta:** `src/api/routes/ticket_estado_routes.py`
```python
# Sección Analista → Solucionar (L104-115)
elif nuevo_estado_lower == TicketState.SOLUCIONADO.value and estado_actual == TicketState.EN_PROCESO.value:
    result, error = TicketEstadoService.analista_solucionar_ticket(ticket, user['id'])  # L105
    if result:
        data = TicketEstadoService.build_ticket_event_data(ticket, 'solucionado', user['id'], 'analista')  # L107
        data['mensaje'] = 'El analista ha marcado el ticket como solucionado'  # L108
        emit_websocket_event(socketio, TicketEvent.SOLUCIONADO.value, data, None)  # L110 - Emite a global_tickets
        return jsonify(ticket.serialize()), 200  # L112 - Return inmediato para evitar 500
```

**Servicio:** `src/api/services/ticket_estado_service.py`
```python
# Método: analista_solucionar_ticket (L127-142)
@staticmethod
def analista_solucionar_ticket(ticket, user_id):
    # L130-131: Valida estado
    if estado_actual != 'en proceso':
        return None, "Solo se pueden solucionar tickets en proceso"
    
    # L136: Cambia estado
    ticket.estado = TicketState.SOLUCIONADO.value
    
    # L134-135: Crea comentario
    TicketEstadoService.crear_comentario(
        ticket.id, "Ticket solucionado por analista", id_analista=user_id
    )
    
    db.session.commit()
    time.sleep(0.1)  # Evitar race conditions
    return ticket, None
```

#### Frontend Handler

**Handler Cliente:** `src/front/protectedViewsRol/cliente/hooks/useClienteWebSocket.js`
```javascript
// Función: handleTicketSolucionado (L122-137)
const handleTicketSolucionado = (data) => {
    if (data.ticket_id) {
        setTickets(prev => prev.map(t => 
            t.id === data.ticket_id ? { ...t, estado: 'solucionado' } : t
        ));  // L124-127
        
        setSolicitudesReapertura(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.ticket_id);
            return newSet;
        });  // L128-132
    }
};

// Registro (L226)
socket.on('ticket_solucionado', handleTicketSolucionado);
```

---

### 1.5 Supervisor Cierra Ticket

**Estado:** `solucionado` → `cerrado`  
**Evento:** `ticket_cerrado`

#### Frontend

**Acción:** `src/front/store/actions/supervisorActions.js`
```javascript
// Función: cerrarTicket (aproximadamente L300-350)
cerrarTicket: async (dispatch, token, ticketId) => {
    // PUT /api/tickets/${ticketId}/estado
    // Body: { estado: 'cerrado' }
}
```

#### Backend

**Ruta:** `src/api/routes/ticket_estado_routes.py`
```python
# Sección Supervisor → Cerrar (L162-183)
elif user['role'] == 'supervisor':
    if nuevo_estado_lower == TicketState.CERRADO.value and estado_actual in [TicketState.SOLUCIONADO.value, TicketState.REABIERTO.value]:
        print(f"[DEBUG] 🔒 Supervisor cierra ticket {ticket.id}")  # L163
        result, error = TicketEstadoService.supervisor_cerrar_ticket(ticket, user['id'])  # L164
        
        if result:
            print(f"[DEBUG] ✅ Ticket cerrado exitosamente")  # L167
            data = TicketEstadoService.build_ticket_event_data(
                ticket, 'cerrado_por_supervisor', user['id'], 'supervisor', estado_actual
            )  # L168-170
            print(f"[DEBUG] 📤 Emitiendo evento ticket_cerrado para ticket {ticket.id}")  # L171
            emit_websocket_event(socketio, TicketEvent.CERRADO.value, data, None)  # L175
            print(f"[DEBUG] ✅ Evento ticket_cerrado emitido")  # L177
            return jsonify(ticket.serialize()), 200  # L179
```

**Servicio:** `src/api/services/ticket_estado_service.py`
```python
# Método: supervisor_cerrar_ticket (L171-187)
@staticmethod
def supervisor_cerrar_ticket(ticket, user_id):
    # L174-175: Valida estados
    if estado_actual not in [TicketState.SOLUCIONADO.value, TicketState.REABIERTO.value]:
        return None, "Solo se pueden cerrar tickets solucionados o reabiertos"
    
    # L182: Cambia estado
    ticket.estado = TicketState.CERRADO.value 
    ticket.fecha_cierre = datetime.now()  # L183
    
    # L179-180: Crea comentario
    TicketEstadoService.crear_comentario(
        ticket.id, "Ticket cerrado por supervisor", id_supervisor=user_id
    )
```

#### Frontend Handler - Cliente

**Handler Específico:** `src/front/protectedViewsRol/cliente/hooks/useClienteWebSocket.js`
```javascript
// Función: handleTicketCerrado (L139-169)
const handleTicketCerrado = (data) => {
    console.log('🔔 [Cliente] Evento ticket_cerrado recibido:', data);  // L140
    
    if (data.ticket_id) {
        // IMPORTANTE: Tickets cerrados se ELIMINAN de la vista del cliente
        setTickets(prev => {
            const filtered = Array.isArray(prev) 
                ? prev.filter(t => t.id !== data.ticket_id)
                : prev;  // L148-150
            
            console.log(`🗑️ [Cliente] Ticket ${data.ticket_id} cerrado - removido`);  // L152
            console.log(`📊 [Cliente] Tickets antes: ${prev.length}, después: ${filtered.length}`);  // L153
            
            return filtered;
        });
        
        // Limpiar solicitudes de reapertura
        setSolicitudesReapertura(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.ticket_id);
            return newSet;
        });  // L158-162
    }
};

// Registro (L227)
socket.on('ticket_cerrado', handleTicketCerrado);
```

**Handler Genérico:** `src/front/hooks/useWebSocketEvents.js`
```javascript
// Filtro adicional en handleTicketUpdate (L72-90)
// FILTRO POR ROL: Clientes NO deben ver tickets cerrados
if (role === 'cliente') {
    const ticketActualizado = data.ticket || updates;
    const estaCerrado = ticketActualizado.estado === 'cerrado' || 
                      data.ticket_estado === 'cerrado';  // L75-76
    
    if (estaCerrado || data.ticket_estado === 'cerrado') {
        console.log(`[${role}] 🗑️ Ticket ${data.ticket_id} cerrado, eliminando`);  // L81
        setTickets(prev => {
            if (!Array.isArray(prev)) return prev;
            return prev.filter(t => t.id !== data.ticket_id);  // L85
        });
        return;  // L87
    }
}

// Registro (L271)
socket.on('ticket_cerrado', handleTicketUpdate);
```

---

## 🔄 FLUJO 2: Ticket con Reapertura

### 2.1 Cliente Solicita Reapertura

**Estado:** `solucionado` (sin cambio)  
**Campo:** `tiene_solicitud_reapertura_pendiente = true`  
**Evento:** `solicitud_reapertura`

#### Backend

**Ruta:** `src/api/routes/ticket_routes.py`
```python
# Función: solicitar_reapertura_ticket (L169-221)
@ticket_bp.route('/tickets/<int:ticket_id>/solicitar-reapertura', methods=['POST'])
@require_role(['cliente'])
def solicitar_reapertura_ticket(ticket_id):
    # L192-199: Crea comentario específico de solicitud
    comentario_reapertura = Comentarios(
        id_ticket=ticket_id,
        id_cliente=user['id'],
        texto="Cliente solicitó reapertura del ticket - Pendiente de decisión del supervisor",
        fecha_comentario=datetime.now()
    )
    db.session.add(comentario_reapertura)
    
    # CRÍTICO: Marcar que hay solicitud de reapertura pendiente
    ticket.tiene_solicitud_reapertura_pendiente = True
    db.session.commit()
    
    # L203: Refresh para que serialize() detecte la solicitud
    db.session.refresh(ticket)
    
    # L205-212: Prepara data con el campo calculado usando build_ticket_event_data
    data = TicketEstadoService.build_ticket_event_data(ticket, 'solicitud_reapertura')
    data['motivo'] = motivo  # Agregar motivo adicional
    
    # L213: Emite evento a global_tickets
    emit_ws_event(socketio, 'solicitud_reapertura', data, None)
```

**Modelo:** `src/api/models.py`
```python
# Método serialize del Ticket (L215-274)
# Cálculo de tiene_solicitud_reapertura_pendiente (L239-251)

tiene_solicitud = False
if self.estado == 'solucionado':  # L241
    comentarios_reapertura = [c for c in self.comentarios 
        if 'solicita' in c.texto.lower() and 'reapertura' in c.texto.lower()
        and c.id_cliente is not None]  # L242-244
    
    tiene_solicitud = len(comentarios_reapertura) > 0  # L246
```

---

### 2.2 Supervisor Reabre Ticket

**Estado:** `solucionado`/`cerrado` → `en_espera`  
**Evento:** `ticket_reabierto`

#### Backend

**Ruta:** `src/api/routes/ticket_estado_routes.py`
```python
# Sección Supervisor → Reabrir (L184-197)
elif nuevo_estado_lower == TicketState.REABIERTO.value and (estado_actual in [TicketState.CERRADO.value, TicketState.SOLUCIONADO.value] or estado_actual.startswith('cerrado')):
    result, error = TicketEstadoService.supervisor_reabrir_ticket(ticket, user['id'])  # L185
    if result:
        db.session.refresh(ticket)  # L187 - CRÍTICO para incluir comentario de aprobación
        data = TicketEstadoService.build_ticket_event_data(
            ticket, 'reabierto_por_supervisor', user['id'], 'supervisor', estado_actual
        )  # L188-190
        emit_websocket_event(socketio, TicketEvent.REABIERTO.value, data, None)  # L192 - Emite a global_tickets
        return jsonify(ticket.serialize()), 200  # L194 - Return inmediato para evitar 500
```

**Servicio:** `src/api/services/ticket_estado_service.py`
```python
# Método: supervisor_reabrir_ticket (L190-216)
@staticmethod
def supervisor_reabrir_ticket(ticket, user_id):
    # L193-196: Valida estados permitidos
    estados_permitidos = [TicketState.CERRADO.value, TicketState.SOLUCIONADO.value]
    if estado_actual not in estados_permitidos and not estado_actual.startswith(TicketState.CERRADO.value):
        return None, "Solo se pueden reabrir tickets cerrados o solucionados"
    
    # L203: Cambia estado
    ticket.estado = TicketState.EN_ESPERA.value
    ticket.fecha_cierre = None  # L204
    
    # CRÍTICO: Limpiar el flag de solicitud de reapertura
    ticket.tiene_solicitud_reapertura_pendiente = False
    
    # L206-216: Elimina asignaciones anteriores si estaba solucionado
    if estado_normalizado == TicketState.SOLUCIONADO.value:
        asignaciones_anteriores = Asignacion.query.filter_by(id_ticket=ticket.id).all()
        for asignacion in asignaciones_anteriores:
            db.session.delete(asignacion)
        
        texto = "Supervisor aprobó solicitud de reapertura - Asignaciones anteriores eliminadas, listo para nueva asignación"
    else:
        texto = "Ticket reabierto por supervisor - Listo para nueva asignación"
    
    TicketEstadoService.crear_comentario(ticket.id, texto, id_supervisor=user_id)
```

---

## ⬆️ FLUJO 3: Ticket Escalado

### 3.1 Analista Escala Ticket

**Estado:** `en_espera`/`en_proceso` → `en_espera`  
**Asignación:** Se elimina analista  
**Evento:** `ticket_escalado`

> ⚠️ **CRÍTICO:** El estado `'escalado'` NO existe. Escalamiento = `en_espera` + sin analista + comentario.

#### Frontend

**Acción:** `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js`
```javascript
// Función: escalarTicket (L55-145)
const escalarTicket = async (ticketId) => {
    // PUT /api/tickets/${ticketId}/estado
    // Body: { estado: 'en_espera' }  // L107 - Estado válido (NO 'escalado')
    
    // IMPORTANTE: El estado enviado es 'en_espera', no 'escalado'
    // El escalamiento se detecta por: estado='en_espera' + sin analista + comentario
    const response = await fetch(`${VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'en_espera' })  // L107
    });
    
    // Backend emite 'ticket_escalado' automáticamente
    // NO emitir desde frontend - causaría duplicación
};
```

**Acción Legacy:** `src/front/store/actions/analistaActions.js`
```javascript
// Función: escalateTicket (L231-278)
escalateTicket: async (dispatch, token, ticketId, socket, emitCriticalAction, user) => {
    console.log('🚀 [ESCALAMIENTO] Iniciando, ticket:', ticketId);  // L233
    
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'en_espera' })  // L239 - Envía 'en_espera'
    });
    
    if (response.ok) {
        const updatedTicket = await response.json();
        console.log('✅ [ESCALAMIENTO] Exitoso');  // L244
        dispatch({ type: 'ANALISTA_UPDATE_TICKET', payload: updatedTicket });  # L245
    }
}
```

#### Backend

**Ruta:** `src/api/routes/ticket_estado_routes.py`
```python
# Sección Analista → Escalar (L117-157)
elif nuevo_estado_lower == TicketState.EN_ESPERA.value and estado_actual in [TicketState.EN_ESPERA.value, TicketState.EN_PROCESO.value, TicketState.REABIERTO.value]:
    print(f"[DEBUG] 🚀 Iniciando escalamiento - ticket_id: {ticket.id}, user_id: {user['id']}")  # L118
    print(f"[DEBUG] 📊 Estado actual: {estado_actual}, Nuevo estado: {nuevo_estado_lower}")  # L119
    
    result, error = TicketEstadoService.analista_escalar_ticket(ticket, user['id'])  # L121
    
    print(f"[DEBUG] ✅ Servicio retornó - result: {result is not None}, error: {error}")  # L123
    
    if result:
        try:
            print(f"[DEBUG] 🔧 Construyendo data del evento...")  # L127
            # IMPORTANTE: NO existe estado "escalado" - se mantiene en "en_espera"
            data = TicketEstadoService.build_ticket_event_data(ticket, 'actualizado', user['id'], 'analista')  # L129
            data['mensaje'] = 'El analista ha escalado el ticket al supervisor'  # L132
            data['escalado'] = True  # L133 - Flag para indicar escalamiento
            
            print(f"[DEBUG] 🔔 Emitiendo evento: {TicketEvent.ESCALADO.value}")  # L135
            emit_websocket_event(socketio, TicketEvent.ESCALADO.value, data, None)  # L137
            
            print(f"[DEBUG] ✅ Evento emitido, serializando ticket...")  # L139
            serialized = ticket.serialize()  # L140
            
            return jsonify(serialized), 200  # L145
        except Exception as e:
            print(f"[DEBUG] 💥 ERROR: {type(e).__name__}: {str(e)}")  # L147
            traceback.print_exc()  # L149
            raise
```

**Servicio:** `src/api/services/ticket_estado_service.py`
```python
# Método: analista_escalar_ticket (L145-171)
@staticmethod
def analista_escalar_ticket(ticket, user_id):
    # L147-148: Valida estado
    if estado_actual not in [TicketState.EN_ESPERA.value, TicketState.EN_PROCESO.value]:
        return None, "Solo se pueden escalar tickets en espera o en proceso"
    
    # L154: Cambia estado a EN_ESPERA (NO 'escalado')
    ticket.estado = TicketState.EN_ESPERA.value
    
    # L156-161: Elimina asignaciones del analista solo si existen
    asignaciones_analista = Asignacion.query.filter_by(
        id_ticket=ticket.id,
        id_analista=user_id
    ).all()
    
    if asignaciones_analista:  # L161
        for asignacion in asignaciones_analista:
            db.session.delete(asignacion)  # L163
    
    # L165-166: Crea comentario
    texto = "Ticket escalado al supervisor" if estado_actual == TicketState.EN_ESPERA.value else "Ticket escalado al supervisor - Analista no pudo resolver"
    TicketEstadoService.crear_comentario(ticket.id, texto, id_analista=user_id)
    
    db.session.commit()
    time.sleep(0.1)  # Evitar race conditions
    return ticket, None
```

#### Frontend Handler - Analista

**Handler:** `src/front/hooks/useWebSocketEvents.js`
```javascript
// Filtro para analistas en handleTicketUpdate (L52-71)
if (role === 'analista') {
    const userId = store?.auth?.user?.id;
    const ticketActualizado = data.ticket || updates;
    const esParaMi = ticketActualizado.asignacion_actual?.id_analista === userId ||
                   ticketActualizado.id_analista === userId;  // L56-57
    
    if (!esParaMi) {
        // Ticket escalado/reasignado - ELIMINARLO de mi lista
        if (import.meta.env.DEV) {
            console.log(`[${role}] 🗑️ Ticket ${data.ticket_id} ya no asignado a mí, eliminando de lista`);
        }
        setTickets(prev => {
            if (!Array.isArray(prev)) return prev;
            return prev.filter(t => t.id !== data.ticket_id);  // L67
        });
        return;  // L69
    }
}

// Registro (L271)
socket.on('ticket_escalado', handleTicketUpdate);
```

---

## 📁 Estructura Completa de Archivos

### Backend - Rutas

```
src/api/routes/
├── ticket_routes.py
│   ├── create_ticket() [L48-67]
│   ├── asignar_ticket() [L325-385]
│   ├── solicitar_reapertura_ticket() [L169-221]
│   └── delete_ticket() [L138-164]
│
└── ticket_estado_routes.py
    └── cambiar_estado_ticket() [L32-207]
        ├── Cliente cerrar [L59-72]
        ├── Cliente reabrir [L78-88]
        ├── Analista iniciar [L94-103]
        ├── Analista solucionar [L104-115]
        ├── Analista escalar [L117-157]
        ├── Supervisor cerrar [L162-183]
        └── Supervisor reabrir [L184-197]
```

### Backend - Servicios

```
src/api/services/
├── ticket_service.py
│   ├── create_ticket_for_cliente() [L48-62]
│   └── asignar_ticket() [L186-236]
│
└── ticket_estado_service.py
    ├── cliente_cerrar_ticket() [L48-68]
    ├── cliente_reabrir_ticket() [L88-105]
    ├── analista_iniciar_ticket() [L109-124]
    ├── analista_solucionar_ticket() [L127-142]
    ├── analista_escalar_ticket() [L145-171]
    ├── supervisor_cerrar_ticket() [L171-187]
    ├── supervisor_reabrir_ticket() [L190-216]
    └── build_ticket_event_data() [L27-44]
```

### Frontend - Hooks

```
src/front/hooks/
└── useWebSocketEvents.js
    ├── handleTicketCreated() [L102-136]
    ├── handleTicketUpdate() [L34-100]
    └── handleTicketEliminado() [L150-158]

src/front/protectedViewsRol/cliente/hooks/
├── useClienteWebSocket.js
│   ├── handleTicketSolucionado() [L122-137]
│   ├── handleTicketCerrado() [L139-169]
│   ├── handleTicketReabierto() [L171-186]
│   └── handleTicketIniciado() [L190-215]
│
└── useClienteActions.js
    └── crearTicket() [~L50-80]

src/front/protectedViewsRol/analista/hooks/
├── useAnalistaActions.js
│   ├── iniciarTicket() [L60-78]
│   ├── solucionarTicket() [L80-97]
│   └── escalarTicket() [L99-126]
│
└── useAnalistaWebSocket.js
    └── (Usa useWebSocketEvents genérico)

src/front/protectedViewsRol/supervisor/hooks/
└── useSupervisorActions.js
    ├── asignarTicket() [L22-43]
    └── reasignarTicket() [L45-69]
```

### Frontend - Acciones Legacy

```
src/front/store/actions/
├── clienteActions.js
│   ├── crearTicket()
│   ├── cerrarTicket()
│   └── reabrirTicket()
│
├── analistaActions.js
│   ├── startWork() [L151-176]
│   ├── markAsSolved() [L178-204]
│   └── escalateTicket() [L231-278]
│
└── supervisorActions.js
    ├── asignarTicket()
    ├── reasignarTicket()
    └── cerrarTicket()
```

---

## 🔍 Funciones Auxiliares Clave

### Backend

**Archivo:** `src/api/services/ticket_estado_service.py`

```python
# build_ticket_event_data (L27-44)
@staticmethod
def build_ticket_event_data(ticket, tipo_evento, user_id=None, user_role=None, estado_anterior=None):
    # Construye estructura de data para WebSocket
    # Incluye ticket serializado completo
    return {
        'ticket_id': ticket.id,
        'ticket': ticket.serialize(),  # L32
        'tipo_evento': tipo_evento,
        ...
    }

# crear_comentario (L71-86)
@staticmethod
def crear_comentario(ticket_id, texto, id_cliente=None, id_analista=None, id_supervisor=None):
    # Crea comentario en BD
    # Asocia con rol correspondiente
    comentario = Comentarios(...)  # L73-78
    db.session.add(comentario)
    db.session.commit()

# normalizar_estado (L16-24)
@staticmethod
def normalizar_estado(estado):
    # Convierte "en_espera" ↔ "en espera"
    # Unifica formatos BD/Frontend
    return estado.lower().replace('_', ' ')  # L18
```

**Archivo:** `src/api/utils/websocket_utils.py`

```python
# emit_websocket_event (L42-57) - DEPRECADO, usar emit_ticket_event
def emit_websocket_event(socketio, event_name, data, room='global_tickets'):
    # Emite evento WebSocket
    # Siempre a room global_tickets
    socketio.emit(event_name, data, room=room)  # L54
    print(f"[WebSocket] Emitido: {event_name} a room {room}")  # L56

# emit_ticket_event (L30-75) - RECOMENDADO
def emit_ticket_event(event, ticket, action=None, extra_data=None):
    # Emite evento de ticket a global_tickets
    # SIEMPRE incluye ticket completo serializado
    data = {
        'ticket_id': ticket.id,
        'ticket': ticket.serialize(),  # SIEMPRE completo
        'action': action,
        'estado': ticket.estado,
        'timestamp': datetime.now().isoformat(),
    }
    socketio.emit(event, data, room='global_tickets')
    return True

# emit_ticket_created (L95-105)
def emit_ticket_created(ticket):
    return emit_ticket_event(
        event='ticket_created',
        ticket=ticket,
        action='creado',
        extra_data={'id_cliente': ticket.id_cliente}
    )
```

### Frontend

**Archivo:** `src/front/hooks/useWebSocketEvents.js`

```javascript
// validateTicketEvent - Importado desde utils
import { validateTicketEvent, logValidationError } from '../utils/websocket-validators';

// La función validateTicketEvent ahora está en src/front/utils/websocket-validators.js
// Valida estructura de evento
// Verifica ticket_id y tipos
// return data && data.ticket_id && typeof data.ticket_id === 'number';
```

---

## 📝 Notas Finales

### Cambios Recientes Aplicados

1. ✅ Corrección de nombres de enum (`TICKET_ESCALADO` → `ESCALADO`)
2. ✅ Agregados `return` statements después de emit WebSocket
3. ✅ Migración de strings hardcodeados a constantes de enum
4. ✅ Agregado filtro en `handleTicketUpdate` para eliminar tickets cerrados del cliente
5. ✅ Debug logging comprehensivo en escalamiento y cierre

### Referencias

- **Correcciones aplicadas:** `mapaDeDatos/websockets/correcciones.md`
- **Enums oficiales:** `src/api/constants/ticket_enums.py`
- **Arquitectura:** `documentacion/arquitectura.md`

---

**Última actualización:** 2025-12-29  
**Mantenido por:** Equipo de desarrollo TiBACK

---

## 🔄 Historial de Actualizaciones

### 2025-12-29 - Actualización Quirúrgica
- ✅ Actualizado `create_ticket` route: ahora soporta rol 'administrador' además de 'cliente'
- ✅ Actualizado `asignar_ticket` route: ahora soporta rol 'administrador' además de 'supervisor'
- ✅ Corregidas referencias de líneas de código según implementación actual
- ✅ Agregados comentarios sobre `time.sleep(0.1)` para evitar race conditions
- ✅ Actualizada función `emit_ticket_created` con nueva firma (sin socketio/cliente params)
- ✅ Agregada documentación de `emit_ticket_event` como función recomendada
- ✅ Actualizado `solicitar_reapertura_ticket`: ahora usa POST en lugar de PUT
- ✅ Agregado flag `tiene_solicitud_reapertura_pendiente` en flujo de reapertura
- ✅ Actualizado `supervisor_reabrir_ticket`: ahora limpia el flag de solicitud pendiente
- ✅ Corregidos números de línea en handlers de frontend
- ✅ Agregados comentarios sobre "Return inmediato para evitar 500" en rutas críticas
- ✅ Actualizada función `validateTicketEvent`: ahora importada desde utils/websocket-validators
- ✅ Mejorados comentarios en `escalarTicket` sobre detección de escalamiento
- ✅ Agregados logs condicionales con `import.meta.env.DEV` en handlers de cliente
