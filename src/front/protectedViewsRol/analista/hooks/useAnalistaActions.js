/**
 * useAnalistaActions - Hook para acciones del analista
 * Iniciar ticket, solucionar, escalar, comentar
 */

import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { getEstadoColor, getPrioridadColor } from '../../../utils/ticketHelpers';

export function useAnalistaActions({ 
  store,
  actualizarTicketsAsignados,
  setError
}) {
  const { emitCriticalTicketAction } = useGlobalReducer();

  // Iniciar trabajo en ticket
  const iniciarTicket = async (ticketId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cambiar-estado`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: 'en_progreso' })
        }
      );

      if (!response.ok) throw new Error('Error al iniciar ticket');

      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_iniciado', store.auth.user);
      }

      await actualizarTicketsAsignados();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Marcar ticket como solucionado
  const solucionarTicket = async (ticketId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cambiar-estado`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: 'solucionado' })
        }
      );

      if (!response.ok) throw new Error('Error al solucionar ticket');

      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_solucionado', store.auth.user);
      }

      await actualizarTicketsAsignados();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Escalar ticket al supervisor
  const escalarTicket = async (ticketId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cambiar-estado`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: 'escalado' })
        }
      );

      if (!response.ok) throw new Error('Error al escalar ticket');

      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_escalado', store.auth.user);
      }

      await actualizarTicketsAsignados();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // getEstadoColor y getPrioridadColor importadas desde ticketHelpers.js

  // Helper: Acciones disponibles según estado
  const getAvailableActions = (ticket) => {
    const estado = ticket.estado?.toLowerCase();
    
    return {
      canStart: estado === 'abierto',
      canSolve: estado === 'en_progreso',
      canEscalate: ['abierto', 'en_progreso'].includes(estado),
      canComment: ['abierto', 'en_progreso', 'escalado'].includes(estado)
    };
  };

  return {
    iniciarTicket,
    solucionarTicket,
    escalarTicket,
    getEstadoColor,
    getPrioridadColor,
    getAvailableActions
  };
}
