/**
 * Cliente Actions - Acciones centralizadas para ClientePage
 * Arquitectura tiback-hello: crudActions centralizadas
 * PROHIBIDO llamar fetch directamente en componentes
 */

import { TICKET_STATES } from '../../constants/ticketEnums';
import { normalizeFromBackend } from '../../utils/normalize';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Helper para obtener headers con token
 */
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

/**
 * Acciones CRUD para Cliente
 */
export const clienteActions = {
  // === TICKETS ===
  
  /**
   * Cargar tickets del cliente
   */
  getTickets: async (dispatch, token) => {
    dispatch({ type: 'CLIENTE_SET_LOADING', payload: true });
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/tickets/cliente?t=${Date.now()}`,
        { headers: getAuthHeaders(token) }
      );
      
      if (!response.ok) throw new Error('Error al cargar tickets');
      
      const tickets = await response.json();
      dispatch({ type: 'CLIENTE_SET_TICKETS', payload: tickets });
      console.log(`📋 Cliente - Tickets cargados: ${tickets.length}`);
      return tickets;
    } catch (error) {
      dispatch({ type: 'CLIENTE_SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'CLIENTE_SET_LOADING', payload: false });
    }
  },
  
  /**
   * Crear nuevo ticket
   */
  createTicket: async (dispatch, token, ticketData) => {
    dispatch({ type: 'CLIENTE_SET_UPLOADING', payload: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) throw new Error('Error al crear ticket');
      
      const newTicket = await response.json();
      dispatch({ type: 'CLIENTE_ADD_TICKET', payload: newTicket });
      dispatch({ type: 'CLIENTE_SET_SHOW_TICKET_FORM', payload: false });
      dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: '' });
      
      return newTicket;
    } catch (error) {
      dispatch({ type: 'CLIENTE_SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'CLIENTE_SET_UPLOADING', payload: false });
    }
  },
  
  /**
   * Cerrar ticket con calificación
   */
  cerrarTicket: async (dispatch, token, ticketId, calificacion) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/tickets/${ticketId}/estado`,
        {
          method: 'PUT',
          headers: getAuthHeaders(token),
          body: JSON.stringify({ estado: 'cerrado', calificacion })
        }
      );
      
      if (!response.ok) throw new Error('Error al cerrar ticket');
      
      // Actualizar tickets
      await clienteActions.getTickets(dispatch, token);
      return true;
    } catch (error) {
      dispatch({ type: 'CLIENTE_SET_ERROR', payload: error.message });
      throw error;
    }
  },
  
  /**
   * Solicitar reapertura de ticket
   */
  solicitarReapertura: async (dispatch, token, ticketId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/tickets/${ticketId}/estado`,
        {
          method: 'PUT',
          headers: getAuthHeaders(token),
          body: JSON.stringify({ estado: 'solicitud_reapertura' })
        }
      );
      
      if (response.ok) {
        dispatch({ type: 'CLIENTE_ADD_SOLICITUD_REAPERTURA', payload: ticketId });
        await clienteActions.getTickets(dispatch, token);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al solicitar reapertura');
      }
    } catch (error) {
      dispatch({ type: 'CLIENTE_SET_ERROR', payload: error.message });
      throw error;
    }
  },
  
  /**
   * Evaluar ticket
   */
  evaluarTicket: async (dispatch, token, ticketId, calificacion) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/tickets/${ticketId}/evaluar`,
        {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({ calificacion })
        }
      );
      
      if (!response.ok) throw new Error('Error al evaluar ticket');
      
      await clienteActions.getTickets(dispatch, token);
      return true;
    } catch (error) {
      dispatch({ type: 'CLIENTE_SET_ERROR', payload: error.message });
      throw error;
    }
  },
  
  // === DATOS DE USUARIO ===
  
  /**
   * Cargar datos del usuario
   */
  getUserData: async (dispatch, token, userId) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/clientes/${userId}`,
        { headers: getAuthHeaders(token) }
      );
      
      if (!response.ok) throw new Error('Error al cargar datos del usuario');
      
      const userData = await response.json();
      dispatch({ type: 'CLIENTE_SET_USER_DATA', payload: userData });
      
      // Actualizar formulario de info
      dispatch({
        type: 'CLIENTE_SET_INFO_DATA',
        payload: {
          nombre: userData.nombre === 'Pendiente' ? '' : userData.nombre || '',
          apellido: userData.apellido === 'Pendiente' ? '' : userData.apellido || '',
          email: userData.email || '',
          telefono: userData.telefono === '0000000000' ? '' : userData.telefono || '',
          direccion: userData.direccion === 'Pendiente' ? '' : userData.direccion || '',
          lat: userData.latitude || null,
          lng: userData.longitude || null,
          password: '',
          confirmPassword: ''
        }
      });
      
      dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: userData.url_imagen || '' });
      
      return userData;
    } catch (error) {
      dispatch({ type: 'CLIENTE_SET_ERROR', payload: error.message });
      throw error;
    }
  },
  
  /**
   * Actualizar información del cliente
   */
  updateInfo: async (dispatch, token, userId, updateData, clienteImageUrl) => {
    dispatch({ type: 'CLIENTE_SET_UPDATING_INFO', payload: true });
    try {
      // Validar contraseñas
      if (updateData.password && updateData.password !== updateData.confirmPassword) {
        dispatch({ type: 'CLIENTE_SET_ERROR', payload: 'Las contraseñas no coinciden' });
        return false;
      }
      
      const dataToSend = {
        nombre: updateData.nombre,
        apellido: updateData.apellido,
        email: updateData.email,
        telefono: updateData.telefono,
        direccion: updateData.direccion,
        latitude: updateData.lat,
        longitude: updateData.lng,
        url_imagen: clienteImageUrl || updateData.url_imagen
      };
      
      if (updateData.password) {
        dataToSend.password = updateData.password;
      }
      
      const response = await fetch(
        `${BACKEND_URL}/api/clientes/${userId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(token),
          body: JSON.stringify(dataToSend)
        }
      );
      
      if (!response.ok) throw new Error('Error al actualizar información');
      
      const updatedUser = await response.json();
      dispatch({ type: 'CLIENTE_SET_USER_DATA', payload: updatedUser });
      dispatch({ type: 'CLIENTE_SET_SHOW_INFO_FORM', payload: false });
      dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: '' });
      dispatch({ type: 'CLIENTE_SET_ERROR', payload: '' });
      dispatch({ type: 'CLIENTE_RESET_PASSWORD_FIELDS' });
      
      return updatedUser;
    } catch (error) {
      dispatch({ type: 'CLIENTE_SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'CLIENTE_SET_UPDATING_INFO', payload: false });
    }
  },
  
  // === RECOMENDACIONES ===
  
  /**
   * Verificar recomendaciones para todos los tickets
   */
  verificarRecomendaciones: async (dispatch, token, tickets) => {
    if (!tickets || tickets.length === 0 || !token) return;
    
    try {
      const resultados = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            if (!ticket.titulo || !ticket.descripcion) {
              return { ticketId: ticket.id, tieneRecomendaciones: false };
            }
            
            const response = await fetch(
              `${BACKEND_URL}/api/tickets/${ticket.id}/recomendaciones-similares`,
              {
                headers: getAuthHeaders(token),
                signal: AbortSignal.timeout(15000)
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              return { ticketId: ticket.id, tieneRecomendaciones: data.total_encontrados > 0 };
            }
            return { ticketId: ticket.id, tieneRecomendaciones: false };
          } catch {
            return { ticketId: ticket.id, tieneRecomendaciones: false };
          }
        })
      );
      
      const ticketsConRecomendaciones = resultados
        .filter(r => r.tieneRecomendaciones)
        .map(r => r.ticketId);
      
      dispatch({ type: 'CLIENTE_SET_TICKETS_CON_RECOMENDACIONES', payload: ticketsConRecomendaciones });
    } catch (error) {
      console.error('Error verificando recomendaciones:', error);
      dispatch({ type: 'CLIENTE_SET_TICKETS_CON_RECOMENDACIONES', payload: [] });
    }
  },
  
  // === UI ACTIONS ===
  
  /**
   * Cambiar vista activa
   */
  changeView: (dispatch, view) => {
    dispatch({ type: 'CLIENTE_SET_ACTIVE_VIEW', payload: view });
  },
  
  /**
   * Alternar sidebar
   */
  toggleSidebar: (dispatch) => {
    dispatch({ type: 'CLIENTE_TOGGLE_SIDEBAR' });
  },
  
  /**
   * Alternar formulario de ticket
   */
  toggleTicketForm: (dispatch) => {
    dispatch({ type: 'CLIENTE_TOGGLE_TICKET_FORM' });
  },
  
  /**
   * Alternar formulario de info
   */
  toggleInfoForm: (dispatch) => {
    dispatch({ type: 'CLIENTE_TOGGLE_INFO_FORM' });
  },
  
  /**
   * Buscar tickets
   */
  handleSearch: (dispatch, query, tickets) => {
    dispatch({ type: 'CLIENTE_SET_SEARCH_QUERY', payload: query });
    
    if (query.trim().length === 0) {
      dispatch({ type: 'CLIENTE_CLOSE_SEARCH_RESULTS' });
      return;
    }
    
    const filteredTickets = tickets.filter(ticket =>
      ticket.titulo.toLowerCase().includes(query.toLowerCase().trim())
    );
    
    dispatch({ type: 'CLIENTE_SET_SEARCH_RESULTS', payload: filteredTickets.slice(0, 5) });
  },
  
  /**
   * Seleccionar ticket desde búsqueda
   */
  selectTicketFromSearch: (dispatch, ticketId) => {
    dispatch({ type: 'CLIENTE_SELECT_TICKET_FROM_SEARCH', payload: ticketId });
  },
  
  /**
   * Limpiar filtros
   */
  clearFilters: (dispatch) => {
    dispatch({ type: 'CLIENTE_CLEAR_FILTERS' });
  },
  
  /**
   * Alternar tema
   */
  toggleTheme: (dispatch) => {
    dispatch({ type: 'CLIENTE_TOGGLE_THEME' });
    document.body.classList.toggle('dark-theme');
  },
  
  /**
   * Manejar cambio de imagen de ticket
   */
  handleImageUpload: (dispatch, imageUrl) => {
    dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: imageUrl });
  },
  
  /**
   * Remover imagen de ticket
   */
  handleImageRemove: (dispatch) => {
    dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: '' });
  },
  
  /**
   * Manejar cambio de imagen de cliente
   */
  handleClienteImageUpload: (dispatch, imageUrl) => {
    dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: imageUrl });
  },
  
  /**
   * Remover imagen de cliente
   */
  handleClienteImageRemove: (dispatch) => {
    dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: '' });
  },
  
  /**
   * Manejar cambio de campo en formulario de info
   */
  handleInfoChange: (dispatch, e) => {
    const { name, value } = e.target;
    dispatch({ type: 'CLIENTE_UPDATE_INFO_FIELD', payload: { name, value } });
  },
  
  /**
   * Manejar cambio de ubicación
   */
  handleLocationChange: (dispatch, location) => {
    dispatch({ type: 'CLIENTE_SET_LOCATION', payload: location });
  },
  
  // === LIMPIEZA DE SOLICITUDES ===
  
  /**
   * Limpiar solicitudes de reapertura para tickets fuera de estado solucionado
   */
  limpiarSolicitudesReapertura: (dispatch, tickets, solicitudesActuales) => {
    const ticketsSolucionados = new Set(
      tickets.filter(t => normalizeFromBackend(t.estado) === TICKET_STATES.SOLUCIONADO).map(t => t.id)
    );
    
    solicitudesActuales.forEach(ticketId => {
      if (!ticketsSolucionados.has(ticketId)) {
        dispatch({ type: 'CLIENTE_REMOVE_SOLICITUD_REAPERTURA', payload: ticketId });
      }
    });
  },
};
