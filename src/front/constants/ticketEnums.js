// ============================================
// ticketEnums.js - Fuente única de verdad Frontend
// ============================================

/**
 * Estados del Ticket (formato frontend con guion bajo)
 * Backend usa espacios, Frontend usa guiones bajos
 */
export const TICKET_STATES = {
    CREADO: 'creado',
    EN_ESPERA: 'en_espera',
    EN_PROCESO: 'en_proceso',
    SOLUCIONADO: 'solucionado',
    CERRADO: 'cerrado',
    REABIERTO: 'reabierto'
};

/**
 * Eventos WebSocket del sistema
 */
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

/**
 * Campos especiales del ticket
 */
export const TICKET_PROPS = {
    SOLICITUD_PENDIENTE: 'tiene_solicitud_reapertura_pendiente'
};

/**
 * Mapeo: Evento WebSocket → Estado resultante
 */
export const EVENT_TO_STATE = {
    [SYSTEM_EVENTS.TICKET_CREATED]: TICKET_STATES.CREADO,
    [SYSTEM_EVENTS.TICKET_ASIGNADO]: TICKET_STATES.EN_ESPERA,
    [SYSTEM_EVENTS.TICKET_INICIADO]: TICKET_STATES.EN_PROCESO,
    [SYSTEM_EVENTS.TICKET_SOLUCIONADO]: TICKET_STATES.SOLUCIONADO,
    [SYSTEM_EVENTS.TICKET_CERRADO]: TICKET_STATES.CERRADO,
    [SYSTEM_EVENTS.TICKET_REABIERTO]: TICKET_STATES.REABIERTO,
    [SYSTEM_EVENTS.ASIGNACION_ELIMINADA]: TICKET_STATES.CREADO
};

/**
 * Lista de estados válidos (para validación)
 */
export const VALID_STATES = Object.values(TICKET_STATES);

/**
 * Lista de eventos válidos (para validación)
 */
export const VALID_EVENTS = Object.values(SYSTEM_EVENTS);

/**
 * Estados que indican que el ticket está "activo" (no cerrado)
 */
export const ACTIVE_STATES = [
    TICKET_STATES.CREADO,
    TICKET_STATES.EN_ESPERA,
    TICKET_STATES.EN_PROCESO,
    TICKET_STATES.SOLUCIONADO,
    TICKET_STATES.REABIERTO
];

/**
 * Estados que permiten escalamiento
 */
export const ESCALATION_STATES = [
    TICKET_STATES.EN_ESPERA,
    TICKET_STATES.EN_PROCESO,
    TICKET_STATES.REABIERTO
];
