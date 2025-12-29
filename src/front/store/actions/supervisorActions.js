/**
 * Supervisor Actions - Acciones asíncronas para el módulo Supervisor
 * Arquitectura tiback-hello: Separación de lógica de negocio
 */

import { tokenUtils } from '../utils/tokenUtils.js';
import { TICKET_STATES } from '../../constants/ticketEnums';
import { normalizeFromBackend, statesMatch } from '../../utils/normalize';


/**
 * Acciones del Supervisor
 * Funciones que encapsulan lógica de negocio y llamadas API
 */
export const supervisorActions = {
  /**
   * Cargar tickets del supervisor (con loading visible)
   */
  loadTickets: async (dispatch, token) => {
    dispatch({ type: 'SUPERVISOR_SET_LOADING', payload: true });
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SUPERVISOR_SET_TICKETS', payload: data });
      } else {
        dispatch({ type: 'SUPERVISOR_SET_ERROR', payload: `Error ${response.status}` });
      }
    } catch (error) {
      dispatch({ type: 'SUPERVISOR_SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SUPERVISOR_SET_LOADING', payload: false });
    }
  },

  /**
   * Cargar tickets SILENCIOSAMENTE (sin loading, solo actualiza si hay cambios)
   * Usado por WebSocket para sincronización en background sin flasheo
   */
  loadTicketsSilent: async (dispatch, token, currentTickets) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Solo actualizar si hay diferencias reales
        const currentIds = (currentTickets || []).map(t => `${t.id}-${t.estado}`).sort().join(',');
        const newIds = (data || []).map(t => `${t.id}-${t.estado}`).sort().join(',');
        if (currentIds !== newIds) {
          dispatch({ type: 'SUPERVISOR_SET_TICKETS', payload: data });
        }
      }
    } catch (error) {
      // Silencioso: no mostrar error
      console.debug('Sync silenciosa fallida:', error.message);
    }
  },

  /**
   * Cargar tickets cerrados
   */
  loadClosedTickets: async (dispatch, token) => {
    dispatch({ type: 'SUPERVISOR_SET_LOADING_CERRADOS', payload: true });
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor/cerrados`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SUPERVISOR_SET_TICKETS_CERRADOS', payload: data });
      }
    } catch (error) {
      console.error('Error cargando tickets cerrados:', error);
    } finally {
      dispatch({ type: 'SUPERVISOR_SET_LOADING_CERRADOS', payload: false });
    }
  },

  /**
   * Cargar tickets cerrados SILENCIOSAMENTE
   */
  loadClosedTicketsSilent: async (dispatch, token, currentCerrados) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor/cerrados`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const currentIds = (currentCerrados || []).map(t => t.id).sort().join(',');
        const newIds = (data || []).map(t => t.id).sort().join(',');
        if (currentIds !== newIds) {
          dispatch({ type: 'SUPERVISOR_SET_TICKETS_CERRADOS', payload: data });
        }
      }
    } catch (error) {
      console.debug('Sync silenciosa cerrados fallida:', error.message);
    }
  },

  /**
   * Cargar analistas
   */
  loadAnalistas: async (dispatch, token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SUPERVISOR_SET_ANALISTAS', payload: data });
        // También actualizar lista global de analistas
        dispatch({ type: 'analistas_set_list', payload: data });
      }
    } catch (error) {
      console.error('Error cargando analistas:', error);
    }
  },

  /**
   * Cargar datos del usuario supervisor
   */
  loadUserData: async (dispatch, token) => {
    try {
      const userId = tokenUtils.getUserId(token);
      if (!userId) return;

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SUPERVISOR_SET_USER_DATA', payload: data });
        dispatch({ type: 'SET_USER', payload: data });
        
        // Inicializar formulario de info
        dispatch({
          type: 'SUPERVISOR_SET_INFO_DATA',
          payload: {
            nombre: data.nombre === 'Pendiente' ? '' : data.nombre || '',
            apellido: data.apellido === 'Pendiente' ? '' : data.apellido || '',
            email: data.email || '',
            area_responsable: data.area_responsable || '',
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
    dispatch({ type: 'SUPERVISOR_SET_UPDATING_INFO', payload: true });
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(infoData)
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SUPERVISOR_SET_USER_DATA', payload: data });
        dispatch({ type: 'SET_USER', payload: data });
        dispatch({ type: 'SUPERVISOR_SET_SHOW_INFO_FORM', payload: false });
        dispatch({ type: 'SUPERVISOR_RESET_PASSWORD_FIELDS' });
        return { success: true };
      } else {
        const errorData = await response.json();
        dispatch({ type: 'SUPERVISOR_SET_ERROR', payload: errorData.message || 'Error al actualizar' });
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      dispatch({ type: 'SUPERVISOR_SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SUPERVISOR_SET_UPDATING_INFO', payload: false });
    }
  },

  /**
   * Asignar ticket a analista
   */
  assignTicket: async (dispatch, token, ticketId, analistaId, emitCriticalAction) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/asignar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ analista_id: analistaId })
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        dispatch({ type: 'SUPERVISOR_UPDATE_TICKET', payload: updatedTicket });
        
        // Emitir acción crítica via WebSocket si está disponible
        if (emitCriticalAction) {
          emitCriticalAction(ticketId, 'assign');
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
   * Cerrar ticket
   */
  closeTicket: async (dispatch, token, ticketId, emitCriticalAction) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cerrar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        dispatch({ type: 'SUPERVISOR_REMOVE_TICKET', payload: ticketId });
        
        if (emitCriticalAction) {
          emitCriticalAction(ticketId, 'close');
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
   * Reabrir ticket
   */
  reopenTicket: async (dispatch, token, ticketId, emitCriticalAction) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/reabrir`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        dispatch({ type: 'SUPERVISOR_ADD_TICKET', payload: updatedTicket });
        
        if (emitCriticalAction) {
          emitCriticalAction(ticketId, 'reopen');
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
  escalateTicket: async (dispatch, token, ticketId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/escalar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        dispatch({ type: 'SUPERVISOR_UPDATE_TICKET', payload: updatedTicket });
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
   * Búsqueda de tickets
   */
  handleSearch: (dispatch, query, tickets) => {
    dispatch({ type: 'SUPERVISOR_SET_SEARCH_QUERY', payload: query });
    
    if (query.trim().length === 0) {
      dispatch({ type: 'SUPERVISOR_SET_SEARCH_RESULTS', payload: [] });
      dispatch({ type: 'SUPERVISOR_SET_SHOW_SEARCH_RESULTS', payload: false });
      return;
    }

    const filteredTickets = tickets.filter(ticket =>
      ticket.titulo?.toLowerCase().includes(query.toLowerCase().trim()) ||
      ticket.id?.toString().includes(query)
    );

    dispatch({ type: 'SUPERVISOR_SET_SEARCH_RESULTS', payload: filteredTickets.slice(0, 5) });
    dispatch({ type: 'SUPERVISOR_SET_SHOW_SEARCH_RESULTS', payload: filteredTickets.length > 0 });
  },

  /**
   * Seleccionar ticket desde búsqueda
   */
  selectTicketFromSearch: (dispatch, ticket) => {
    dispatch({ type: 'SUPERVISOR_CLEAR_SEARCH' });
    dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: `ticket-${ticket.id}` });
  },

  /**
   * Manejar cambio en campo de formulario
   */
  handleInfoChange: (dispatch, e) => {
    const { name, value } = e.target;
    dispatch({
      type: 'SUPERVISOR_UPDATE_INFO_FIELD',
      payload: { field: name, value }
    });
  },

  /**
   * Obtener tickets filtrados (selector)
   */
  getFilteredTickets: (supervisorState) => {
    const { tickets, filterEstado, filterAsignado, filterPrioridad, filterAnalista } = supervisorState;
    
    // Validar que tickets sea un array
    if (!Array.isArray(tickets)) {
      console.warn('[supervisorActions] tickets no es un array:', tickets);
      return [];
    }
    
    // FILTRO BASE: Excluir tickets cerrados de "Gestión de Tickets"
    // Los tickets cerrados solo aparecen en la vista "Tickets Cerrados"
    let filtered = tickets.filter(t => {
      const estado = normalizeFromBackend(t.estado);
      return estado !== TICKET_STATES.CERRADO;
    });
    
    if (filterEstado) {
      filtered = filtered.filter(t => t.estado === filterEstado);
    }
    
    if (filterAsignado === 'asignados') {
      filtered = filtered.filter(t => t.asignacion_actual?.analista);
    } else if (filterAsignado === 'no-asignados') {
      filtered = filtered.filter(t => !t.asignacion_actual?.analista);
    }
    
    if (filterPrioridad) {
      filtered = filtered.filter(t => t.prioridad === filterPrioridad);
    }
    
    if (filterAnalista) {
      filtered = filtered.filter(t => 
        t.asignaciones?.some(a => a.analista_id === parseInt(filterAnalista))
      );
    }
    
    return filtered;
  },

  /**
   * Obtener estadísticas (selector)
   */
  getStats: (tickets) => {
    // Validar que tickets sea un array
    if (!Array.isArray(tickets)) {
      return {
        total: 0,
        activos: 0,
        abiertos: 0,
        enProceso: 0,
        escalados: 0,
        solucionados: 0,
        cerrados: 0,
        reabiertos: 0
      };
    }
    const stats = {
      total: tickets.length,
      abiertos: tickets.filter(t => {
        const estado = normalizeFromBackend(t.estado);
        return estado === TICKET_STATES.CREADO || estado === TICKET_STATES.EN_ESPERA;
      }).length,
      enProceso: tickets.filter(t => normalizeFromBackend(t.estado) === TICKET_STATES.EN_PROCESO).length,
      escalados: 0, // Se calcula en el componente usando fueEscaladoPorAnalista()
      solucionados: tickets.filter(t => normalizeFromBackend(t.estado) === TICKET_STATES.SOLUCIONADO).length,
      cerrados: tickets.filter(t => normalizeFromBackend(t.estado) === TICKET_STATES.CERRADO).length,
      reabiertos: tickets.filter(t => normalizeFromBackend(t.estado) === TICKET_STATES.REABIERTO).length
    };

    // Calcular escalados por comentarios, no por estado
    stats.escalados = tickets.filter(t => {
      const estado = normalizeFromBackend(t.estado);
      const estaEnEspera = estado === TICKET_STATES.EN_ESPERA;
      const tieneComentarioEscalamiento = t.comentarios?.some(c => 
        c.id_analista && 
        c.texto && 
        (c.texto.toLowerCase().includes('escal') || c.texto.toLowerCase().includes('supervisor'))
      );
      return estaEnEspera && tieneComentarioEscalamiento && !t.asignacion_actual?.analista;
    }).length;

    return stats;
  },

  /**
   * Obtener color de estado
   */
  getEstadoColor: (estado) => {
    const colors = {
      'activo': 'primary',
      'resuelto': 'success',
      'escalado': 'warning',
      'cerrado': 'secondary',
      'pendiente': 'info'
    };
    return colors[estado] || 'secondary';
  },

  /**
   * Obtener color de prioridad
   */
  getPrioridadColor: (prioridad) => {
    const colors = {
      'alta': 'danger',
      'media': 'warning',
      'baja': 'success'
    };
    return colors[prioridad] || 'secondary';
  }
};

export default supervisorActions;
