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
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: 'en_proceso' })  // ✅ Estado válido según enums
        }
      );

      if (!response.ok) throw new Error('Error al iniciar ticket');

      // ✅ Backend emite 'ticket_iniciado' automáticamente (ticket_estado_routes.py:99)
      // ❌ NO emitir desde aquí - causaría duplicación

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
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`,
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

      // ✅ Backend emite 'ticket_solucionado' automáticamente (ticket_estado_routes.py:107)
      // ❌ NO emitir desde aquí - causaría duplicación

      await actualizarTicketsAsignados();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Escalar ticket al supervisor
  // IMPORTANTE: NO existe estado 'escalado' - Se usa 'en_espera' según enums oficiales
  // El escalamiento se detecta por: comentarios del analista + sin asignación
  const escalarTicket = async (ticketId) => {
    try {
      console.log('🚀 [ESCALAMIENTO] Iniciando escalamiento de ticket:', ticketId);
      console.log('🔑 [ESCALAMIENTO] Token presente:', !!store.auth.token);
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: 'en_espera' })  // ✅ Estado válido
        }
      );

      console.log('📡 [ESCALAMIENTO] Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        // Intentar leer el cuerpo del error
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ [ESCALAMIENTO] Error del servidor (JSON):', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ [ESCALAMIENTO] Error del servidor (TEXT):', errorText);
          errorData = { message: errorText || 'Error desconocido' };
        }
        
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ [ESCALAMIENTO] Escalamiento exitoso');

      // ✅ Backend emite 'ticket_escalado' automáticamente (ticket_estado_routes.py:118)
      // ❌ NO emitir desde aquí - causaría duplicación

      await actualizarTicketsAsignados();
      return { success: true };
    } catch (err) {
      console.error('💥 [ESCALAMIENTO] Error capturado:', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // getEstadoColor y getPrioridadColor importadas desde ticketHelpers.js

  // Helper: Acciones disponibles según estado
  const getAvailableActions = (ticket) => {
    const estado = ticket.estado?.toLowerCase().replace(/\s+/g, '_');
    
    return {
      canStart: estado === 'en_espera',
      canSolve: estado === 'en_proceso',
      canEscalate: ['en_espera', 'en_proceso'].includes(estado),
      canComment: ['en_espera', 'en_proceso', 'reabierto'].includes(estado)
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
