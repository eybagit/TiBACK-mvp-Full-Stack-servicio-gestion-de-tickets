# 🗺️ Mapa Detallado de Flujos de Tickets - Referencia Técnica Completa

**Última actualización:** 2025-12-29 (Actualización quirúrgica de referencias)  
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
- **Filtrado Backend:** Middleware `emit_con_autorizacion` valida permisos vía JWT
- **Filtrado Frontend:** Validación adicional por rol y permisos
- **Sincronización:** Tiempo real para todos los roles
- **Seguridad:** `_permissions` metadata + `socket_sessions` dict

### Principios de Diseño
1. **Un solo evento por acción** - Backend emite, frontend escucha
2. **Sin redundancia** - Frontend NO emite eventos de tickets
3. **Estado único** - Base de datos es la fuente de verdad
4. **Return inmediato** - Después de emitir WebSocket, retornar para evitar 500
5. **Filtrado en capas** - Backend middleware + frontend validación

---

## 📊 Estados y Eventos Oficiales

### Estados del Ticket
**Archivo:** `src/api/constants/ticket_enums.py` (Líneas 9-19)
- **Clase:** `TicketState(str, Enum)`
- **Estados válidos:**
  - `CREADO = 'creado'` (L14)
  - `EN_ESPERA = 'en espera'` (L15)
  - `EN_PROCESO = 'en proceso'` (L16)
  - `SOLUCIONADO = 'solucionado'` (L17)
  - `CERRADO = 'cerrado'` (L18)
  - `REABIERTO = 'reabierto'` (L19)

> ⚠️ **IMPORTANTE:** `'escalado'` NO es un estado válido. Se detecta por: `estado='en espera'` + sin analista + comentario.

### Eventos WebSocket
**Archivo:** `src/api/constants/ticket_enums.py` (Líneas 32-43)
- **Clase:** `TicketEvent(str, Enum)`
- **Eventos:**
  - `CREATED = 'ticket_created'` (L34)
  - `ASIGNADO = 'ticket_asignado'` (L35)
  - `INICIADO = 'ticket_iniciado'` (L36)
  - `SOLUCIONADO = 'ticket_solucionado'` (L37)
  - `CERRADO = 'ticket_cerrado'` (L38)
  - `REABIERTO = 'ticket_reabierto'` (L39)
  - `ESCALADO = 'ticket_escalado'` (L40)
  - `SOLICITUD_REAPERTURA = 'solicitud_reapertura'` (L41)
  - `ELIMINADO = 'ticket_eliminado'` (L42)

---

## 🔄 FLUJO 1: Ciclo Normal del Ticket

### 1.1 Cliente Crea Ticket

**Estado:** → `creado` → `en_espera`  
**Evento:** `ticket_created`

#### Frontend
- **Componente:** `NuevoTicketForm.jsx`
- **Acción:** `src/front/store/actions/clienteActions.js`
  - Función: `crearTicket()` (~L50-80)
  - Método: POST `/api/tickets`

#### Backend
- **Ruta:** `src/api/routes/ticket_routes.py`
  - Función: `create_ticket()` (L48-80)
  - Decorador: `@require_role(['cliente', 'administrador'])`
  
- **Servicio:** `src/api/services/ticket_service.py`
  - Método: `create_ticket_for_cliente()` (L48-62)
  - Estado asignado: `TicketState.EN_ESPERA.value` (L53)

- **Emisión WebSocket:** `src/api/utils/websocket_utils.py`
  - Función: `emit_ticket_created()` (L94-109)
  - Llama a: `emit_ticket_event()` → `emit_con_autorizacion` (middleware)
  - Room: `global_tickets`
  - Metadata: `_permissions` con `cliente_id`, `roles_permitidos`, `tipo_permiso`

#### Frontend Handler
- **Handler:** `src/front/hooks/useWebSocketEvents.js`
  - Función: `handleTicketCreated()` (L120-162)
  - Listener registrado: L257

---

### 1.2 Supervisor Asigna Analista

**Estado:** `creado`/`en_espera` → `en_espera`  
**Evento:** `ticket_asignado`

#### Frontend
- **Componente:** `src/front/protectedViewsRol/supervisor/components/TicketRow.jsx`
  - Botón "Asignar" (L286, L422)
  
- **Acción:** `src/front/protectedViewsRol/supervisor/hooks/useSupervisorActions.js`
  - Función: `asignarTicket()` (L22-43)
  - Método: POST `/api/tickets/${ticketId}/asignar`

#### Backend
- **Ruta:** `src/api/routes/ticket_routes.py`
  - Función: `asignar_ticket()` (L325-385)
  - Decorador: `@require_role(['supervisor', 'administrador'])`
  - Emisión: `emit_ws_event()` a `global_tickets`

- **Servicio:** `src/api/services/ticket_service.py`
  - Método: `asignar_ticket()` (L186-236)
  - Operaciones: Elimina asignaciones anteriores, crea nueva, agrega comentarios
  - Sleep: `time.sleep(0.1)` (L233) para evitar race conditions

#### Frontend Handler
- **Handler:** `src/front/hooks/useWebSocketEvents.js`
  - Función: `handleTicketUpdate()` (L34-117)
  - Listener registrado: L263-266, L271-278

---

### 1.3 Analista Inicia Trabajo

**Estado:** `en_espera` → `en_proceso`  
**Evento:** `ticket_iniciado`

#### Frontend
- **Componente:** `src/front/protectedViewsRol/analista/components/TicketRow.jsx`
  - Botón "Iniciar" (L318-330)
  
- **Acción:** `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js`
  - Función: `iniciarTicket()` (L13-32)
  - Método: PUT `/api/tickets/${ticketId}/estado`
  - Body: `{ estado: 'en_proceso' }`

- **Acción Legacy:** `src/front/store/actions/analistaActions.js`
  - Función: `startWork()` (L151-176)

#### Backend
- **Ruta:** `src/api/routes/ticket_estado_routes.py`
  - Función: `cambiar_estado_ticket()` (L33-217)
  - Sección: Analista → Iniciar (L97-107)
  - Emisión: `emit_websocket_event()` con `TicketEvent.INICIADO.value` (L103)
  - Return inmediato (L107) para evitar error 500

- **Servicio:** `src/api/services/ticket_estado_service.py`
  - Método: `analista_iniciar_ticket()` (L109-124)
  - Validación: Solo tickets en `'en espera'` (L113)
  - Cambio estado: `TicketState.EN_PROCESO.value` (L118)
  - Sleep: `time.sleep(0.1)` para evitar race conditions

#### Frontend Handler
- **Handler:** `src/front/hooks/useWebSocketEvents.js`
  - Función: `handleTicketUpdate()` (L34-117)
  - Listener registrado: L271

- **Handler Específico:** `src/front/protectedViewsRol/cliente/hooks/useClienteWebSocket.js`
  - Función: `handleTicketIniciado()` (L190-205)
  - Listener registrado: L225

---

### 1.4 Analista Soluciona Ticket

**Estado:** `en_proceso` → `solucionado`  
**Evento:** `ticket_solucionado`

#### Frontend
- **Componente:** `src/front/protectedViewsRol/analista/components/TicketRow.jsx`
  - Botón "Solucionar" (L331-343)
  
- **Acción:** `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js`
  - Función: `solucionarTicket()` (L35-52)
  - Método: PUT `/api/tickets/${ticketId}/estado`
  - Body: `{ estado: 'solucionado' }`

#### Backend
- **Ruta:** `src/api/routes/ticket_estado_routes.py`
  - Sección: Analista → Solucionar (L109-121)
  - Emisión: `emit_websocket_event()` con `TicketEvent.SOLUCIONADO.value` (L114)
  - Return inmediato (L118) para evitar error 500

- **Servicio:** `src/api/services/ticket_estado_service.py`
  - Método: `analista_solucionar_ticket()` (L127-142)
  - Validación: Solo tickets en `'en proceso'` (L130-131)
  - Cambio estado: `TicketState.SOLUCIONADO.value` (L136)
  - Sleep: `time.sleep(0.1)` para evitar race conditions

#### Frontend Handler
- **Handler Cliente:** `src/front/protectedViewsRol/cliente/hooks/useClienteWebSocket.js`
  - Función: `handleTicketSolucionado()` (L122-135)
  - Listener registrado: L226

---

### 1.5 Supervisor Cierra Ticket

**Estado:** `solucionado` → `cerrado`  
**Evento:** `ticket_cerrado`

#### Frontend
- **Acción:** `src/front/store/actions/supervisorActions.js`
  - Función: `cerrarTicket()` (~L300-350)
  - Método: PUT `/api/tickets/${ticketId}/estado`
  - Body: `{ estado: 'cerrado' }`

#### Backend
- **Ruta:** `src/api/routes/ticket_estado_routes.py`
  - Sección: Supervisor → Cerrar (L167-188)
  - Validación: Estados `SOLUCIONADO` o `REABIERTO`
  - Emisión: `emit_websocket_event()` con `TicketEvent.CERRADO.value` (L180)
  - Return inmediato (L184)

- **Servicio:** `src/api/services/ticket_estado_service.py`
  - Método: `supervisor_cerrar_ticket()` (L171-187)
  - Cambio estado: `TicketState.CERRADO.value` (L182)
  - Fecha cierre: `datetime.now()` (L183)

#### Frontend Handler - Cliente
- **Handler Específico:** `src/front/protectedViewsRol/cliente/hooks/useClienteWebSocket.js`
  - Función: `handleTicketCerrado()` (L139-167)
  - Acción: ELIMINA ticket de la vista del cliente
  - Listener registrado: L227

- **Handler Genérico:** `src/front/hooks/useWebSocketEvents.js`
  - Filtro adicional en `handleTicketUpdate()` (L72-90)
  - Listener registrado: L273

---

## 🔄 FLUJO 2: Ticket con Reapertura

### 2.1 Cliente Solicita Reapertura

**Estado:** `solucionado` (sin cambio)  
**Campo:** `tiene_solicitud_reapertura_pendiente = true`  
**Evento:** `solicitud_reapertura`

#### Backend
- **Ruta:** `src/api/routes/ticket_routes.py`
  - Función: `solicitar_reapertura_ticket()` (L169-221)
  - Método: POST `/tickets/<int:ticket_id>/solicitar-reapertura`
  - Decorador: `@require_role(['cliente'])`
  - Comentario creado: "Cliente solicitó reapertura del ticket - Pendiente de decisión del supervisor"
  - Refresh: `db.session.refresh(ticket)` (L203)
  - Emisión: `emit_ws_event()` con evento `'solicitud_reapertura'`

- **Modelo:** `src/api/models.py`
  - Método: `serialize()` del Ticket (L215-274)
  - Cálculo: `tiene_solicitud_reapertura_pendiente` (L239-251)

---

### 2.2 Supervisor Reabre Ticket

**Estado:** `solucionado`/`cerrado` → `en_espera`  
**Evento:** `ticket_reabierto`

#### Backend
- **Ruta:** `src/api/routes/ticket_estado_routes.py`
  - Sección: Supervisor → Reabrir (L190-203)
  - Refresh: `db.session.refresh(ticket)` (L193) - CRÍTICO
  - Emisión: `emit_websocket_event()` con `TicketEvent.REABIERTO.value` (L198)
  - Return inmediato (L200) para evitar error 500

- **Servicio:** `src/api/services/ticket_estado_service.py`
  - Método: `supervisor_reabrir_ticket()` (L190-216)
  - Cambio estado: `TicketState.EN_ESPERA.value` (L203)
  - Limpia fecha cierre: `ticket.fecha_cierre = None` (L204)
  - Elimina asignaciones si estaba solucionado (L207-213)
  - Comentario creado: "Ticket reabierto por supervisor" o "Supervisor aprobó solicitud de reapertura"

---

### 2.3 Cliente Reabre Ticket Cerrado

**Estado:** `cerrado` → `reabierto`  
**Evento:** `ticket_reabierto`

> ⚠️ **IMPORTANTE:** Cuando el cliente reabre un ticket cerrado, el estado cambia a `REABIERTO` (no `EN_ESPERA`). Esto permite que el supervisor vea los botones de cerrar/reabrir correctamente.

#### Backend
- **Ruta:** `src/api/routes/ticket_estado_routes.py`
  - Sección: Cliente → Reabrir (L87-93)
  - Validación: Solo tickets en estado `'cerrado'`
  - Emisión: `emit_websocket_event()` con `TicketEvent.REABIERTO.value` (L92)

- **Servicio:** `src/api/services/ticket_estado_service.py`
  - Método: `cliente_reabrir_ticket()` (L88-105)
  - Validación: Solo tickets `'cerrado'` (L92)
  - Cambio estado: `TicketState.REABIERTO.value` (L96) - **CORREGIDO**
  - Limpia fecha cierre: `ticket.fecha_cierre = None` (L97)

#### Frontend Handler
- **Handler Cliente:** `src/front/protectedViewsRol/cliente/hooks/useClienteWebSocket.js`
  - Función: `handleTicketReabierto()` (L171-191)
  - Actualiza estado a `'reabierto'`
  - Limpia solicitudes de reapertura
  - Listener registrado: L230

---

## ⬆️ FLUJO 3: Ticket Escalado

### 3.1 Analista Escala Ticket

**Estado:** `en_espera`/`en_proceso` → `en_espera`  
**Asignación:** Se elimina analista  
**Evento:** `ticket_escalado`

> ⚠️ **CRÍTICO:** El estado `'escalado'` NO existe. Escalamiento = `en_espera` + sin analista + comentario.

#### Frontend
- **Acción:** `src/front/protectedViewsRol/analista/hooks/useAnalistaActions.js`
  - Función: `escalarTicket()` (L55-145)
  - Método: PUT `/api/tickets/${ticketId}/estado`
  - Body: `{ estado: 'en_espera' }` (NO 'escalado')

- **Acción Legacy:** `src/front/store/actions/analistaActions.js`
  - Función: `escalateTicket()` (L231-278)

#### Backend
- **Ruta:** `src/api/routes/ticket_estado_routes.py`
  - Sección: Analista → Escalar (L123-163)
  - Validación: Estados `EN_ESPERA`, `EN_PROCESO`, `REABIERTO`
  - Data: `data['escalado'] = True` (L139) - Flag indicador
  - Emisión: `emit_websocket_event()` con `TicketEvent.ESCALADO.value` (L143)
  - Return inmediato (L151)

- **Servicio:** `src/api/services/ticket_estado_service.py`
  - Método: `analista_escalar_ticket()` (L145-171)
  - Cambio estado: `TicketState.EN_ESPERA.value` (L154) - NO 'escalado'
  - Elimina asignaciones del analista (L156-163)
  - Sleep: `time.sleep(0.1)` para evitar race conditions

#### Frontend Handler - Analista
- **Handler:** `src/front/hooks/useWebSocketEvents.js`
  - Filtro para analistas en `handleTicketUpdate()` (L52-71)
  - Acción: ELIMINA ticket de la lista del analista
  - Listener registrado: L273

---

## 📁 Estructura Completa de Archivos

### Backend - Rutas

```
src/api/routes/
├── ticket_routes.py
│   ├── create_ticket() [L48-80]
│   ├── asignar_ticket() [L325-385]
│   ├── solicitar_reapertura_ticket() [L169-221]
│   └── delete_ticket() [L138-164]
│
└── ticket_estado_routes.py
    └── cambiar_estado_ticket() [L33-217]
        ├── Cliente cerrar [L62-75]
        ├── Cliente solicitud reapertura [L77-85]
        ├── Cliente reabrir [L87-93]
        ├── Analista iniciar [L97-107]
        ├── Analista solucionar [L109-121]
        ├── Analista escalar [L123-163]
        ├── Supervisor cerrar [L167-188]
        └── Supervisor reabrir [L190-203]
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
    ├── handleTicketCreated() [L120-162]
    ├── handleTicketUpdate() [L34-117]
    └── handleTicketEliminado() [L243-250]

src/front/protectedViewsRol/cliente/hooks/
├── useClienteWebSocket.js
│   ├── handleTicketSolucionado() [L122-135]
│   ├── handleTicketCerrado() [L139-167]
│   ├── handleTicketReabierto() [L171-191]
│   └── handleTicketIniciado() [L190-205]
│
└── useClienteActions.js
    └── crearTicket() [~L50-80]

src/front/protectedViewsRol/analista/hooks/
├── useAnalistaActions.js
│   ├── iniciarTicket() [L13-32]
│   ├── solucionarTicket() [L35-52]
│   └── escalarTicket() [L55-145]
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
│   ├── crearTicket() [~L50-80]
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
- `build_ticket_event_data()` [L243-267] - Construye estructura de data para WebSocket
- `crear_comentario()` [L38-50] - Crea comentario en BD
- `normalizar_estado()` [L19-21] - Convierte "en_espera" ↔ "en espera"

**Archivo:** `src/api/utils/websocket_utils.py`
- `emit_websocket_event()` [L42-57] - DEPRECADO, usar `emit_ticket_event`
- `emit_ticket_event()` [L30-75] - RECOMENDADO - Llama a `emit_con_autorizacion`
- `emit_ticket_created()` [L95-105] - Emite evento de ticket creado con metadata
- `construir_metadata_permisos()` [L267-339] - Construye `_permissions` para filtrado

**Archivo:** `src/api/middleware/websocket_auth.py`
- `emit_con_autorizacion()` [L184-362] - **MIDDLEWARE** Filtra eventos por JWT + `_permissions`
- `validar_jwt_socket()` [L34-78] - Valida JWT desde `socket_sessions` dict
- `validar_permiso()` [L80-182] - Valida permisos del usuario para el evento

### Frontend

**Archivo:** `src/front/hooks/useWebSocketEvents.js`
- `validateTicketEvent` - Importado desde `utils/websocket-validators.js`
- Valida estructura de evento y tipos

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

## 🔄 Historial de Actualizaciones

### 2025-12-29 - Actualización Quirúrgica de Referencias
- ✅ Actualizados números de línea en `useWebSocketEvents.js` según código actual
- ✅ Actualizados números de línea en `useClienteWebSocket.js` según código actual
- ✅ Actualizados números de línea en `ticket_estado_service.py` según código actual
- ✅ Corregida documentación de `solicitar_reapertura_ticket`: ahora crea comentario directamente (no establece flag en BD)
- ✅ Corregida documentación de `supervisor_reabrir_ticket`: ahora solo limpia fecha_cierre y elimina asignaciones (no limpia flag inexistente)
- ✅ Agregada nota sobre campo calculado `tiene_solicitud_reapertura_pendiente` en historial

### 2025-12-29 - Corrección Bug Flujo 2 Segunda Iteración
- 🐛 **BUG CORREGIDO:** En segunda iteración del flujo, supervisor no ve botones de reabrir/cerrar
- ✅ Corregida lógica en `models.py` para tomar la **última** solicitud de reapertura (no la primera)
- ✅ Eliminadas líneas en `ticket_routes.py` que intentaban establecer campo inexistente `tiene_solicitud_reapertura_pendiente` en BD
- ✅ Eliminadas líneas en `ticket_estado_service.py` que intentaban limpiar campo inexistente
- 📝 **Causa:** En múltiples ciclos, había varios comentarios de solicitud. La lógica tomaba el primero y encontraba decisiones del supervisor posteriores, marcando como "no pendiente"
- 📝 **Solución:** Usar `max()` para obtener la última solicitud por fecha y verificar decisiones solo después de esa
- 📝 **Nota:** El campo `tiene_solicitud_reapertura_pendiente` es calculado dinámicamente en `serialize()`, NO existe en BD

### 2025-12-29 - Corrección Bug Flujo 2 (Reapertura por Cliente)
- 🐛 **BUG CORREGIDO:** Cliente reabre ticket pero supervisor no ve botones
- ✅ Cambiado estado en `cliente_reabrir_ticket()` de `EN_ESPERA` a `REABIERTO`
- ✅ Actualizado handler `handleTicketReabierto()` en cliente para usar estado correcto
- ✅ Simplificado logging en handler de reapertura del cliente
- ✅ Agregada sección 2.3 en documentación para flujo de reapertura por cliente
- 📝 **Razón:** El estado `REABIERTO` permite que el supervisor vea los botones de cerrar/reabrir según la lógica en `TicketRow.jsx` (L69)

### Seguridad Actual

**Nivel:** 8/10 ✅ (Mejorado con middleware JWT)

**Mejoras implementadas (2025-12-30):**
- ✅ Arquitectura unificada `global_tickets`
- ✅ Metadata `_permissions` en cada evento
- ✅ **Middleware JWT backend** (`emit_con_autorizacion`)
- ✅ Filtrado en backend antes de emitir eventos
- ✅ Sesiones de socket en `socket_sessions` dict global
- ✅ Auditoría de accesos con logs WARNING
- ✅ Validación de permisos por rol, cliente_id, analista_id, supervisor_id

**Mejoras pendientes:**
- ⚠️ Rate limiting para prevenir spam
- ⚠️ Encriptación end-to-end de chats (opcional)
- ⚠️ Logs centralizados en sistema externo

**Documentación:**
- Ver `mapaDeDatos/seguridad/seguridad.md` para flujos completos de JWT y seguridad
- Ver `src/api/middleware/websocket_auth.py` para implementación del middleware

### 2025-12-29 - Simplificación del Documento
- ✅ Eliminado todo el código de los bloques
- ✅ Mantenidas solo las referencias: rutas de archivos, números de línea, nombres de funciones/métodos
- ✅ Conservada la estructura y organización del documento
- ✅ Facilitada la lectura y navegación del flujo de eventos

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

---

**Última actualización:** 2025-12-30 - Seguridad WebSocket con middleware JWT  
**Mantenido por:** Equipo de desarrollo TiBACK

