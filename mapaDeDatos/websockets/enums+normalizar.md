# 🚀 Estrategia: Enums + Normalización

siguiendo las restricciones e instrucciones de los 4 archivos en la carpeta C:\Users\Elkin\Desktop\PROYECTOS\Codigo\TiBACK-fast\TiBACK-fast\documentacion aplica la estrategia de enums + normalización a todo el proyecto

**Última actualización:** 27/12/2025  
**Objetivo:** Eliminar errores de tipeo (typos), inconsistencias entre BD y Frontend, y simplificar el mantenimiento.

---

## 📋 Lista Maestra de Elementos (20 en total)

### I. Estados Oficiales (1-6)
1. `creado`
2. `en espera` / `en_espera`
3. `en proceso` / `en_proceso`
4. `solucionado`
5. `cerrado`
6. `reabierto`

### II. Eventos WebSocket (10-19)
10. `ticket_created`
11. `ticket_asignado`
12. `ticket_iniciado`
13. `ticket_solucionado`
14. `ticket_cerrado`
15. `ticket_reabierto`
16. `ticket_escalado`
17. `solicitud_reapertura` (Evento, NO estado)
18. `ticket_eliminado`
19. `asignacion_eliminada`

### III. Campos Auxiliares (20)
20. `tiene_solicitud_reapertura_pendiente` (Boolean calculado)

---

## 📑 Catálogo Completo de Enums

### 🧩 Frontend (JavaScript)
```javascript
// Estados del Ticket
export const TICKET_STATES = {
    CREADO: 'creado',
    EN_ESPERA: 'en_espera',
    EN_PROCESO: 'en_proceso',
    SOLUCIONADO: 'solucionado',
    CERRADO: 'cerrado',
    REABIERTO: 'reabierto'
};

// Eventos de Sistema
export const SYSTEM_EVENTS = {
    TICKET_CREATED: 'ticket_created',
    TICKET_ASIGNADO: 'ticket_asignado',
    TICKET_INICIADO: 'ticket_iniciado',
    TICKET_SOLUCIONADO: 'ticket_solucionado',
    TICKET_CERRADO: 'ticket_cerrado',
    TICKET_REABIERTO: 'ticket_reabierto',
    TICKET_ESCALADO: 'ticket_escalado',
    SOLICITUD_REAPERTURA: 'solicitud_reapertura',
    TICKET_ELIMINADO: 'ticket_eliminado',
    ASIGNACION_ELIMINADA: 'asignacion_eliminada'
};

// Campos Especiales
export const TICKET_PROPS = {
    SOLICITUD_PENDIENTE: 'tiene_solicitud_reapertura_pendiente'
};
```

### 🐍 Backend (Python)
```python
# Estados del Ticket (Formato Base de Datos)
class TicketState:
    CREADO = 'creado'
    EN_ESPERA = 'en espera'
    EN_PROCESO = 'en proceso'
    SOLUCIONADO = 'solucionado'
    CERRADO = 'cerrado'
    REABIERTO = 'reabierto'

# Eventos de Sistema
class TicketEvent:
    CREATED = 'ticket_created'
    ASIGNADO = 'ticket_asignado'
    INICIADO = 'ticket_iniciado'
    SOLUCIONADO = 'ticket_solucionado'
    CERRADO = 'ticket_cerrado'
    REABIERTO = 'ticket_reabierto'
    ESCALADO = 'ticket_escalado'
    SOLICITUD_REAPERTURA = 'solicitud_reapertura'
    ELIMINADO = 'ticket_eliminado'
    ASIGNACION_ELIMINADA = 'asignacion_eliminada'

# Campos Especiales
class TicketFields:
    SOLICITUD_PENDIENTE = 'tiene_solicitud_reapertura_pendiente'
```

---

## 🛠️ Implementación Recomendada

### Normalización Única
```javascript
// JS - normalize.js
export const normalizeState = (estado) => 
    estado?.toLowerCase().trim().replace(/ /g, '_') || '';
```

```python
# Python - formatters.py
def normalizar_estado(estado):
    return estado.lower().strip().replace('_', ' ') if estado else ""
```

---

## 3. Beneficios de esta arquitectura

1. **Mantenimiento**: Cambio de nombre de estado en un solo lugar.
2. **Consistencia**: Frontend (`en_espera`) vs Backend (`en espera`) resuelto por diseño.
3. **Escalabilidad**: Fácil añadir nuevos estados o eventos sin romper comparaciones.

> [!TIP]
> **Regla de Oro**: Nunca comparar `ticket.estado` directamente contra un string manual. Siempre normalizar primero y comparar contra el Enum.
