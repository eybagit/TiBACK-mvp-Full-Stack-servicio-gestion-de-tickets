# 🗺️ Mapa de Flujos de Tickets - Referencia Rápida

**Última actualización:** 27/12/2025

---

## 🎯 FLUJO 1: Ticket Exitoso (Camino Feliz)

### 1.1 Cliente Crea Ticket
```
Estado: → creado
Evento: ticket_created
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Formulario** | `NuevoTicketForm.jsx` | Componente completo |
| **Frontend - Acción** | `clienteActions.js` | `crearTicket()` |
| **Backend - Ruta** | `ticket_routes.py` | `create_ticket()` L48-67 |
| **Backend - Emisión** | `websocket_utils.py` | `emit_ticket_created()` L85-94 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketCreated()` L67-108 |

---

### 1.2 Supervisor Asigna Analista
```
Estado: creado → en_espera
Evento: ticket_asignado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `TicketRow.jsx` (Supervisor) | Botón "Asignar" |
| **Frontend - Acción** | `useSupervisorActions.js` | `asignarTicket()` L19-38 |
| **Backend - Ruta** | `ticket_routes.py` | `asignar_ticket()` L327-385 |
| **Backend - Emisión** | `ticket_routes.py` | `emit_ws_event('ticket_asignado')` L374 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 1.3 Analista Inicia Trabajo
```
Estado: en_espera → en_proceso
Evento: ticket_iniciado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `TicketCard.jsx` (Analista) | Botón "Iniciar" |
| **Frontend - Acción** | `useAnalistaActions.js` | `iniciarTicket()` |
| **Backend - Ruta** | `ticket_estado_routes.py` | `cambiar_estado_ticket()` L89-93 |
| **Backend - Servicio** | `ticket_estado_service.py` | `analista_iniciar_ticket()` L109-124 |
| **Backend - Emisión** | `ticket_estado_routes.py` | `emit_websocket_event('ticket_iniciado')` L93 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 1.4 Analista Soluciona Ticket
```
Estado: en_proceso → solucionado
Evento: ticket_solucionado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `TicketCard.jsx` (Analista) | Botón "Solucionar" |
| **Frontend - Acción** | `useAnalistaActions.js` | `solucionarTicket()` |
| **Backend - Ruta** | `ticket_estado_routes.py` | `cambiar_estado_ticket()` L95-102 |
| **Backend - Servicio** | `ticket_estado_service.py` | `analista_solucionar_ticket()` L127-142 |
| **Backend - Emisión** | `ticket_estado_routes.py` | `emit_websocket_event('ticket_solucionado')` L102 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 1.5 Cliente Cierra y Evalúa
```
Estado: solucionado → cerrado
Evento: ticket_cerrado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `TicketRow.jsx` (Cliente) | Botón "Cerrar" |
| **Frontend - Modal** | `EvaluarTicketModal.jsx` | Modal evaluación |
| **Frontend - Acción** | `clienteActions.js` | `cerrarTicket()` |
| **Backend - Ruta** | `ticket_estado_routes.py` | `cambiar_estado_ticket()` L59-68 |
| **Backend - Servicio** | `ticket_estado_service.py` | `cliente_cerrar_ticket()` L48-68 |
| **Backend - Emisión** | `ticket_estado_routes.py` | `emit_websocket_event('ticket_cerrado')` L68 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

## 🔄 FLUJO 2: Ticket con Reapertura

### 2.1 Cliente Solicita Reapertura
```
Estado: solucionado (sin cambio)
Campo: tiene_solicitud_reapertura_pendiente = true
Evento: solicitud_reapertura
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `TicketRow.jsx` (Cliente) | Botón "Solicitar Reapertura" |
| **Frontend - Acción** | `clienteActions.js` | `solicitarReapertura()` |
| **Backend - Ruta** | `ticket_routes.py` | `solicitar_reapertura_ticket()` L169-221 |
| **Backend - Comentario** | `ticket_routes.py` | Crea comentario específico L192-199 |
| **Backend - Refresh** | `ticket_routes.py` | `db.session.refresh(ticket)` L203 |
| **Backend - Emisión** | `ticket_routes.py` | `emit_ws_event('solicitud_reapertura')` L213 |
| **Backend - Campo** | `models.py` | Calcula `tiene_solicitud_reapertura_pendiente` L247 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 2.2 Supervisor Aprueba/Rechaza Reapertura
```
Estado: solucionado → reabierto (aprueba) o cerrado (rechaza)
Evento: ticket_reabierto o ticket_cerrado
UI: Botones "Cerrar" y "Reabrir"
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botones** | `TicketRow.jsx` (Supervisor) | Botones L295-313 |
| **Frontend - Lógica** | `TicketRow.jsx` (Supervisor) | `actions.canReopen` L57 |
| **Frontend - Acción Reabrir** | `useTicketOperations.js` | `reabrirTicket()` L104-129 |
| **Frontend - Acción Cerrar** | `useTicketOperations.js` | `cerrarTicket()` |
| **Backend - Ruta** | `ticket_estado_routes.py` | `cambiar_estado_ticket()` L132-135 |
| **Backend - Servicio** | `ticket_estado_service.py` | `supervisor_reabrir_ticket()` L192-213 |
| **Backend - Emisión** | `ticket_estado_routes.py` | `emit_websocket_event('ticket_reabierto')` L135 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 2.3 Cliente Reabre Directamente
```
Estado: cerrado → reabierto
Evento: ticket_reabierto
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `TicketRow.jsx` (Cliente) | Botón "Reabrir" |
| **Frontend - Acción** | `clienteActions.js` | `reabrirTicket()` |
| **Backend - Ruta** | `ticket_estado_routes.py` | `cambiar_estado_ticket()` L78-84 |
| **Backend - Servicio** | `ticket_estado_service.py` | `cliente_reabrir_ticket()` L88-105 |
| **Backend - Emisión** | `ticket_estado_routes.py` | `emit_websocket_event('ticket_reabierto')` L84 |

---

## ⬆️ FLUJO 3: Ticket Escalado

### 3.1 Analista Escala Ticket
```
Estado: en_espera/en_proceso/reabierto → en_espera
Asignación: Se elimina analista
Evento: ticket_escalado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `TicketCard.jsx` (Analista) | Botón "Escalar" |
| **Frontend - Acción** | `useAnalistaActions.js` | `escalarTicket()` |
| **Backend - Ruta** | `ticket_estado_routes.py` | `cambiar_estado_ticket()` L104-113 |
| **Backend - Servicio** | `ticket_estado_service.py` | `analista_escalar_ticket()` L145-168 |
| **Backend - Emisión** | `ticket_estado_routes.py` | `emit_websocket_event('ticket_escalado')` L113 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

### 3.2 Detección de Escalamiento
```
Detección: estado === 'en_espera' + comentario escalamiento + sin analista
Función: fueEscaladoPorAnalista(ticket)
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Helper** | `ticketHelpers.js` | `fueEscaladoPorAnalista()` L167-195 |
| **Uso** | `useTicketOperations.js` | Import y uso |

---

### 3.3 Supervisor Reasigna
```
Estado: en_espera (sin cambio)
Evento: ticket_asignado
UI: Botón "Reasignar" en ROJO
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Frontend - Botón** | `TicketRow.jsx` (Supervisor) | Botón rojo si escalado |
| **Frontend - Acción** | `useSupervisorActions.js` | `reasignarTicket()` L42-64 |
| **Backend - Ruta** | `ticket_routes.py` | `asignar_ticket()` L327-385 |
| **Backend - Emisión** | `ticket_routes.py` | `emit_ws_event('ticket_asignado')` L374 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketUpdate()` L33-79 |

---

## 🗑️ FLUJO 4: Eliminación de Tickets

### 4.1 Eliminación Individual
```
Evento: ticket_eliminado
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Backend - Ruta** | `ticket_routes.py` | `delete_ticket()` L138-164 |
| **Backend - Emisión** | `ticket_routes.py` | `emit('ticket_eliminado')` L159 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTicketEliminado()` L150-158 |

---

### 4.2 Eliminación Masiva
```
Evento: todos_tickets_eliminados
```

| Componente | Archivo | Función/Línea |
|------------|---------|---------------|
| **Backend - Ruta** | `ticket_routes.py` | `delete_all_tickets()` L232-274 |
| **Backend - Emisión** | `ticket_routes.py` | `emit('todos_tickets_eliminados')` L266 |
| **Frontend - Handler** | `useWebSocketEvents.js` | `handleTodosTicketsEliminados()` L142-147 |

---

## 📡 FLUJO 5: Eventos WebSocket

### Emisión de Eventos (Backend)

| Evento | Archivo | Línea |
|--------|---------|-------|
| `ticket_created` | `websocket_utils.py` | L85-94 |
| `ticket_asignado` | `ticket_routes.py` | L374 |
| `ticket_iniciado` | `ticket_estado_routes.py` | L93 |
| `ticket_solucionado` | `ticket_estado_routes.py` | L102 |
| `ticket_cerrado` | `ticket_estado_routes.py` | L68 |
| `ticket_reabierto` | `ticket_estado_routes.py` | L84, L135 |
| `solicitud_reapertura` | `ticket_routes.py` | L213 |
| `ticket_escalado` | `ticket_estado_routes.py` | L113 |
| `ticket_eliminado` | `ticket_routes.py` | L159 |

---

### Recepción de Eventos (Frontend)

| Evento | Handler | Línea |
|--------|---------|-------|
| `ticket_created` | `handleTicketCreated` | L67-108 |
| `ticket_updated` | `handleTicketUpdate` | L33-79 |
| `ticket_asignado` | `handleTicketUpdate` | L222 |
| `ticket_escalado` | `handleTicketUpdate` | L223 |
| `ticket_iniciado` | `handleTicketUpdate` | L230 |
| `ticket_solucionado` | `handleTicketUpdate` | L231 |
| `ticket_cerrado` | `handleTicketUpdate` | L232 |
| `ticket_reabierto` | `handleTicketUpdate` | L233 |
| `solicitud_reapertura` | `handleTicketUpdate` | L235 |
| `ticket_eliminado` | `handleTicketEliminado` | L246 |

**Todos los handlers en:** `src/front/hooks/useWebSocketEvents.js`

---

## 🔧 Funciones Helper Principales

| Función | Archivo | Propósito |
|---------|---------|-----------|
| `fueEscaladoPorAnalista(ticket)` | `ticketHelpers.js` | Detecta tickets escalados |
| `puedeRealizarAccion(ticket, accion, userRole)` | `ticketHelpers.js` | Valida permisos por rol |
| `getSemaforoColor(ticket)` | `ticketHelpers.js` | Color semáforo supervisor |
| `getFilteredTickets(state)` | `supervisorActions.js` | Filtra tickets por estado |

---

*Última actualización: 27/12/2025*  
*Para correcciones aplicadas, ver: `correccionesFlujo.md`*
