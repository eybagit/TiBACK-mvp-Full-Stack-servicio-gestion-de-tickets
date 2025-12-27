/**
 * useSupervisorActions - Hook para acciones del supervisor
 * Asignar tickets, reabrir, escalar, aprobar reapertura
 */

import { useContext, useState, useCallback } from 'react';
import { TICKET_STATES, TICKET_PROPS } from '../../../constants/ticketEnums';
import { normalizeFromBackend } from '../../../utils/normalize';
import { fueEscaladoPorAnalista } from '../../../utils/ticketHelpers';
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
        body: JSON.stringify({ id_analista: analistaId })
      });

      if (!response.ok) throw new Error('Error al asignar ticket');

      // WebSocket se encarga de la actualización local
      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_asignado', store.auth.user);
      }

      // NO hacer fetch - WebSocket actualiza localmente
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Reasignar ticket
  const reasignarTicket = async (ticketId, analistaId) => {
    try {
      const response = await backendRequest(`/api/tickets/${ticketId}/asignar`, {
        method: 'POST',
        body: JSON.stringify({ 
          id_analista: analistaId,
          es_reasignacion: true
        })
      });

      if (!response.ok) throw new Error('Error al reasignar ticket');

      // WebSocket se encarga de la actualización local
      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_reasignado', store.auth.user);
      }

      // NO hacer fetch - WebSocket actualiza localmente
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
    const estado = normalizeFromBackend(ticket.estado);
    const tieneAnalista = ticket.asignaciones?.length > 0;
    const tieneSolicitudReapertura = ticket[TICKET_PROPS.SOLICITUD_PENDIENTE];
    
    const actions = {
      canAssign: estado === TICKET_STATES.CREADO && !tieneAnalista,
      canReassign: tieneAnalista && (fueEscaladoPorAnalista(ticket) || estado === TICKET_STATES.EN_PROCESO),
      canReopen: tieneSolicitudReapertura || estado === TICKET_STATES.SOLUCIONADO,
      canClose: estado === TICKET_STATES.SOLUCIONADO,
      canEscalate: estado === TICKET_STATES.EN_PROCESO || estado === TICKET_STATES.EN_ESPERA
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
