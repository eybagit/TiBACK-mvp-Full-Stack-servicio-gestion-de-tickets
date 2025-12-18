/**
 * IA Actions - Acciones asíncronas para el módulo de IA
 * Arquitectura tiback-hello: Separación de lógica de negocio
 */

import { tokenUtils } from '../utils/tokenUtils.js';

/**
 * Acciones de IA
 * Funciones que encapsulan lógica de negocio y llamadas API
 */
export const iaActions = {
  /**
   * Cargar información del ticket
   */
  loadTicket: async (dispatch, token, ticketId) => {
    dispatch({ type: 'IA_SET_LOADING', payload: true });
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const ticketData = await response.json();
        dispatch({ type: 'IA_SET_TICKET', payload: ticketData });
        dispatch({ type: 'IA_SET_TICKET_ID', payload: ticketId });
      } else {
        dispatch({ type: 'IA_SET_ERROR', payload: 'Error al cargar el ticket' });
      }
    } catch (error) {
      dispatch({ type: 'IA_SET_ERROR', payload: 'Error de conexión' });
    } finally {
      dispatch({ type: 'IA_SET_LOADING', payload: false });
    }
  },

  /**
   * Manejar cambio de imagen
   */
  handleImageChange: (dispatch, file) => {
    if (file) {
      dispatch({ type: 'IA_SET_IMAGE', payload: file });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({ type: 'IA_SET_IMAGE_PREVIEW', payload: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  },

  /**
   * Analizar imagen
   */
  analyzeImage: async (dispatch, token, ticketId, image, additionalDetails, ticket) => {
    if (!image) {
      dispatch({ type: 'IA_SET_ERROR', payload: 'Por favor selecciona una imagen' });
      return { success: false };
    }

    if (!additionalDetails.trim()) {
      dispatch({ type: 'IA_SET_ERROR', payload: 'Por favor proporciona detalles adicionales' });
      return { success: false };
    }

    dispatch({ type: 'IA_SET_ANALYZING', payload: true });
    dispatch({ type: 'IA_SET_ERROR', payload: null });

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('ticket_id', ticketId);
      formData.append('use_ticket_context', true);
      
      if (ticket) {
        formData.append('ticket_title', ticket.titulo);
        formData.append('ticket_description', ticket.descripcion);
      }
      
      formData.append('additional_details', additionalDetails);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/analyze-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const result = await response.json();

      if (response.ok) {
        dispatch({ type: 'IA_SET_ANALYSIS_RESULT', payload: result });
        return { success: true, result };
      } else {
        dispatch({ type: 'IA_SET_ERROR', payload: result.message || 'Error al analizar la imagen' });
        return { success: false };
      }
    } catch (error) {
      dispatch({ type: 'IA_SET_ERROR', payload: 'Error de conexión' });
      return { success: false };
    } finally {
      dispatch({ type: 'IA_SET_ANALYZING', payload: false });
    }
  },

  /**
   * Guardar análisis en el ticket
   */
  saveAnalysisToTicket: async (dispatch, token, ticketId, analysisResult) => {
    if (!analysisResult) return { success: false };

    dispatch({ type: 'IA_SET_SAVING', payload: true });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/comentarios`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id_ticket: parseInt(ticketId),
            texto: `🤖 ANÁLISIS DE IMAGEN CON IA:\n\n${analysisResult.analysis}`
          })
        }
      );

      if (response.ok) {
        return { success: true };
      } else {
        dispatch({ type: 'IA_SET_ERROR', payload: 'Error al guardar el análisis' });
        return { success: false };
      }
    } catch (error) {
      dispatch({ type: 'IA_SET_ERROR', payload: 'Error al guardar el análisis' });
      return { success: false };
    } finally {
      dispatch({ type: 'IA_SET_SAVING', payload: false });
    }
  },

  /**
   * Buscar tickets similares
   */
  searchSimilarTickets: async (dispatch, token, ticketId) => {
    dispatch({ type: 'IA_SET_LOADING', payload: true });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/similares`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'IA_SET_TICKETS_SIMILARES', payload: data });
        return { success: true, data };
      } else {
        dispatch({ type: 'IA_SET_ERROR', payload: 'Error al buscar tickets similares' });
        return { success: false };
      }
    } catch (error) {
      dispatch({ type: 'IA_SET_ERROR', payload: 'Error de conexión' });
      return { success: false };
    } finally {
      dispatch({ type: 'IA_SET_LOADING', payload: false });
    }
  },

  /**
   * Cargar recomendaciones guardadas
   */
  loadRecomendacionesGuardadas: async (dispatch, token, ticketId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/recomendaciones`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'IA_SET_RECOMENDACIONES_GUARDADAS', payload: data });
      }
    } catch (error) {
      console.error('Error cargando recomendaciones:', error);
    }
  }
};

export default iaActions;
