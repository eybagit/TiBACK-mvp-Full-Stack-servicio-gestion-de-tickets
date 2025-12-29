// ============================================
// normalize.js - Funciones de normalización
// ============================================

import { VALID_STATES, VALID_EVENTS } from '../constants/ticketEnums';

/**
 * Normaliza estado del backend (espacios) al frontend (guiones bajos)
 * "en espera" → "en_espera"
 * @param {string} estado - Estado en formato backend
 * @returns {string} Estado normalizado para frontend
 */
export const normalizeFromBackend = (estado) => 
    estado?.toLowerCase().trim().replace(/ /g, '_') || '';

/**
 * Normaliza estado del frontend (guiones bajos) al backend (espacios)
 * "en_espera" → "en espera"
 * @param {string} estado - Estado en formato frontend
 * @returns {string} Estado normalizado para backend
 */
export const normalizeToBackend = (estado) => 
    estado?.toLowerCase().trim().replace(/_/g, ' ') || '';

/**
 * Valida si un estado es válido
 * @param {string} estado - Estado a validar
 * @returns {boolean} True si el estado es válido
 */
export const isValidState = (estado) => 
    VALID_STATES.includes(normalizeFromBackend(estado));

/**
 * Valida si un evento es válido
 * @param {string} evento - Evento a validar
 * @returns {boolean} True si el evento es válido
 */
export const isValidEvent = (evento) => 
    VALID_EVENTS.includes(evento);

/**
 * Compara dos estados (ignora formato espacios/guiones)
 * @param {string} estado1 - Primer estado
 * @param {string} estado2 - Segundo estado
 * @returns {boolean} True si los estados coinciden
 */
export const statesMatch = (estado1, estado2) => 
    normalizeFromBackend(estado1) === normalizeFromBackend(estado2);

/**
 * Obtiene el estado normalizado de un ticket
 * Útil para comparaciones consistentes
 * @param {object} ticket - Objeto ticket
 * @returns {string} Estado normalizado
 */
export const getTicketState = (ticket) => 
    normalizeFromBackend(ticket?.estado);
