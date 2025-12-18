/**
 * useAnalistaTickets - Operaciones sobre tickets del analista
 * 
 * REFACTORIZADO: Arquitectura tiback-hello
 * - Usa analistaActions para operaciones
 * - dispatch para actualizar estado
 */

import { analistaActions } from '../../../store';

export function useAnalistaTickets({ store, dispatch, setError, actualizarTickets, emitCriticalTicketAction }) {
    
    // Iniciar trabajo en un ticket
    const iniciarTrabajo = async (ticketId) => {
        try {
            const result = await analistaActions.startWork(
                dispatch,
                store.auth.token,
                ticketId,
                store.websocket.socket,
                emitCriticalTicketAction,
                store.auth.user
            );
            
            if (!result.success) {
                setError(result.error);
            } else {
                await actualizarTickets();
            }
        } catch (e) {
            setError(e.message);
        }
    };

    // Marcar ticket como resuelto
    const marcarComoResuelto = async (ticketId) => {
        try {
            const result = await analistaActions.markAsSolved(
                dispatch,
                store.auth.token,
                ticketId,
                store.websocket.socket,
                emitCriticalTicketAction,
                store.auth.user
            );
            
            if (!result.success) {
                setError(result.error);
            } else {
                await actualizarTickets();
            }
        } catch (e) {
            setError(e.message);
        }
    };

    // Escalar ticket
    const escalarTicket = async (ticketId) => {
        try {
            const result = await analistaActions.escalateTicket(
                dispatch,
                store.auth.token,
                ticketId,
                store.websocket.socket,
                emitCriticalTicketAction,
                store.auth.user
            );
            
            if (!result.success) {
                setError(result.error);
            } else {
                await actualizarTickets();
            }
        } catch (e) {
            setError(e.message);
        }
    };

    // Obtener color según estado
    const getEstadoColor = (estado) => {
        return analistaActions.getEstadoColor(estado);
    };

    return {
        iniciarTrabajo,
        marcarComoResuelto,
        escalarTicket,
        getEstadoColor
    };
}

export default useAnalistaTickets;
