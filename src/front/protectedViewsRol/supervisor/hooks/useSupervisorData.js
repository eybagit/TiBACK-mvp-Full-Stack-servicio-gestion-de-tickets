/**
 * useSupervisorData - Hook para gestión de datos del supervisor
 * Extrae la lógica de carga de datos, tickets y analistas
 */

import { useState, useEffect } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

export function useSupervisorData() {
  const { store, dispatch } = useGlobalReducer();
  
  // Estados principales
  const [tickets, setTickets] = useState([]);
  const [ticketsCerrados, setTicketsCerrados] = useState([]);
  const [analistas, setAnalistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  
  // Estados para solicitudes de reapertura
  const [solicitudesReapertura, setSolicitudesReapertura] = useState(new Set());

  // Helper para requests resilientes
  const backendRequest = async (path, options = {}) => {
    const backends = [
      import.meta.env.VITE_BACKEND_URL,
      window.location.origin,
      ''
    ].filter(Boolean);
    
    for (const base of backends) {
      try {
        const url = `${base}${path}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        if (response.ok) return response;
      } catch (err) {
        continue;
      }
    }
    throw new Error('All backends failed');
  };

  // Función para actualizar tickets
  const actualizarTickets = async () => {
    try {
      const response = await backendRequest(`/api/tickets/supervisor?t=${Date.now()}`);
      if (response.ok) {
        const ticketsData = await response.json();
        setTickets(ticketsData);
        console.log(`📋 Supervisor - Tickets actualizados: ${ticketsData.length}`);
      }
    } catch (err) {
      console.error('Error al actualizar tickets:', err);
    }
  };

  // Función para cargar tickets cerrados
  const cargarTicketsCerrados = async () => {
    try {
      const response = await backendRequest('/api/tickets/cerrados');
      if (response.ok) {
        const data = await response.json();
        setTicketsCerrados(data);
        console.log(`📋 Tickets cerrados: ${data.length}`);
      }
    } catch (err) {
      console.error('Error al cargar tickets cerrados:', err);
    }
  };

  // Función para actualizar analistas
  const actualizarAnalistas = async () => {
    try {
      const response = await backendRequest('/api/analistas');
      if (response.ok) {
        const data = await response.json();
        setAnalistas(data);
        console.log(`👥 Analistas actualizados: ${data.length}`);
      }
    } catch (err) {
      console.error('Error al actualizar analistas:', err);
    }
  };

  // Función para actualizar todas las tablas
  const actualizarTodasLasTablas = async () => {
    await Promise.all([
      actualizarTickets(),
      cargarTicketsCerrados(),
      actualizarAnalistas()
    ]);
  };

  // Mover ticket a cerrados
  const moveTicketToClosed = (ticketId) => {
    setTickets(prev => {
      const ticket = prev.find(t => t.id === ticketId);
      if (ticket) {
        setTicketsCerrados(closed => [...closed, { ...ticket, estado: 'cerrado' }]);
      }
      return prev.filter(t => t.id !== ticketId);
    });
  };

  // Mover ticket a activos
  const moveTicketToActive = (ticketId) => {
    setTicketsCerrados(prev => {
      const ticket = prev.find(t => t.id === ticketId);
      if (ticket) {
        setTickets(active => [...active, { ...ticket, estado: 'abierto' }]);
      }
      return prev.filter(t => t.id !== ticketId);
    });
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const userId = tokenUtils.getUserId(store.auth.token);
        
        // Cargar datos del supervisor
        const userResponse = await backendRequest(`/api/supervisores/${userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserData(userData);
          dispatch({ type: 'SET_USER', payload: userData });
        }

        // Cargar tickets y analistas
        await actualizarTodasLasTablas();
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
    const abiertos = tickets.filter(t => t.estado === 'abierto').length;
    const enProgreso = tickets.filter(t => t.estado === 'en_progreso').length;
    const escalados = tickets.filter(t => t.estado === 'escalado').length;
    const solucionados = tickets.filter(t => t.estado === 'solucionado').length;
    
    return { abiertos, enProgreso, escalados, solucionados, total: tickets.length };
  };

  return {
    // Estados
    tickets,
    setTickets,
    ticketsCerrados,
    setTicketsCerrados,
    analistas,
    setAnalistas,
    loading,
    error,
    setError,
    userData,
    setUserData,
    solicitudesReapertura,
    setSolicitudesReapertura,
    
    // Funciones
    backendRequest,
    actualizarTickets,
    cargarTicketsCerrados,
    actualizarAnalistas,
    actualizarTodasLasTablas,
    moveTicketToClosed,
    moveTicketToActive,
    getStats,
    
    // Store
    store,
    dispatch
  };
}
