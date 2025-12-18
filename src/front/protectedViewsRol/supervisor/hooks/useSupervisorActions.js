/**
 * useSupervisorActions - Hook para acciones del supervisor
 * Asignar tickets, reabrir, escalar, aprobar reapertura
 */

import useGlobalReducer from '../../../hooks/useGlobalReducer';

export function useSupervisorActions({ 
  store,
  tickets,
  actualizarTickets,
  actualizarTodasLasTablas,
  setError,
  backendRequest
}) {
  const { emitCriticalTicketAction } = useGlobalReducer();

  // Asignar ticket a analista
  const asignarTicket = async (ticketId, analistaId) => {
    try {
      const response = await backendRequest(`/api/tickets/${ticketId}/asignar`, {
        method: 'POST',
        body: JSON.stringify({ analista_id: analistaId })
      });

      if (!response.ok) throw new Error('Error al asignar ticket');

      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_asignado', store.auth.user);
      }

      await actualizarTickets();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Reasignar ticket
  const reasignarTicket = async (ticketId, analistaId) => {
    try {
      const response = await backendRequest(`/api/tickets/${ticketId}/reasignar`, {
        method: 'PUT',
        body: JSON.stringify({ analista_id: analistaId })
      });

      if (!response.ok) throw new Error('Error al reasignar ticket');

      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_reasignado', store.auth.user);
      }

      await actualizarTickets();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Aprobar reapertura de ticket
  const aprobarReapertura = async (ticketId) => {
    try {
      const response = await backendRequest(`/api/tickets/${ticketId}/cambiar-estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'reabrir' })
      });

      if (!response.ok) throw new Error('Error al reabrir ticket');

      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_reabierto', store.auth.user);
      }

      await actualizarTodasLasTablas();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Rechazar reapertura
  const rechazarReapertura = async (ticketId) => {
    try {
      const response = await backendRequest(`/api/tickets/${ticketId}/cambiar-estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'cerrado' })
      });

      if (!response.ok) throw new Error('Error al rechazar reapertura');

      await actualizarTodasLasTablas();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Helper: Color de estado
  const getEstadoColor = (estado) => {
    const colors = {
      'abierto': 'warning',
      'en_progreso': 'info',
      'solucionado': 'success',
      'cerrado': 'secondary',
      'escalado': 'danger',
      'pendiente_reapertura': 'warning'
    };
    return colors[estado?.toLowerCase()] || 'secondary';
  };

  // Helper: Color de prioridad
  const getPrioridadColor = (prioridad) => {
    const colors = {
      'alta': 'danger',
      'media': 'warning',
      'baja': 'success'
    };
    return colors[prioridad?.toLowerCase()] || 'secondary';
  };

  // Helper: Acciones disponibles según estado
  const getAvailableActions = (ticket) => {
    const estado = ticket.estado?.toLowerCase();
    const tieneAnalista = ticket.asignaciones?.length > 0;
    
    const actions = {
      canAssign: estado === 'abierto' && !tieneAnalista,
      canReassign: tieneAnalista && ['abierto', 'en_progreso', 'escalado'].includes(estado),
      canReopen: estado === 'pendiente_reapertura' || estado === 'solucionado',
      canClose: estado === 'solucionado',
      canEscalate: ['abierto', 'en_progreso'].includes(estado)
    };
    
    return actions;
  };

  return {
    asignarTicket,
    reasignarTicket,
    aprobarReapertura,
    rechazarReapertura,
    getEstadoColor,
    getPrioridadColor,
    getAvailableActions
  };
}
