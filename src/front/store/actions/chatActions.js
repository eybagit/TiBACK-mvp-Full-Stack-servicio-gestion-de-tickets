/**
 * Chat Actions - Acciones asíncronas para el módulo de Chat
 * Arquitectura tiback-hello: Separación de lógica de negocio
 */

/**
 * Acciones del Chat
 * Funciones que encapsulan lógica de negocio y llamadas API
 */
export const chatActions = {
  /**
   * Cargar mensajes del chat analista-cliente
   */
  loadMensajesAnalistaCliente: async (dispatch, token, ticketId, showLoading = true) => {
    if (showLoading) {
      dispatch({ type: 'CHAT_SET_LOADING', payload: true });
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/chat-analista-cliente`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'CHAT_SET_MENSAJES', payload: data });
        dispatch({ type: 'CHAT_SET_ERROR', payload: null });
      } else {
        throw new Error('Error al cargar mensajes del chat');
      }
    } catch (error) {
      dispatch({ type: 'CHAT_SET_ERROR', payload: error.message });
    } finally {
      if (showLoading) {
        dispatch({ type: 'CHAT_SET_LOADING', payload: false });
      }
    }
  },

  /**
   * Cargar mensajes del chat supervisor-analista
   */
  loadMensajesSupervisorAnalista: async (dispatch, token, ticketId, showLoading = true) => {
    if (showLoading) {
      dispatch({ type: 'CHAT_SET_LOADING', payload: true });
    }
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/chat-supervisor-analista`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'CHAT_SET_MENSAJES', payload: data });
        dispatch({ type: 'CHAT_SET_ERROR', payload: null });
      } else {
        throw new Error('Error al cargar mensajes del chat');
      }
    } catch (error) {
      dispatch({ type: 'CHAT_SET_ERROR', payload: error.message });
    } finally {
      if (showLoading) {
        dispatch({ type: 'CHAT_SET_LOADING', payload: false });
      }
    }
  },

  /**
   * Enviar mensaje al chat analista-cliente
   */
  enviarMensajeAnalistaCliente: async (dispatch, token, ticketId, mensaje) => {
    if (!mensaje.trim()) {
      return { success: false, error: 'El mensaje no puede estar vacío' };
    }

    dispatch({ type: 'CHAT_SET_ENVIANDO', payload: true });
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat-analista-cliente`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id_ticket: parseInt(ticketId),
            mensaje: mensaje.trim()
          })
        }
      );

      if (response.ok) {
        dispatch({ type: 'CHAT_CLEAR_NUEVO_MENSAJE' });
        // Recargar mensajes sin mostrar loading
        await chatActions.loadMensajesAnalistaCliente(dispatch, token, ticketId, false);
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      dispatch({ type: 'CHAT_SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'CHAT_SET_ENVIANDO', payload: false });
    }
  },

  /**
   * Enviar mensaje al chat supervisor-analista
   */
  enviarMensajeSupervisorAnalista: async (dispatch, token, ticketId, mensaje) => {
    if (!mensaje.trim()) {
      return { success: false, error: 'El mensaje no puede estar vacío' };
    }

    dispatch({ type: 'CHAT_SET_ENVIANDO', payload: true });
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/chat-supervisor-analista`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id_ticket: parseInt(ticketId),
            mensaje: mensaje.trim()
          })
        }
      );

      if (response.ok) {
        dispatch({ type: 'CHAT_CLEAR_NUEVO_MENSAJE' });
        // Recargar mensajes sin mostrar loading
        await chatActions.loadMensajesSupervisorAnalista(dispatch, token, ticketId, false);
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
    } catch (error) {
      dispatch({ type: 'CHAT_SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'CHAT_SET_ENVIANDO', payload: false });
    }
  },

  /**
   * Manejar nuevo mensaje (input)
   */
  handleNuevoMensaje: (dispatch, e) => {
    dispatch({ type: 'CHAT_SET_NUEVO_MENSAJE', payload: e.target.value });
  },

  /**
   * Obtener color por rol
   */
  getRoleColor: (rol) => {
    switch (rol) {
      case 'analista': return 'bg-primary';
      case 'cliente': return 'bg-success';
      case 'supervisor': return 'bg-warning';
      default: return 'bg-secondary';
    }
  },

  /**
   * Obtener icono por rol
   */
  getRoleIcon: (rol) => {
    switch (rol) {
      case 'analista': return 'fas fa-user-tie';
      case 'cliente': return 'fas fa-user';
      case 'supervisor': return 'fas fa-user-shield';
      default: return 'fas fa-user';
    }
  },

  /**
   * Verificar si es el usuario actual
   */
  isCurrentUser: (autorRol, token) => {
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      return payload.role === autorRol;
    } catch (error) {
      return false;
    }
  }
};

export default chatActions;
