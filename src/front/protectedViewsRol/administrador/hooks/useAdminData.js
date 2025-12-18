/**
 * useAdminData - Hook para gestión de datos del administrador
 * 
 * REFACTORIZADO: Arquitectura tiback-hello
 * - Eliminados todos los useState
 * - Usa store.admin como fuente de verdad
 * - dispatch para modificar estado
 */

import { useEffect } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { adminActions } from '../../../store';

export function useAdminData() {
  const { store, dispatch } = useGlobalReducer();
  
  // ==============================
  // LEER DEL STORE (en lugar de useState)
  // ==============================
  const {
    tickets,
    clientes,
    analistas,
    supervisores,
    loading,
    error,
    userData
  } = store.admin;

  // ==============================
  // FUNCIONES DE DISPATCH (en lugar de setters)
  // ==============================
  const setTickets = (value) => dispatch({ type: 'ADMIN_SET_TICKETS', payload: value });
  const setClientes = (value) => dispatch({ type: 'ADMIN_SET_CLIENTES', payload: value });
  const setAnalistas = (value) => dispatch({ type: 'ADMIN_SET_ANALISTAS', payload: value });
  const setSupervisores = (value) => dispatch({ type: 'ADMIN_SET_SUPERVISORES', payload: value });
  const setError = (value) => dispatch({ type: 'ADMIN_SET_ERROR', payload: value });

  // ==============================
  // FUNCIONES ASYNC (usan adminActions)
  // ==============================

  // Función para actualizar tickets
  const actualizarTickets = async () => {
    await adminActions.loadTickets(dispatch, store.auth.token);
  };

  // Función para actualizar clientes
  const actualizarClientes = async () => {
    await adminActions.loadClientes(dispatch, store.auth.token);
  };

  // Función para actualizar analistas
  const actualizarAnalistas = async () => {
    await adminActions.loadAnalistas(dispatch, store.auth.token);
  };

  // Función para actualizar supervisores
  const actualizarSupervisores = async () => {
    await adminActions.loadSupervisores(dispatch, store.auth.token);
  };

  // Actualizar todos los datos
  const actualizarTodo = async () => {
    await adminActions.loadAllStats(dispatch, store.auth.token);
  };

  // ==============================
  // EFFECTS
  // ==============================

  // Cargar datos iniciales
  useEffect(() => {
    if (store.auth.token) {
      adminActions.loadAllStats(dispatch, store.auth.token);
    }
  }, [store.auth.token, dispatch]);

  // ==============================
  // SELECTORES
  // ==============================

  // Estadísticas globales
  const getStats = () => adminActions.getStats(store.admin);

  // ==============================
  // RETORNO (misma interfaz que antes)
  // ==============================
  return {
    // Estados (del store)
    tickets,
    clientes,
    analistas,
    supervisores,
    loading,
    error,
    userData,
    
    // Setters (dispatch wrappers)
    setTickets,
    setClientes,
    setAnalistas,
    setSupervisores,
    setError,
    
    // Funciones
    actualizarTickets,
    actualizarClientes,
    actualizarAnalistas,
    actualizarSupervisores,
    actualizarTodo,
    getStats,
    
    // Store y dispatch
    store,
    dispatch
  };
}

export default useAdminData;
