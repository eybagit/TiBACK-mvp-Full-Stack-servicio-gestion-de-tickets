# 🗺️ Mapa de Flujos Enumerados - Referencia de Debugging

**Última actualización:** 27/12/2025  
**Propósito:** Identificar rápidamente el código responsable de cada subflujo

---

## ✅ VERIFICACIÓN GLOBAL_TICKETS - TODOS FUNCIONANDO

### Backend → Emisión a global_tickets
| Archivo | Estado | Líneas Verificadas |
|---------|--------|-------------------|
| `websocket_utils.py` | ✅ | L73: `room='global_tickets'` |
| `ticket_estado_routes.py` | ✅ | L23, L68, L75, L82, L93, L101, L104 (corregido), L125, L134 |
| `ticket_routes.py` | ✅ | L29: `room='global_tickets'` |
| `asignacion_routes.py` | ✅ | L138: `room='global_tickets'` |
| `comentario_routes.py` | ✅ | L93: `room='global_tickets'` |
| `analista_routes.py` | ✅ | L48, L125: `room='global_tickets'` |
| `utils_routes.py` | ✅ | L64: `room='global_tickets'` |

### Frontend → Escucha en global_tickets
| Hook/Archivo | Estado | Join Room |
|--------------|--------|-----------|
| `store.js` | ✅ | L187: `socket.emit("join_room", "global_tickets")` |
| `websocketActions.js` | ✅ | L208: `socket.emit("join_room", "global_tickets")` |
| `useWebSocketSync.js` (Supervisor) | ✅ | Via `joinRoom()` |
| `useAnalistaWebSocket.js` | ✅ | L87: Via `joinRoom()` |
| `useClienteWebSocket.js` | ✅ | L86: Via `joinRoom()` |

### Hook Centralizado → Eventos Registrados
| Evento | Handler | Línea en `useWebSocketEvents.js` |
|--------|---------|----------------------------------|
| `ticket_created` | ✅ `handleTicketCreated` (con filtro analista) | L67-108 |
| `ticket_updated` | ✅ `handleTicketUpdate` (con filtro analista) | L33-79 |
| `ticket_asignado` | ✅ `handleTicketUpdate` | L169 |
| `ticket_escalado` | ✅ `handleTicketUpdate` | L170 |
| `ticket_reasignado` | ✅ `handleTicketUpdate` | L171 |
| `asignacion_eliminada` | ✅ `handleAsignacionEliminada` | L172 |
| `ticket_iniciado` | ✅ `handleTicketUpdate` | L176 |
| `ticket_solucionado` | ✅ `handleTicketUpdate` | L177 |
| `ticket_cerrado` | ✅ `handleTicketUpdate` | L178 |
| `ticket_reabierto` | ✅ `handleTicketUpdate` | L179 |
| `ticket_evaluado` | ✅ `handleTicketUpdate` | L180 |
| `solicitud_reapertura` | ✅ `handleTicketUpdate` | L181 |
| `nuevo_comentario` | ✅ `handleNuevoComentario` | L187 |
| `ticket_eliminado` | ✅ `handleTicketEliminado` | L192 |
| `todos_tickets_eliminados` | ✅ `handleTodosTicketsEliminados` | L193 |

### 🔧 Correcciones Aplicadas
| # | Problema | Solución | Archivo |
|---|----------|----------|---------|
| 1 | Escalamiento fallaba con 400 | Corregido: `'en_espera'` → `'en espera'` (normalización) | `ticket_estado_routes.py` L104 |
| 2 | Analistas veían tickets sin asignar | Agregado filtro de visibilidad en handlers | `useWebSocketEvents.js` L80-92, L49-64 |
| 3 | Reasignación fallaba | Corregido: `analista_id` → `id_analista` | `useSupervisorActions.js` L23, L47 |

---

## 📋 Índice de Flujos

| # | Flujo | Estado |
|---|-------|--------|
| 1.x | Ticket Exitoso (Camino Feliz) | ✅ |
| 2.x | Ticket con Reapertura | ✅ |
| 3.x | Ticket Escalado | ✅ CORREGIDO |
| 4.x | Eliminación de Tickets | ✅ |
| 5.x | Eventos WebSocket | ✅ |
| 6.x | Funciones Helper | ✅ |

---

## 🎯 FLUJO 1: Ticket Exitoso (Camino Feliz)

### 1.1 Cliente Crea Ticket
```
Estado: → creado
Evento: ticket_created
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Formulario** | `src/front/protectedViewsRol/cliente/components/NuevoTicketForm.jsx` | Componente completo |
| **Frontend - Acción** | `src/front/store/actions/clienteActions.js` | `crearTicket()` |
| **Backend - Ruta** | `src/api/routes/ticket_routes.py` | `create_ticket()` L48-67 |
| **Backend - Emisión** | `src/api/utils/websocket_utils.py` | `emit_ticket_created()` L85-94 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketCreated()` L67-108 |
| **⚠️ Filtro Analista** | `src/front/hooks/useWebSocketEvents.js` | Solo ve si está asignado L80-92 |

---

### 1.2 Supervisor Asigna Analista
```
Estado: creado → en_espera
Evento: ticket_asignado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/supervisor/components/TicketRow.jsx` | Botón "Asignar" |
| **Frontend - Modal** | `src/front/protectedViewsRol/supervisor/components/AsignarAnalistaModal.jsx` | Modal de asignación |
| **Frontend - Acción** | `src/front/protectedViewsRol/supervisor/hooks/useSupervisorActions.js` | `asignarTicket()` L19-38 |
| **Backend - Ruta** | `src/api/routes/ticket_routes.py` | `asignar_ticket()` L327-385 |
| **Backend - Emisión** | `src/api/routes/ticket_routes.py` | Múltiples eventos L375-378 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |
| **✅ Corrección** | `useSupervisorActions.js` | Parámetro: `id_analista` (no `analista_id`) L23 |

---

### 1.3 Analista Inicia Trabajo
```
Estado: en_espera → en_proceso
Evento: ticket_iniciado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/analista/components/TicketCard.jsx` | Botón "Iniciar" |
| **Frontend - Acción** | `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js` | `iniciarTicket()` |
| **Backend - Ruta** | `src/api/routes/ticket_estado_routes.py` | `cambiar_estado_ticket()` L89-93 |
| **Backend - Servicio** | `src/api/services/ticket_estado_service.py` | `analista_iniciar_ticket()` L109-124 |
| **Backend - Emisión** | `src/api/routes/ticket_estado_routes.py` | `emit_websocket_event('ticket_iniciado')` L93 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 1.4 Analista Soluciona Ticket
```
Estado: en_proceso → solucionado
Evento: ticket_solucionado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/analista/components/TicketCard.jsx` | Botón "Solucionar" |
| **Frontend - Acción** | `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js` | `solucionarTicket()` |
| **Backend - Ruta** | `src/api/routes/ticket_estado_routes.py` | `cambiar_estado_ticket()` L95-102 |
| **Backend - Servicio** | `src/api/services/ticket_estado_service.py` | `analista_solucionar_ticket()` L127-142 |
| **Backend - Emisión** | `src/api/routes/ticket_estado_routes.py` | `emit_websocket_event('ticket_solucionado')` L102 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |
| **Frontend - Cliente** | `src/front/protectedViewsRol/cliente/hooks/useClienteWebSocket.js` | `handleTicketSolucionado()` L121-136 |

---

### 1.5 Cliente Cierra y Evalúa
```
Estado: solucionado → cerrado
Evento: ticket_cerrado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/cliente/components/TicketRow.jsx` | Botón "Cerrar" |
| **Frontend - Modal** | `src/front/protectedViewsRol/cliente/components/EvaluarTicketModal.jsx` | Modal evaluación |
| **Frontend - Acción** | `src/front/store/actions/clienteActions.js` | `cerrarTicket()` |
| **Backend - Ruta** | `src/api/routes/ticket_estado_routes.py` | `cambiar_estado_ticket()` L59-68 |
| **Backend - Servicio** | `src/api/services/ticket_estado_service.py` | `cliente_cerrar_ticket()` L48-68 |
| **Backend - Emisión** | `src/api/routes/ticket_estado_routes.py` | `emit_websocket_event('ticket_cerrado')` L68 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

## 🔄 FLUJO 2: Ticket con Reapertura

### 2.1 Cliente Solicita Reapertura
```
Estado: cerrado (sin cambio)
Campo: tiene_solicitud_reapertura_pendiente = true
Evento: solicitud_reapertura
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/cliente/components/TicketRow.jsx` | Botón "Solicitar Reapertura" |
| **Frontend - Acción** | `src/front/store/actions/clienteActions.js` | `solicitarReapertura()` |
| **Backend - Ruta** | `src/api/routes/ticket_estado_routes.py` | `cambiar_estado_ticket()` L74-78 |
| **Backend - Servicio** | `src/api/services/ticket_estado_service.py` | `cliente_solicitar_reapertura()` L71-85 |
| **Backend - Emisión** | `src/api/routes/ticket_estado_routes.py` | `emit_websocket_event('solicitud_reapertura')` L78 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 2.2 Supervisor Aprueba Reapertura
```
Estado: cerrado → reabierto
Campo: tiene_solicitud_reapertura_pendiente = false
Evento: ticket_reabierto
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/supervisor/components/TicketRow.jsx` | Botón "Reabrir" |
| **Frontend - Acción** | `src/front/protectedViewsRol/supervisor/hooks/useTicketOperations.js` | `reabrirTicket()` L104-129 |
| **Backend - Ruta** | `src/api/routes/ticket_estado_routes.py` | `cambiar_estado_ticket()` L132-135 |
| **Backend - Servicio** | `src/api/services/ticket_estado_service.py` | `supervisor_reabrir_ticket()` L192-213 |
| **Backend - Emisión** | `src/api/routes/ticket_estado_routes.py` | `emit_websocket_event('ticket_reabierto')` L135 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 2.3 Cliente Reabre Directamente
```
Estado: cerrado → reabierto
Evento: ticket_reabierto
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/cliente/components/TicketRow.jsx` | Botón "Reabrir" |
| **Frontend - Acción** | `src/front/store/actions/clienteActions.js` | `reabrirTicket()` |
| **Backend - Ruta** | `src/api/routes/ticket_estado_routes.py` | `cambiar_estado_ticket()` L81-84 |
| **Backend - Servicio** | `src/api/services/ticket_estado_service.py` | `cliente_reabrir_ticket()` L88-105 |
| **Backend - Emisión** | `src/api/routes/ticket_estado_routes.py` | `emit_websocket_event('ticket_reabierto')` L84 |

---

## ⬆️ FLUJO 3: Ticket Escalado ✅ CORREGIDO

### 3.1 Analista Escala Ticket
```
Estado: en_espera, en_proceso o reabierto → en_espera
Asignación: Se elimina analista
Comentario: "Ticket escalado al supervisor"
Evento: ticket_escalado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/analista/components/TicketCard.jsx` | Botón "Escalar" |
| **Frontend - Acción** | `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js` | `escalarTicket()` |
| **Backend - Ruta** | `src/api/routes/ticket_estado_routes.py` | `cambiar_estado_ticket()` L104-113 |
| **Backend - Servicio** | `src/api/services/ticket_estado_service.py` | `analista_escalar_ticket()` L145-168 |
| **Backend - Emisión** | `src/api/routes/ticket_estado_routes.py` | `emit_websocket_event('ticket_escalado')` L113 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |
| **✅ Corrección** | `ticket_estado_routes.py` | L104: `'en espera'` (no `'en_espera'`) |
| **✅ Validación** | `ticketHelpers.js` | `puedeRealizarAccion('escalar')` L418-420 |

---

### 3.2 Detección de Escalamiento
```
Detección: estado === 'en_espera' + comentario de escalamiento + sin analista
Función: fueEscaladoPorAnalista(ticket)
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Helper Centralizado** | `src/front/utils/ticketHelpers.js` | `fueEscaladoPorAnalista()` L167-195 |
| **Uso en Supervisor** | `src/front/protectedViewsRol/supervisor/hooks/useTicketOperations.js` | Import L2 |
| **UI Semáforo** | `src/front/protectedViewsRol/supervisor/components/TicketRow.jsx` | Uso de función |

---

### 3.3 Supervisor Reasigna
```
Estado: en_espera (sin cambio)
Evento: ticket_reasignado
UI: Botón "Reasignar" en ROJO
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón Rojo** | `src/front/protectedViewsRol/supervisor/components/TicketRow.jsx` | Botón condición escalado |
| **Frontend - Acción** | `src/front/protectedViewsRol/supervisor/hooks/useSupervisorActions.js` | `reasignarTicket()` L42-64 |
| **Backend - Ruta** | `src/api/routes/ticket_routes.py` | `asignar_ticket()` L327-385 |
| **Backend - Emisión** | `src/api/routes/ticket_routes.py` | Múltiples eventos L375-378 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |
| **✅ Corrección** | `useSupervisorActions.js` | L47: `id_analista` (no `analista_id`) |

---

## 🗑️ FLUJO 4: Eliminación de Tickets

### 4.1 Eliminación Individual
```
Evento: ticket_eliminado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/supervisor/components/TicketRow.jsx` | Botón "Eliminar" |
| **Frontend - Acción** | `src/front/store/actions/supervisorActions.js` | `eliminarTicket()` |
| **Backend - Ruta** | `src/api/routes/ticket_routes.py` | `delete_ticket()` L138-164 |
| **Backend - Emisión** | `src/api/routes/ticket_routes.py` | `emit('ticket_eliminado')` L159 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTicketEliminado()` L150-158 |

---

### 4.2 Eliminación Masiva
```
Evento: todos_tickets_eliminados
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `src/front/protectedViewsRol/admin/components/AdminPanel.jsx` | Botón "Borrar Todos" |
| **Frontend - Acción** | `src/front/store/actions/adminActions.js` | `borrarTodosTickets()` |
| **Backend - Ruta** | `src/api/routes/ticket_routes.py` | `delete_all_tickets()` L232-274 |
| **Backend - Emisión** | `src/api/routes/ticket_routes.py` | `emit('todos_tickets_eliminados')` L266 |
| **Frontend - Handler** | `src/front/hooks/useWebSocketEvents.js` | `handleTodosTicketsEliminados()` L142-147 |

---

## 📡 FLUJO 5: Eventos WebSocket

### 5.1 Emisión de Eventos (Backend)

| # | Evento | Archivo Backend | Línea |
|---|--------|-----------------|-------|
| 5.1.1 | `ticket_created` | `websocket_utils.py` | L85-94 |
| 5.1.2 | `ticket_asignado` | `ticket_routes.py` | L376 |
| 5.1.3 | `ticket_reasignado` | `ticket_routes.py` | L376 (con flag) |
| 5.1.4 | `asignacion_eliminada` | `asignacion_routes.py` | L138 |
| 5.1.5 | `ticket_iniciado` | `ticket_estado_routes.py` | L93 |
| 5.1.6 | `ticket_solucionado` | `ticket_estado_routes.py` | L102 |
| 5.1.7 | `ticket_cerrado` | `ticket_estado_routes.py` | L68 |
| 5.1.8 | `ticket_reabierto` | `ticket_estado_routes.py` | L84, L135 |
| 5.1.9 | `solicitud_reapertura` | `ticket_estado_routes.py` | L78 |
| 5.1.10 | `ticket_evaluado` | `ticket_routes.py` | L308 |
| 5.1.11 | `ticket_escalado` | `ticket_estado_routes.py` | L113 |
| 5.1.12 | `ticket_eliminado` | `ticket_routes.py` | L159 |
| 5.1.13 | `todos_tickets_eliminados` | `ticket_routes.py` | L266 |
| 5.1.14 | `nuevo_comentario` | `comentario_routes.py` | L93 |

---

### 5.2 Recepción de Eventos (Frontend)

| # | Evento | Handler | Archivo Frontend | Línea |
|---|--------|---------|-----------------|-------|
| 5.2.1 | `ticket_created` | `handleTicketCreated` (con filtro) | `useWebSocketEvents.js` | L67-108 |
| 5.2.2 | `ticket_updated` | `handleTicketUpdate` (con filtro) | `useWebSocketEvents.js` | L33-79 |
| 5.2.3 | `ticket_asignado` | `handleTicketUpdate` | `useWebSocketEvents.js` | L169 |
| 5.2.4 | `ticket_escalado` | `handleTicketUpdate` | `useWebSocketEvents.js` | L170 |
| 5.2.5 | `ticket_reasignado` | `handleTicketUpdate` | `useWebSocketEvents.js` | L171 |
| 5.2.6 | `asignacion_eliminada` | `handleAsignacionEliminada` | `useWebSocketEvents.js` | L172 |
| 5.2.7 | `ticket_iniciado` | `handleTicketUpdate` | `useWebSocketEvents.js` | L176 |
| 5.2.8 | `ticket_solucionado` | `handleTicketUpdate` | `useWebSocketEvents.js` | L177 |
| 5.2.9 | `ticket_cerrado` | `handleTicketUpdate` | `useWebSocketEvents.js` | L178 |
| 5.2.10 | `ticket_reabierto` | `handleTicketUpdate` | `useWebSocketEvents.js` | L179 |
| 5.2.11 | `ticket_evaluado` | `handleTicketUpdate` | `useWebSocketEvents.js` | L180 |
| 5.2.12 | `solicitud_reapertura` | `handleTicketUpdate` | `useWebSocketEvents.js` | L181 |
| 5.2.13 | `nuevo_comentario` | `handleNuevoComentario` | `useWebSocketEvents.js` | L187 |
| 5.2.14 | `ticket_eliminado` | `handleTicketEliminado` | `useWebSocketEvents.js` | L192 |
| 5.2.15 | `todos_tickets_eliminados` | `handleTodosTicketsEliminados` | `useWebSocketEvents.js` | L193 |

---

## 🔧 FLUJO 6: Funciones Helper

| # | Función | Archivo | Propósito | Línea |
|---|---------|---------|-----------|-------|
| 6.1 | `fueEscaladoPorAnalista(ticket)` | `ticketHelpers.js` | Detecta tickets escalados | L167-195 |
| 6.2 | `puedeRealizarAccion(ticket, accion, userRole)` | `ticketHelpers.js` | Valida permisos por rol | L388-455 |
| 6.3 | `getSemaforoColor(ticket)` | `ticketHelpers.js` | Color semáforo supervisor | L457-478 |
| 6.4 | `getEstadoColor(estado)` | `ticketHelpers.js` | Color badge de estado | L93-120 |
| 6.5 | `puedeVerTicket(ticket, user)` | `ticketHelpers.js` | Visibilidad por rol | L203-231 |
| 6.6 | `tieneAnalistaAsignado(ticket)` | `ticketHelpers.js` | Verifica asignación | L19-38 |
| 6.7 | `getAnalistaAsignado(ticket)` | `ticketHelpers.js` | Obtiene nombre analista | L40-65 |
| 6.8 | `normalizeEstado(estado)` | `ticketHelpers.js` | Normaliza estado | L122-130 |
| 6.9 | `getEstadoLabel(estado)` | `ticketHelpers.js` | Label formateado | L132-165 |
| 6.10 | `filtrarTicketsPorRol(tickets, user)` | `ticketHelpers.js` | Filtra por rol | L233-371 |

---

## 🚨 Cómo Usar Este Mapa

### Si falla el subflujo X.Y:

1. Buscar el número en este archivo
2. Ir a los archivos listados
3. Verificar las líneas indicadas
4. Revisar las correcciones aplicadas
5. Corregir el problema

### Ejemplo:
```
Error: "Escalamiento falla con 400"
→ Revisar flujo 3.1
→ Verificar corrección en ticket_estado_routes.py L104
→ Confirmar normalización de estado: 'en espera' (con espacio)
```

### Ejemplo 2:
```
Error: "Analista ve tickets sin asignar"
→ Revisar flujo 1.1
→ Verificar filtro en useWebSocketEvents.js L80-92
→ Confirmar que solo agrega si esParaMi === true
```

---

*Documento generado: 27/12/2025*  
*Versión: 2.0 - Actualizado con todas las correcciones*
