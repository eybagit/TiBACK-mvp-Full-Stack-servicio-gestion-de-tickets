/**
 * Analista Actions - Acciones asíncronas para el módulo Analista
 * Arquitectura tiback-hello: Separación de lógica de negocio
 */

import { tokenUtils } from '../utils/tokenUtils.js';

/**
 * Acciones del Analista
 * Funciones que encapsulan lógica de negocio y llamadas API
 */
export const analistaActions = {
  /**
   * Cargar tickets del analista
   */
  loadTickets: async (dispatch, token) => {
    dispatch({ type: 'ANALISTA_SET_LOADING', payload: true });
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'ANALISTA_SET_TICKETS', payload: data });
      } else {
        dispatch({ type: 'ANALISTA_SET_ERROR', payload: `Error ${response.status}` });
      }
    } catch (error) {
      dispatch({ type: 'ANALISTA_SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'ANALISTA_SET_LOADING', payload: false });
    }
  },

  /**
   * Cargar tickets SILENCIOSAMENTE (sin loading, solo actualiza si hay cambios)
   * Usado por WebSocket para sincronización en background sin flasheo
   */
  loadTicketsSilent: async (dispatch, token, currentTickets) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Solo actualizar si hay diferencias reales (IDs + estados)
        const currentIds = (currentTickets || []).map(t => `${t.id}-${t.estado}`).sort().join(',');
        const newIds = (data || []).map(t => `${t.id}-${t.estado}`).sort().join(',');
        if (currentIds !== newIds) {
          dispatch({ type: 'ANALISTA_SET_TICKETS', payload: data });
        }
      }
    } catch (error) {
      // Silencioso: no mostrar error
      console.debug('Sync silenciosa analista fallida:', error.message);
    }
  },

  /**
   * Cargar datos del usuario analista
   */
  loadUserData: async (dispatch, token) => {
    try {
      const userId = tokenUtils.getUserId(token);
      if (!userId) return;

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'ANALISTA_SET_USER_DATA', payload: data });
        dispatch({ type: 'SET_USER', payload: data });
        
        // Inicializar formulario de info
        dispatch({
          type: 'ANALISTA_SET_INFO_DATA',
          payload: {
            nombre: data.nombre === 'Pendiente' ? '' : data.nombre || '',
            apellido: data.apellido === 'Pendiente' ? '' : data.apellido || '',
            email: data.email || '',
            especialidad: data.especialidad || '',
            password: '',
            confirmPassword: ''
          }
        });
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  },

  /**
   * Actualizar información del perfil
   */
  updateProfile: async (dispatch, token, infoData) => {
    // Validaciones
    if (infoData.password && infoData.password !== infoData.confirmPassword) {
      dispatch({ type: 'ANALISTA_SET_ERROR', payload: 'Las contraseñas no coinciden' });
      return { success: false, error: 'Las contraseñas no coinciden' };
    }
    if (infoData.password && infoData.password.length < 6) {
      dispatch({ type: 'ANALISTA_SET_ERROR', payload: 'La contraseña debe tener al menos 6 caracteres' });
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    dispatch({ type: 'ANALISTA_SET_UPDATING_INFO', payload: true });
    try {
      const userId = tokenUtils.getUserId(token);
      
      const updateData = {
        nombre: infoData.nombre,
        apellido: infoData.apellido,
        email: infoData.email,
        especialidad: infoData.especialidad
      };
      if (infoData.password) updateData.password = infoData.password;

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'ANALISTA_SET_USER_DATA', payload: data });
        dispatch({ type: 'SET_USER', payload: data });
        dispatch({ type: 'analistas_upsert', payload: data });
        dispatch({ type: 'ANALISTA_SET_SHOW_INFO_FORM', payload: false });
        dispatch({ type: 'ANALISTA_SET_ERROR', payload: '' });
        dispatch({ type: 'ANALISTA_RESET_PASSWORD_FIELDS' });
        return { success: true };
      } else {
        const errorData = await response.json();
        dispatch({ type: 'ANALISTA_SET_ERROR', payload: errorData.message || 'Error al actualizar' });
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      dispatch({ type: 'ANALISTA_SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'ANALISTA_SET_UPDATING_INFO', payload: false });
    }
  },

  /**
   * Iniciar trabajo en un ticket
   */
  startWork: async (dispatch, token, ticketId, socket, emitCriticalAction, user) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'en_proceso' })
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        dispatch({ type: 'ANALISTA_UPDATE_TICKET', payload: updatedTicket });
        
        // Emitir eventos WebSocket
        if (socket) {
          if (emitCriticalAction) emitCriticalAction(socket, ticketId, 'ticket_iniciado', user);
          socket.emit('ticket_iniciado', { ticket_id: ticketId, analista_id: user?.id });
          socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'en_proceso' });
        }
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Marcar ticket como resuelto
   */
  markAsSolved: async (dispatch, token, ticketId, socket, emitCriticalAction, user) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'solucionado' })
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        dispatch({ type: 'ANALISTA_UPDATE_TICKET', payload: updatedTicket });
        
        if (socket) {
          if (emitCriticalAction) emitCriticalAction(socket, ticketId, 'ticket_solucionado', user);
          socket.emit('ticket_solucionado', { ticket_id: ticketId, analista_id: user?.id });
          socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'solucionado' });
          socket.emit('ticket_estado_changed', { ticket_id: ticketId, estado: 'solucionado' });
        }
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Escalar ticket
   */
  escalateTicket: async (dispatch, token, ticketId, socket, emitCriticalAction, user) => {
    try {
      console.log('🚀 [ESCALAMIENTO] Iniciando, ticket:', ticketId);
      console.log('🔑 [ESCALAMIENTO] Token:', !!token);
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: 'en_espera' })
      });

      console.log('📡 [ESCALAMIENTO] Status:', response.status, response.statusText);

      if (response.ok) {
        const updatedTicket = await response.json();
        console.log('✅ [ESCALAMIENTO] Exitoso');
        dispatch({ type: 'ANALISTA_UPDATE_TICKET', payload: updatedTicket });
        
        if (socket) {
          if (emitCriticalAction) emitCriticalAction(socket, ticketId, 'ticket_escalado', user);
          socket.emit('ticket_escalado', { 
            ticket_id: ticketId, 
            analista_id: user?.id, 
            motivo: 'Escalado por analista' 
          });
          socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'en_espera' });
          socket.emit('ticket_estado_changed', { ticket_id: ticketId, estado: 'en_espera', was_escalated: true });
        }
        return { success: true };
      } else {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ [ESCALAMIENTO] Error JSON:', errorData);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ [ESCALAMIENTO] Error TEXT:', errorText);
          errorData = { message: errorText || 'Error desconocido' };
        }
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('💥 [ESCALAMIENTO] Exception:', error.message, error.stack);
      return { success: false, error: error.message };
    }
  },

  /**
   * Búsqueda de tickets
   */
  handleSearch: (dispatch, query, tickets) => {
    dispatch({ type: 'ANALISTA_SET_SEARCH_QUERY', payload: query });
    
    if (query.trim().length === 0) {
      dispatch({ type: 'ANALISTA_SET_SEARCH_RESULTS', payload: [] });
      dispatch({ type: 'ANALISTA_SET_SHOW_SEARCH_RESULTS', payload: false });
      return;
    }

    const filteredTickets = tickets.filter(ticket =>
      ticket.titulo?.toLowerCase().includes(query.toLowerCase().trim()) ||
      ticket.descripcion?.toLowerCase().includes(query.toLowerCase().trim()) ||
      ticket.id?.toString().includes(query)
    );

    dispatch({ type: 'ANALISTA_SET_SEARCH_RESULTS', payload: filteredTickets.slice(0, 5) });
    dispatch({ type: 'ANALISTA_SET_SHOW_SEARCH_RESULTS', payload: filteredTickets.length > 0 });
  },

  /**
   * Seleccionar ticket desde búsqueda
   */
  selectTicketFromSearch: (dispatch, ticket) => {
    dispatch({ type: 'ANALISTA_CLEAR_SEARCH' });
    dispatch({ type: 'ANALISTA_SET_ACTIVE_VIEW', payload: `ticket-${ticket.id}` });
  },

  /**
   * Manejar cambio en campo de formulario
   */
  handleInfoChange: (dispatch, e) => {
    const { name, value } = e.target;
    dispatch({
      type: 'ANALISTA_UPDATE_INFO_FIELD',
      payload: { field: name, value }
    });
  },

  /**
   * Obtener color según estado
   */
  getEstadoColor: (estado) => {
    switch ((estado || '').toLowerCase()) {
      case 'en_espera': return 'badge bg-warning';
      case 'en_proceso': return 'badge bg-primary';
      case 'solucionado': return 'badge bg-success';
      case 'cerrado': return 'badge bg-dark';
      default: return 'badge bg-secondary';
    }
  }
};

export default analistaActions;
