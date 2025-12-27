/**
 * Admin Actions - Acciones asíncronas para el módulo Administrador
 * Arquitectura tiback-hello: Separación de lógica de negocio
 */

import { tokenUtils } from '../utils/tokenUtils.js';

/**
 * Acciones del Administrador
 * Funciones que encapsulan lógica de negocio y llamadas API
 */
export const adminActions = {
  /**
   * Cargar todos los tickets
   */
  loadTickets: async (dispatch, token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const tickets = await response.json();
        dispatch({ type: 'ADMIN_SET_TICKETS', payload: tickets });
        
        // Calcular estadísticas
        const ticketsCreados = tickets.filter(t => t.estado?.toLowerCase() === 'creado').length;
        const ticketsEnProceso = tickets.filter(t => t.estado?.toLowerCase() === 'en_proceso').length;
        const ticketsSolucionados = tickets.filter(t => t.estado?.toLowerCase() === 'solucionado').length;
        const ticketsCerrados = tickets.filter(t => t.estado?.toLowerCase() === 'cerrado').length;
        
        dispatch({
          type: 'ADMIN_UPDATE_STATS',
          payload: {
            totalTickets: tickets.length,
            ticketsCreados,
            ticketsEnProceso,
            ticketsSolucionados,
            ticketsCerrados
          }
        });
      }
    } catch (error) {
      console.error('Error cargando tickets:', error);
    }
  },

  /**
   * Cargar todos los clientes
   */
  loadClientes: async (dispatch, token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const clientes = await response.json();
        dispatch({ type: 'ADMIN_SET_CLIENTES', payload: clientes });
        dispatch({
          type: 'ADMIN_UPDATE_STATS',
          payload: { totalClientes: clientes.length }
        });
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  },

  /**
   * Cargar todos los analistas
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
        const analistas = await response.json();
        dispatch({ type: 'ADMIN_SET_ANALISTAS', payload: analistas });
        dispatch({
          type: 'ADMIN_UPDATE_STATS',
          payload: { totalAnalistas: analistas.length }
        });
      }
    } catch (error) {
      console.error('Error cargando analistas:', error);
    }
  },

  /**
   * Cargar todos los supervisores
   */
  loadSupervisores: async (dispatch, token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const supervisores = await response.json();
        dispatch({ type: 'ADMIN_SET_SUPERVISORES', payload: supervisores });
        dispatch({
          type: 'ADMIN_UPDATE_STATS',
          payload: { totalSupervisores: supervisores.length }
        });
      }
    } catch (error) {
      console.error('Error cargando supervisores:', error);
    }
  },

  /**
   * Cargar datos del usuario administrador
   */
  loadUserData: async (dispatch, token) => {
    try {
      const userId = tokenUtils.getUserId(token);
      if (!userId) return;

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/administradores/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'ADMIN_SET_USER_DATA', payload: data });
        dispatch({ type: 'SET_USER', payload: data });
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  },

  /**
   * Cargar todas las estadísticas
   */
  loadAllStats: async (dispatch, token) => {
    dispatch({ type: 'ADMIN_SET_LOADING', payload: true });
    
    try {
      await Promise.all([
        adminActions.loadTickets(dispatch, token),
        adminActions.loadClientes(dispatch, token),
        adminActions.loadAnalistas(dispatch, token),
        adminActions.loadSupervisores(dispatch, token),
        adminActions.loadUserData(dispatch, token)
      ]);
    } catch (error) {
      dispatch({ type: 'ADMIN_SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'ADMIN_SET_LOADING', payload: false });
    }
  },

  /**
   * Obtener estadísticas calculadas
   */
  getStats: (adminState) => adminState.stats
};

export default adminActions;
