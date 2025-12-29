import { TICKET_STATES } from '../constants/ticketEnums';
import { normalizeFromBackend } from './normalize';

/**
 * Mapea el estado normalizado del ticket a la clase CSS correspondiente del dot indicador
 * @param {string} estadoRaw - Estado raw del ticket (cualquier formato)
 * @returns {string} Clase CSS para el dot indicador
 */
export const getEstadoDotClass = (estadoRaw) => {
    const estado = normalizeFromBackend(estadoRaw);
    
    switch (estado) {
        case TICKET_STATES.SOLUCIONADO:
            return 'dot-estado-solucionado';
        case TICKET_STATES.EN_PROCESO:
            return 'dot-estado-en-proceso';
        case TICKET_STATES.EN_ESPERA:
            return 'dot-estado-en-espera';
        case TICKET_STATES.CERRADO:
            return 'dot-estado-cerrado';
        case TICKET_STATES.REABIERTO:
            return 'dot-estado-reabierto';
        case TICKET_STATES.CREADO:
            return 'dot-ct-blue';
        default:
            return 'dot-ct-blue';
    }
};

/**
 * Mapea el estado normalizado del ticket a la clase CSS de badge
 * @param {string} estadoRaw - Estado raw del ticket
 * @returns {string} Clase CSS para badge
 */
export const getEstadoBadgeClass = (estadoRaw) => {
    const estado = normalizeFromBackend(estadoRaw);
    
    switch (estado) {
        case TICKET_STATES.SOLUCIONADO:
            return 'bg-success';
        case TICKET_STATES.EN_PROCESO:
            return 'bg-info';
        case TICKET_STATES.EN_ESPERA:
            return 'bg-warning';
        case TICKET_STATES.CERRADO:
            return 'bg-secondary';
        case TICKET_STATES.REABIERTO:
            return 'bg-primary';
        case TICKET_STATES.CREADO:
            return 'bg-light text-dark';
        default:
            return 'bg-light text-dark';
    }
};
