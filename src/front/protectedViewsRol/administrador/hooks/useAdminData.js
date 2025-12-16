/**
 * useAdminData - Hook para gestión de datos del administrador
 */

import { useState, useEffect } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

export function useAdminData() {
  const { store, dispatch } = useGlobalReducer();
  
  // Estados principales
  const [tickets, setTickets] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [analistas, setAnalistas] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);

  // Función para actualizar tickets
  const actualizarTickets = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Error al actualizar tickets:', err);
    }
  };

  // Función para actualizar clientes
  const actualizarClientes = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/clientes`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (err) {
      console.error('Error al actualizar clientes:', err);
    }
  };

  // Función para actualizar analistas
  const actualizarAnalistas = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/analistas`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAnalistas(data);
      }
    } catch (err) {
      console.error('Error al actualizar analistas:', err);
    }
  };

  // Función para actualizar supervisores
  const actualizarSupervisores = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supervisores`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSupervisores(data);
      }
    } catch (err) {
      console.error('Error al actualizar supervisores:', err);
    }
  };

  // Actualizar todos los datos
  const actualizarTodo = async () => {
    await Promise.all([
      actualizarTickets(),
      actualizarClientes(),
      actualizarAnalistas(),
      actualizarSupervisores()
    ]);
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const userId = tokenUtils.getUserId(store.auth.token);
        
        // Cargar datos del admin
        const userResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/administradores/${userId}`,
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

  // Estadísticas globales
  const getStats = () => {
    return {
      totalTickets: tickets.length,
      totalClientes: clientes.length,
      totalAnalistas: analistas.length,
      totalSupervisores: supervisores.length,
      ticketsAbiertos: tickets.filter(t => t.estado === 'abierto').length,
      ticketsEnProgreso: tickets.filter(t => t.estado === 'en_progreso').length,
      ticketsSolucionados: tickets.filter(t => t.estado === 'solucionado').length,
      ticketsCerrados: tickets.filter(t => t.estado === 'cerrado').length
    };
  };

  return {
    // Estados
    tickets,
    setTickets,
    clientes,
    setClientes,
    analistas,
    setAnalistas,
    supervisores,
    setSupervisores,
    loading,
    error,
    setError,
    userData,
    
    // Funciones
    actualizarTickets,
    actualizarClientes,
    actualizarAnalistas,
    actualizarSupervisores,
    actualizarTodo,
    getStats,
    
    // Store
    store,
    dispatch
  };
}
