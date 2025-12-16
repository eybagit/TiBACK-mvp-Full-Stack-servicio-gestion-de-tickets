/**
 * useAnalistaData - Hook para gestión de datos del analista
 */

import { useState, useEffect } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

export function useAnalistaData() {
  const { store, dispatch } = useGlobalReducer();
  
  // Estados principales
  const [ticketsAsignados, setTicketsAsignados] = useState([]);
  const [ticketsDisponibles, setTicketsDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);

  // Función para actualizar tickets asignados
  const actualizarTicketsAsignados = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista?t=${Date.now()}`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTicketsAsignados(data);
        console.log(`📋 Analista - Tickets asignados: ${data.length}`);
      }
    } catch (err) {
      console.error('Error al actualizar tickets:', err);
    }
  };

  // Función para actualizar tickets disponibles
  const actualizarTicketsDisponibles = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets?estado=abierto&sin_asignar=true`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTicketsDisponibles(data);
      }
    } catch (err) {
      console.error('Error al actualizar tickets disponibles:', err);
    }
  };

  // Actualizar todos los datos
  const actualizarTodo = async () => {
    await Promise.all([
      actualizarTicketsAsignados(),
      actualizarTicketsDisponibles()
    ]);
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const userId = tokenUtils.getUserId(store.auth.token);
        
        // Cargar datos del analista
        const userResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${store.auth.token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserData(userData);
          dispatch({ type: 'SET_USER', payload: userData });
        }

        await actualizarTodo();
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (store.auth.token) {
      cargarDatos();
    }
  }, [store.auth.token]);

  // Estadísticas
  const getStats = () => {
    const total = ticketsAsignados.length;
    const enProgreso = ticketsAsignados.filter(t => t.estado === 'en_progreso').length;
    const pendientes = ticketsAsignados.filter(t => t.estado === 'abierto').length;
    const solucionados = ticketsAsignados.filter(t => t.estado === 'solucionado').length;
    
    return { total, enProgreso, pendientes, solucionados };
  };

  return {
    // Estados
    ticketsAsignados,
    setTicketsAsignados,
    ticketsDisponibles,
    setTicketsDisponibles,
    loading,
    error,
    setError,
    userData,
    setUserData,
    
    // Funciones
    actualizarTicketsAsignados,
    actualizarTicketsDisponibles,
    actualizarTodo,
    getStats,
    
    // Store
    store,
    dispatch
  };
}
