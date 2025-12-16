/**
 * useHeatmap - Hook para gestión del mapa de calor
 * Usado por HeatmapComponent.jsx
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useGlobalReducer from '../useGlobalReducer';

export function useHeatmap() {
  const { store } = useGlobalReducer();
  
  // Estados
  const [tickets, setTickets] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  
  // Filtros
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  
  // Refs
  const mapRef = useRef(null);
  const heatmapRef = useRef(null);

  // Cargar datos del heatmap
  const cargarDatos = useCallback(async () => {
    if (!store.auth.token) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/dashboard/heatmap`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setClientes(data.clientes || []);
      }
    } catch (err) {
      console.error('Error al cargar datos del heatmap:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [store.auth.token]);

  // Obtener puntos para el heatmap
  const getHeatmapPoints = useCallback(() => {
    return clientes
      .filter(cliente => cliente.latitude && cliente.longitude)
      .map(cliente => {
        const ticketsCliente = tickets.filter(t => t.cliente_id === cliente.id);
        return {
          lat: parseFloat(cliente.latitude),
          lng: parseFloat(cliente.longitude),
          weight: ticketsCliente.length || 1
        };
      });
  }, [tickets, clientes]);

  // Obtener marcadores filtrados
  const getFilteredMarkers = useCallback(() => {
    let filtered = tickets.filter(t => {
      const cliente = clientes.find(c => c.id === t.cliente_id);
      return cliente?.latitude && cliente?.longitude;
    });

    if (filterEstado) {
      filtered = filtered.filter(t => t.estado === filterEstado);
    }
    if (filterPrioridad) {
      filtered = filtered.filter(t => t.prioridad === filterPrioridad);
    }

    return filtered.map(ticket => {
      const cliente = clientes.find(c => c.id === ticket.cliente_id);
      return {
        ...ticket,
        lat: parseFloat(cliente.latitude),
        lng: parseFloat(cliente.longitude),
        clienteNombre: cliente?.nombre || 'Sin nombre'
      };
    });
  }, [tickets, clientes, filterEstado, filterPrioridad]);

  // Estadísticas
  const getStats = useCallback(() => {
    const total = tickets.length;
    const porEstado = tickets.reduce((acc, t) => {
      acc[t.estado] = (acc[t.estado] || 0) + 1;
      return acc;
    }, {});
    const porPrioridad = tickets.reduce((acc, t) => {
      acc[t.prioridad || 'sin_prioridad'] = (acc[t.prioridad || 'sin_prioridad'] || 0) + 1;
      return acc;
    }, {});
    const clientesConTickets = new Set(tickets.map(t => t.cliente_id)).size;
    
    return { total, porEstado, porPrioridad, clientesConTickets };
  }, [tickets]);

  // Color por estado
  const getColorByEstado = (estado) => {
    const colors = {
      'abierto': '#ffc107',
      'en_progreso': '#17a2b8',
      'solucionado': '#28a745',
      'cerrado': '#6c757d',
      'escalado': '#dc3545'
    };
    return colors[estado] || '#6c757d';
  };

  // Color por prioridad
  const getColorByPrioridad = (prioridad) => {
    const colors = {
      'alta': '#dc3545',
      'media': '#ffc107',
      'baja': '#28a745'
    };
    return colors[prioridad] || '#6c757d';
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Actualizar cuando llegan nuevos tickets
  useEffect(() => {
    if (store.websocket.connected) {
      const handleNewTicket = () => cargarDatos();
      
      if (store.websocket.socket) {
        store.websocket.socket.on('nuevo_ticket', handleNewTicket);
        store.websocket.socket.on('ticket_actualizado', handleNewTicket);
        
        return () => {
          store.websocket.socket.off('nuevo_ticket', handleNewTicket);
          store.websocket.socket.off('ticket_actualizado', handleNewTicket);
        };
      }
    }
  }, [store.websocket.connected, cargarDatos]);

  return {
    // Estados
    tickets,
    clientes,
    loading,
    error,
    mapReady,
    setMapReady,
    
    // Filtros
    filterEstado,
    setFilterEstado,
    filterPrioridad,
    setFilterPrioridad,
    showHeatmap,
    setShowHeatmap,
    showMarkers,
    setShowMarkers,
    
    // Refs
    mapRef,
    heatmapRef,
    
    // Funciones
    cargarDatos,
    getHeatmapPoints,
    getFilteredMarkers,
    getStats,
    getColorByEstado,
    getColorByPrioridad
  };
}
