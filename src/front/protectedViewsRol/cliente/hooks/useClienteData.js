/**
 * useClienteData - Hook para gestión de datos del cliente
 * Refactorizado para usar el store global (clienteSlice)
 * NO useState - arquitectura tiback-hello
 */

import { useState, useEffect, useMemo } from 'react';
import { TICKET_STATES } from '../../../constants/ticketEnums';
import { normalizeFromBackend } from '../../../utils/normalize';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

export function useClienteData() {
  const { store, dispatch } = useGlobalReducer();
  
  // Acceso al estado del cliente desde el store global
  const clientePage = store.clientePage || {};
  
  // Estados del store
  const tickets = clientePage.tickets || [];
  const loading = clientePage.loading ?? true;
  const error = clientePage.error || '';
  const userData = clientePage.userData || null;
  const solicitudesReapertura = clientePage.solicitudesReapertura || [];
  const ticketsConRecomendaciones = clientePage.ticketsConRecomendaciones || [];
  const infoData = clientePage.infoData || {};
  const ticketImageUrl = clientePage.ticketImageUrl || '';
  const clienteImageUrl = clientePage.clienteImageUrl || '';
  const newTicketImages = clientePage.newTicketImages || [];
  const uploading = clientePage.uploading || false;

  // Helper para establecer loading
  const setLoading = (v) => dispatch({ type: 'CLIENTE_SET_LOADING', payload: v });
  
  // Helper para establecer error
  const setError = (msg) => {
    dispatch({ type: 'CLIENTE_SET_ERROR', payload: msg });
    if (msg) setTimeout(() => dispatch({ type: 'CLIENTE_SET_ERROR', payload: '' }), 2000);
  };

  // Función helper para actualizar tickets sin recargar la página
  const actualizarTickets = async () => {
    try {
      const token = store.auth.token;
      const ticketsResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente?t=${Date.now()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        dispatch({ type: 'CLIENTE_SET_TICKETS', payload: ticketsData });
        console.log(`📋 Cliente - Tickets cargados: ${ticketsData.length} tickets`);

        // Limpiar solicitudes de reapertura para tickets que ya NO están en estado 'solucionado'
        ticketsData.forEach(ticket => {
          if (normalizeFromBackend(ticket.estado) !== TICKET_STATES.SOLUCIONADO && solicitudesReapertura.includes(ticket.id)) {
            dispatch({ type: 'CLIENTE_REMOVE_SOLICITUD_REAPERTURA', payload: ticket.id });
          }
        });
      }
    } catch (err) {
      setError("Error al actualizar la lista");
      console.error('Error al actualizar tickets:', err);
    }
  };

  // Cargar datos del usuario y tickets
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const token = store.auth.token;
        const userId = tokenUtils.getUserId(token);

        // Cargar datos del usuario
        const userResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (userResponse.ok) {
          const userDataRes = await userResponse.json();
          dispatch({ type: 'CLIENTE_SET_USER_DATA', payload: userDataRes });

          dispatch({
            type: 'SET_USER',
            payload: userDataRes
          });

          dispatch({
            type: 'CLIENTE_SET_INFO_DATA',
            payload: {
              nombre: userDataRes.nombre === 'Pendiente' ? '' : userDataRes.nombre || '',
              apellido: userDataRes.apellido === 'Pendiente' ? '' : userDataRes.apellido || '',
              email: userDataRes.email || '',
              telefono: userDataRes.telefono === '0000000000' ? '' : userDataRes.telefono || '',
              direccion: userDataRes.direccion === 'Pendiente' ? '' : userDataRes.direccion || '',
              lat: userDataRes.latitude || null,
              lng: userDataRes.longitude || null,
              password: '',
              confirmPassword: ''
            }
          });
          dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: userDataRes.url_imagen || '' });
        }

        // Cargar tickets del cliente
        const ticketsResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!ticketsResponse.ok) {
          throw new Error('Error al cargar tickets');
        }

        const ticketsData = await ticketsResponse.json();
        dispatch({ type: 'CLIENTE_SET_TICKETS', payload: ticketsData });
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

  // Funciones de imagen
  const handleImageUpload = (imageUrl) => dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: imageUrl });
  const handleImageRemove = () => dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: '' });
  
  const handleClienteImageUpload = (imageUrl) => {
    dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: imageUrl });
  };
  
  const handleClienteImageRemove = () => {
    dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: '' });
  };

  // Función para manejar cambios en el formulario de información
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    dispatch({ type: 'CLIENTE_UPDATE_INFO_FIELD', payload: { name, value } });
  };

  // Función para manejar cambios de ubicación
  const handleLocationChange = (location) => {
    dispatch({ type: 'CLIENTE_SET_LOCATION', payload: location });
  };

  // Setters para compatibilidad con código existente
  const setTickets = (tickets) => dispatch({ type: 'CLIENTE_SET_TICKETS', payload: tickets });
  const setUserData = (data) => dispatch({ type: 'CLIENTE_SET_USER_DATA', payload: data });
  const setSolicitudesReapertura = (fn) => {
    // Compatibilidad con callback de Set
    const newSet = typeof fn === 'function' ? fn(new Set(solicitudesReapertura)) : new Set(fn);
    // No hay operación directa, manejamos con add/remove individuales
  };
  const setTicketsConRecomendaciones = (data) => dispatch({ type: 'CLIENTE_SET_TICKETS_CON_RECOMENDACIONES', payload: Array.from(data) });
  const setInfoData = (data) => dispatch({ type: 'CLIENTE_SET_INFO_DATA', payload: data });
  const setTicketImageUrl = (url) => dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: url });
  const setClienteImageUrl = (url) => dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: url });
  const setNewTicketImages = (images) => dispatch({ type: 'CLIENTE_SET_NEW_TICKET_IMAGES', payload: images });
  const setUploading = (v) => dispatch({ type: 'CLIENTE_SET_UPLOADING', payload: v });

  return {
    // Estados (desde store)
    tickets,
    setTickets,
    loading,
    error,
    setError,
    userData,
    setUserData,
    solicitudesReapertura: new Set(solicitudesReapertura), // Convertir a Set para compatibilidad
    setSolicitudesReapertura,
    ticketsConRecomendaciones: new Set(ticketsConRecomendaciones),
    setTicketsConRecomendaciones,
    infoData,
    setInfoData,
    ticketImageUrl,
    setTicketImageUrl,
    clienteImageUrl,
    setClienteImageUrl,
    newTicketImages,
    setNewTicketImages,
    uploading,
    setUploading,
    
    // Funciones
    actualizarTickets,
    handleImageUpload,
    handleImageRemove,
    handleClienteImageUpload,
    handleClienteImageRemove,
    handleInfoChange,
    handleLocationChange,
    
    // Store
    store,
    dispatch
  };
}
