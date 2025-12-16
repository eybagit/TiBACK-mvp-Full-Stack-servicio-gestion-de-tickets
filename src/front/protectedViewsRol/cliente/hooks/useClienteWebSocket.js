/**
 * useClienteWebSocket - Hook para gestión de WebSocket del cliente
 * Extrae la lógica de WebSocket y eventos en tiempo real
 */

import { useEffect } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

export function useClienteWebSocket({ 
  tickets, 
  actualizarTickets, 
  setSolicitudesReapertura 
}) {
  const { 
    store, 
    connectWebSocket, 
    disconnectWebSocket, 
    joinRoom, 
    joinTicketRoom,
    startRealtimeSync,
    joinCriticalRooms,
    joinAllCriticalRooms
  } = useGlobalReducer();

  // Conectar WebSocket cuando el usuario esté autenticado
  useEffect(() => {
    if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected) {
      const socket = connectWebSocket(store.auth.token);
      if (socket) {
        const userId = tokenUtils.getUserId(store.auth.token);
        const role = tokenUtils.getRole(store.auth.token);
        joinRoom(socket, role, userId);

        // Unirse a la room específica del cliente
        if (userId) {
          try {
            const clienteRoom = `cliente_${userId}`;
            console.log(`🔌 CLIENTE - Uniéndose a room específica: ${clienteRoom}`);
            socket.emit('join_room', clienteRoom);
          } catch (e) {
            console.error('❌ CLIENTE - Error al unirse a room específica:', e);
          }
        }
      }
    }

    return () => {
      if (store.websocket.socket) {
        disconnectWebSocket(store.websocket.socket);
      }
    };
  }, [store.auth.isAuthenticated, store.auth.token]);

  // Unirse automáticamente a los rooms de tickets del cliente
  useEffect(() => {
    if (store.websocket.socket && tickets.length > 0) {
      const joinedRooms = new Set();
      tickets.forEach(ticket => {
        if (!joinedRooms.has(ticket.id)) {
          joinTicketRoom(store.websocket.socket, ticket.id);
          joinedRooms.add(ticket.id);
        }
      });
    }
  }, [store.websocket.socket, tickets.length]);

  // Configurar sincronización crítica en tiempo real
  useEffect(() => {
    if (store.auth.user && store.websocket.connected && store.websocket.socket) {
      console.log('🔄 CLIENTE - Configurando sincronización crítica');

      joinAllCriticalRooms(store.websocket.socket, store.auth.user, store.auth.token);

      const syncConfig = startRealtimeSync({
        syncTypes: ['tickets', 'comentarios', 'asignaciones'],
        onSyncTriggered: (data) => {
          if (data.type === 'tickets' || data.priority === 'critical') {
            actualizarTickets();
          }
        }
      });

      const ticketIds = tickets.map(ticket => ticket.id);
      if (ticketIds.length > 0) {
        joinCriticalRooms(store.websocket.socket, ticketIds, store.auth.user, store.auth.token);

        ticketIds.forEach(ticketId => {
          store.websocket.socket.emit('join_ticket_room', {
            ticket_id: ticketId,
            user_id: store.auth.user.id,
            role: 'cliente'
          });
        });
      }

      // Configurar listeners para eventos de tickets
      const socket = store.websocket.socket;

      const handleTicketUpdate = (data) => {
        console.log('🎫 CLIENTE - ACTUALIZACIÓN DE TICKET:', data);
        if (data.ticket_id && data.ticket_estado) {
          const estadoLower = data.ticket_estado.toLowerCase();
          if (estadoLower !== 'solucionado') {
            setSolicitudesReapertura(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.ticket_id);
              return newSet;
            });
          }
        }
        actualizarTickets();
      };

      const handleTicketSolucionado = (data) => {
        console.log('✅ CLIENTE - TICKET SOLUCIONADO:', data);
        if (data.ticket_id) {
          setSolicitudesReapertura(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.ticket_id);
            return newSet;
          });
        }
        actualizarTickets();
        setTimeout(() => actualizarTickets(), 1000);
      };

      const handleTicketReabierto = (data) => {
        console.log('🔄 CLIENTE - TICKET REABIERTO:', data);
        if (data.ticket_id) {
          setSolicitudesReapertura(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.ticket_id);
            return newSet;
          });
        }
        actualizarTickets();
      };

      const handleGenericUpdate = () => actualizarTickets();

      // Agregar listeners
      socket.on('ticket_actualizado', handleTicketUpdate);
      socket.on('ticket_estado_changed', handleTicketUpdate);
      socket.on('nuevo_comentario', handleGenericUpdate);
      socket.on('ticket_asignado', handleGenericUpdate);
      socket.on('ticket_escalado', handleGenericUpdate);
      socket.on('ticket_solucionado', handleTicketSolucionado);
      socket.on('ticket_cerrado', handleGenericUpdate);
      socket.on('solicitud_reapertura', handleGenericUpdate);
      socket.on('reapertura_aprobada', handleGenericUpdate);
      socket.on('ticket_reabierto', handleTicketReabierto);
      socket.on('nuevo_ticket', handleGenericUpdate);

      return () => {
        socket.off('ticket_actualizado', handleTicketUpdate);
        socket.off('ticket_estado_changed', handleTicketUpdate);
        socket.off('nuevo_comentario', handleGenericUpdate);
        socket.off('ticket_asignado', handleGenericUpdate);
        socket.off('ticket_escalado', handleGenericUpdate);
        socket.off('ticket_solucionado', handleTicketSolucionado);
        socket.off('ticket_cerrado', handleGenericUpdate);
        socket.off('solicitud_reapertura', handleGenericUpdate);
        socket.off('reapertura_aprobada', handleGenericUpdate);
        socket.off('ticket_reabierto', handleTicketReabierto);
        socket.off('nuevo_ticket', handleGenericUpdate);
      };
    }
  }, [store.auth.user, store.websocket.connected, tickets.length]);

  // Efecto para manejar sincronización manual desde Footer
  useEffect(() => {
    const handleManualSync = (event) => {
      if (event.detail.role === 'cliente') {
        actualizarTickets();
      }
    };

    const handleTotalSync = (event) => {
      if (event.detail.role === 'cliente' || event.detail.source === 'footer_sync') {
        actualizarTickets();
      }
    };

    window.addEventListener('manualSyncTriggered', handleManualSync);
    window.addEventListener('totalSyncTriggered', handleTotalSync);
    window.addEventListener('refresh_tickets', handleTotalSync);
    window.addEventListener('refresh_dashboard', handleTotalSync);
    window.addEventListener('sync_tickets', handleTotalSync);

    return () => {
      window.removeEventListener('manualSyncTriggered', handleManualSync);
      window.removeEventListener('totalSyncTriggered', handleTotalSync);
      window.removeEventListener('refresh_tickets', handleTotalSync);
      window.removeEventListener('refresh_dashboard', handleTotalSync);
      window.removeEventListener('sync_tickets', handleTotalSync);
    };
  }, []);

  // Actualizar tickets cuando lleguen notificaciones WebSocket
  useEffect(() => {
    if (store.websocket.notifications.length > 0) {
      const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];

      if (lastNotification.tipo === 'eliminado' || lastNotification.tipo === 'ticket_eliminado') {
        return;
      }

      actualizarTickets();
    }
  }, [store.websocket.notifications]);

  return { store };
}
