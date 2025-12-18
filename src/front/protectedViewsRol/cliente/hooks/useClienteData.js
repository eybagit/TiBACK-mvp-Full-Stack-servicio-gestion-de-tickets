/**
 * useClienteData - Hook para gestión de datos del cliente
 * Extrae la lógica de carga de datos y tickets de ClientePage
 */

import { useState, useEffect } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

export function useClienteData() {
  const { store, dispatch } = useGlobalReducer();
  
  // Estados principales
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [solicitudesReapertura, setSolicitudesReapertura] = useState(new Set());
  const [ticketsConRecomendaciones, setTicketsConRecomendaciones] = useState(new Set());
  
  // Estados para formulario de info
  const [infoData, setInfoData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    lat: null,
    lng: null,
    password: '',
    confirmPassword: ''
  });
  
  // Estados para imágenes
  const [ticketImageUrl, setTicketImageUrl] = useState('');
  const [clienteImageUrl, setClienteImageUrl] = useState('');
  const [newTicketImages, setNewTicketImages] = useState([]);
  const [uploading, setUploading] = useState(false);

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
        setTickets(ticketsData);
        console.log(`📋 Cliente - Tickets cargados: ${ticketsData.length} tickets`);

        // Limpiar solicitudes de reapertura para tickets que ya NO están en estado 'solucionado'
        setSolicitudesReapertura(prev => {
          const newSet = new Set(prev);
          ticketsData.forEach(ticket => {
            if (ticket.estado && ticket.estado.toLowerCase() !== 'solucionado' && newSet.has(ticket.id)) {
              newSet.delete(ticket.id);
            }
          });
          const ticketIds = new Set(ticketsData.map(t => t.id));
          Array.from(newSet).forEach(ticketId => {
            if (!ticketIds.has(ticketId)) {
              newSet.delete(ticketId);
            }
          });
          return newSet;
        });
      }
    } catch (err) {
      setError("Error al actualizar la lista");
      setTimeout(() => setError(""), 2000);
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
          const userData = await userResponse.json();
          setUserData(userData);

          dispatch({
            type: 'SET_USER',
            payload: userData
          });

          setInfoData({
            nombre: userData.nombre === 'Pendiente' ? '' : userData.nombre || '',
            apellido: userData.apellido === 'Pendiente' ? '' : userData.apellido || '',
            email: userData.email || '',
            telefono: userData.telefono === '0000000000' ? '' : userData.telefono || '',
            direccion: userData.direccion === 'Pendiente' ? '' : userData.direccion || '',
            lat: userData.latitude || null,
            lng: userData.longitude || null,
            password: '',
            confirmPassword: ''
          });
          setClienteImageUrl(userData.url_imagen || '');
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
        setTickets(ticketsData);
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
  const handleImageUpload = (imageUrl) => setTicketImageUrl(imageUrl);
  const handleImageRemove = () => setTicketImageUrl('');
  
  const handleClienteImageUpload = (imageUrl) => {
    setClienteImageUrl(imageUrl);
    setUserData(prev => ({ ...prev, url_imagen: imageUrl }));
  };
  
  const handleClienteImageRemove = () => {
    setClienteImageUrl('');
    setUserData(prev => ({ ...prev, url_imagen: null }));
  };

  // Función para manejar cambios en el formulario de información
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfoData(prev => ({ ...prev, [name]: value }));
  };

  // Función para manejar cambios de ubicación
  const handleLocationChange = (location) => {
    setInfoData(prev => ({
      ...prev,
      direccion: location.direccion,
      lat: location.lat,
      lng: location.lng
    }));
  };

  return {
    // Estados
    tickets,
    setTickets,
    loading,
    error,
    setError,
    userData,
    setUserData,
    solicitudesReapertura,
    setSolicitudesReapertura,
    ticketsConRecomendaciones,
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
