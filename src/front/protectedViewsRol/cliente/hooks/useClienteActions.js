/**
 * useClienteActions - Hook para acciones del cliente
 * Crear tickets, evaluar, solicitar reapertura, cerrar, actualizar info
 */

import useGlobalReducer from '../../../hooks/useGlobalReducer';

export function useClienteActions({ 
  store,
  tickets,
  actualizarTickets,
  setTickets,
  setSolicitudesReapertura,
  setError,
  ticketImageUrl,
  setTicketImageUrl,
  setShowTicketForm,
  setUploading,
  clienteImageUrl,
  infoData,
  setInfoData,
  setUpdatingInfo,
  userData,
  setUserData
}) {
  const { emitCriticalTicketAction, joinTicketRoom, joinCriticalRooms } = useGlobalReducer();

  // Crear nuevo ticket
  const crearTicket = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    const formData = new FormData(e.target);
    const ticketData = {
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      prioridad: formData.get('prioridad'),
      url_imagen: ticketImageUrl
    };
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${store.auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) throw new Error('Error al crear ticket');

      e.target.reset();
      setTicketImageUrl('');
      setShowTicketForm(false);

      const responseData = await response.json();
      const ticketId = responseData.id;

      if (store.websocket.socket && ticketId) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_creado', store.auth.user);
        joinTicketRoom(store.websocket.socket, ticketId);
        joinCriticalRooms(store.websocket.socket, [ticketId], store.auth.user);
      }

      await actualizarTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Evaluar ticket
  const evaluarTicket = async (ticketId, calificacion) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/evaluar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ calificacion })
        }
      );

      if (!response.ok) throw new Error('Error al evaluar ticket');

      await actualizarTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  // Solicitar reapertura de ticket
  const solicitarReapertura = async (ticketId) => {
    try {
      setSolicitudesReapertura(prev => new Set([...prev, ticketId]));

      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'solicitar_reapertura', store.auth.user);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cambiar-estado`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: 'solicitar_reapertura' })
        }
      );

      if (!response.ok) {
        setSolicitudesReapertura(prev => {
          const newSet = new Set(prev);
          newSet.delete(ticketId);
          return newSet;
        });
        throw new Error('Error al solicitar reapertura');
      }

      await actualizarTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cerrar ticket
  const cerrarTicket = async (ticketId) => {
    try {
      if (store.websocket.socket) {
        emitCriticalTicketAction(store.websocket.socket, ticketId, 'cerrar_ticket', store.auth.user);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cambiar-estado`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: 'cerrado' })
        }
      );

      if (!response.ok) throw new Error('Error al cerrar ticket');

      await actualizarTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar información del cliente
  const updateInfo = async () => {
    try {
      setUpdatingInfo(true);

      const updateData = {
        nombre: infoData.nombre || null,
        apellido: infoData.apellido || null,
        email: infoData.email || null,
        telefono: infoData.telefono || null,
        direccion: infoData.direccion || null,
        latitude: infoData.lat || null,
        longitude: infoData.lng || null,
        url_imagen: clienteImageUrl || null
      };

      if (infoData.password && infoData.password === infoData.confirmPassword) {
        updateData.password = infoData.password;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userData.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${store.auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) throw new Error('Error al actualizar información');

      const updatedData = await response.json();
      setUserData(updatedData);
      setInfoData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdatingInfo(false);
    }
  };

  // Helper: Color de estado
  const getEstadoColor = (estado) => {
    const colors = {
      'abierto': 'warning',
      'en_progreso': 'info',
      'solucionado': 'success',
      'cerrado': 'secondary',
      'escalado': 'danger'
    };
    return colors[estado?.toLowerCase()] || 'secondary';
  };

  // Helper: Color de prioridad
  const getPrioridadColor = (prioridad) => {
    const colors = {
      'alta': 'danger',
      'media': 'warning',
      'baja': 'success'
    };
    return colors[prioridad?.toLowerCase()] || 'secondary';
  };

  // Helper: Verificar si tiene analista asignado
  const tieneAnalistaAsignado = (ticket) => {
    return ticket.asignaciones && ticket.asignaciones.length > 0;
  };

  // Helper: Obtener nombre del analista asignado
  const getAnalistaAsignado = (ticket) => {
    if (!tieneAnalistaAsignado(ticket)) return null;
    const ultimaAsignacion = ticket.asignaciones[ticket.asignaciones.length - 1];
    return ultimaAsignacion.analista?.nombre || 'Analista asignado';
  };

  return {
    crearTicket,
    evaluarTicket,
    solicitarReapertura,
    cerrarTicket,
    updateInfo,
    getEstadoColor,
    getPrioridadColor,
    tieneAnalistaAsignado,
    getAnalistaAsignado
  };
}
