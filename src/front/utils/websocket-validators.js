/**
 * @fileoverview Validadores centralizados para eventos WebSocket
 * 
 * Proporciona funciones de validación reutilizables para asegurar
 * la integridad de los datos recibidos por WebSocket.
 * 
 * @module utils/websocket-validators
 */

/**
 * Validar estructura básica de evento de ticket
 * @param {Object} data - Datos del evento WebSocket
 * @returns {boolean} - true si el evento tiene la estructura válida
 */
export function validateTicketEvent(data) {
    if (!data) return false;
    if (!data.ticket_id) return false;
    if (data.ticket && typeof data.ticket !== 'object') return false;
    if (data.cambios && typeof data.cambios !== 'object') return false;
    return true;
}

/**
 * Validar que el ticket completo tenga campos requeridos
 * @param {Object} ticket - Objeto ticket completo
 * @returns {boolean} - true si el ticket tiene todos los campos requeridos
 */
export function validateTicketObject(ticket) {
    if (!ticket || typeof ticket !== 'object') return false;
    if (!ticket.id) return false;
    if (!ticket.titulo) return false;
    if (!ticket.estado) return false;
    return true;
}

/**
 * Validar estructura de evento de asignación de ticket
 * @param {Object} data - Datos del evento de asignación
 * @returns {boolean} - true si válido
 */
export function validateTicketAssignment(data) {
    if (!validateTicketEvent(data)) return false;
    if (!data.analista_id && !data.id_analista) return false;
    return true;
}

/**
 * Log de validación fallida (solo en desarrollo)
 * @param {string} eventName - Nombre del evento WebSocket
 * @param {Object} data - Datos que fallaron la validación
 * @param {string} reason - Razón del fallo de validación
 */
export function logValidationError(eventName, data, reason) {
    if (import.meta.env.DEV) {
        console.warn(`[WebSocket Validation] Event "${eventName}" failed validation:`, {
            reason,
            receivedData: data
        });
    }
}

/**
 * Validar que un array sea válido y no esté vacío
 * @param {any} arr - Valor a validar
 * @returns {boolean} - true si es un array válido
 */
export function validateArray(arr) {
    return Array.isArray(arr);
}

/**
 * Validar ID numérico positivo
 * @param {any} id - ID a validar
 * @returns {boolean} - true si es un ID válido
 */
export function validateId(id) {
    return typeof id === 'number' && id > 0;
}
