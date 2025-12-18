/**
 * useComentarios - Hook compartido para gestión de comentarios
 * Usado por ComentariosTicket.jsx y ComentariosTicketEmbedded.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import useGlobalReducer from '../useGlobalReducer';

export function useComentarios(ticketId) {
  const { store, dispatch, joinTicketRoom, leaveTicketRoom } = useGlobalReducer();
  
  // Estados
  const [comentarios, setComentarios] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Token utils
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  };

  const getUserId = (token) => {
    const payload = decodeToken(token);
    return payload?.sub || null;
  };

  const getRole = (token) => {
    const payload = decodeToken(token);
    return payload?.role || null;
  };

  // Cargar datos del ticket y comentarios
  const cargarDatos = useCallback(async (showLoading = true) => {
    if (!ticketId || !store.auth.token) return;
    
    try {
      if (showLoading) setLoading(true);
      
      // Cargar ticket
      const ticketResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        setTicket(ticketData);
      }
      
      // Cargar comentarios
      const comentariosResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/comentarios`,
        {
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (comentariosResponse.ok) {
        const comentariosData = await comentariosResponse.json();
        // Ordenar por fecha (más reciente primero)
        const sorted = comentariosData.sort((a, b) => 
          new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
        );
        setComentarios(sorted);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticketId, store.auth.token]);

  // Agregar comentario
  const agregarComentario = async (contenido = null) => {
    const texto = contenido || nuevoComentario.trim();
    if (!texto || !ticketId) return { success: false };
    
    try {
      setEnviando(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/comentarios`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ticket_id: ticketId,
            contenido: texto
          })
        }
      );
      
      if (!response.ok) throw new Error('Error al agregar comentario');
      
      const nuevoComentarioData = await response.json();
      
      // Agregar a la lista local inmediatamente
      setComentarios(prev => [nuevoComentarioData, ...prev]);
      setNuevoComentario('');
      
      return { success: true, comentario: nuevoComentarioData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setEnviando(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Configurar WebSocket listeners
  useEffect(() => {
    if (store.websocket.socket && ticketId) {
      joinTicketRoom(store.websocket.socket, ticketId);
      
      const handleNuevoComentario = (data) => {
        if (data.ticket_id === parseInt(ticketId)) {
          cargarDatos(false);
        }
      };

      store.websocket.socket.on('nuevo_comentario', handleNuevoComentario);
      
      return () => {
        store.websocket.socket.off('nuevo_comentario', handleNuevoComentario);
        leaveTicketRoom(store.websocket.socket, ticketId);
      };
    }
  }, [store.websocket.socket, ticketId]);

  // Stats
  const stats = {
    total: comentarios.length,
    porRol: comentarios.reduce((acc, c) => {
      const rol = c.usuario_rol || 'desconocido';
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {})
  };

  return {
    // Estados
    comentarios,
    ticket,
    loading,
    error,
    nuevoComentario,
    setNuevoComentario,
    enviando,
    stats,
    
    // Funciones
    cargarDatos,
    agregarComentario,
    getUserId,
    getRole,
    
    // Store
    store
  };
}
