/**
 * @fileoverview useClienteWebSocket - Hook de WebSocket para Cliente
 * 
 * Maneja la conexión WebSocket, eventos de tickets y sincronización
 * en tiempo real para el rol de Cliente.
 * 
 * @module protectedViewsRol/cliente/hooks/useClienteWebSocket
 */

import { useCallback, useRef, useEffect } from 'react';
import { TICKET_STATES } from '../../../constants/ticketEnums';
import { tokenUtils } from '../../../store';
import { useWebSocketEvents } from '../../../hooks/useWebSocketEvents';

/**
 * @typedef {Object} Ticket
 * @property {number} id - ID único del ticket
 * @property {string} titulo - Título del ticket
 * @property {string} descripcion - Descripción del problema
 * @property {string} estado - Estado actual
 * @property {string} prioridad - Prioridad (alta, media, baja)
 * @property {number} id_cliente - ID del cliente
 * @property {number} [id_analista] - ID del analista asignado
 */

/**
 * @typedef {Object} TicketWebSocketEvent
 * @property {number} ticket_id - ID del ticket afectado
 * @property {Ticket} [ticket] - Ticket completo
 * @property {string} [action] - Acción realizada
 * @property {Object} [cambios] - Cambios específicos
 * @property {string} [ticket_estado] - Nuevo estado
 */

/**
 * @typedef {Object} UseClienteWebSocketConfig
 * @property {Object} store - Store global
 * @property {Function} connectWebSocket - Conectar WebSocket
 * @property {Function} disconnectWebSocket - Desconectar WebSocket
 * @property {Function} joinRoom - Unirse a room
 * @property {Function} joinTicketRoom - Unirse a room de ticket
 * @property {Function} startRealtimeSync - Iniciar sincronización
 * @property {Function} joinCriticalRooms - Unirse a rooms críticas
 * @property {Function} joinAllCriticalRooms - Unirse a todas las rooms
 * @property {Ticket[]} tickets - Lista de tickets
 * @property {Function} actualizarTickets - Actualizar tickets desde API
 * @property {Function} setSolicitudesReapertura - Setter de solicitudes
 * @property {Function} setTickets - Setter de tickets
 */

/**
 * Hook para manejar WebSocket y eventos del Cliente.
 * 
 * Eventos manejados:
 * - ticket_asignado: Mi ticket fue asignado a un analista
 * - ticket_escalado: Mi ticket fue escalado
 * - ticket_solucionado: Mi ticket fue solucionado
 * - ticket_cerrado: Mi ticket fue cerrado
 * - ticket_reabierto: Mi ticket fue reabierto
 * - solicitud_reapertura: Mi solicitud de reapertura
 * - reapertura_aprobada: Mi reapertura fue aprobada
 * - nuevo_ticket: Tengo un nuevo ticket
 * 
 * @param {UseClienteWebSocketConfig} config - Configuración del hook
 */
function useClienteWebSocket({
    store,
    connectWebSocket,
    disconnectWebSocket,
    joinRoom,
    joinTicketRoom,
    startRealtimeSync,
    joinCriticalRooms,
    joinAllCriticalRooms,
    tickets,
    actualizarTickets,
    setSolicitudesReapertura,
    setTickets
}) {
    // Conectar WebSocket cuando el usuario esté autenticado
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                const userId = tokenUtils.getUserId(store.auth.token);
                const role = tokenUtils.getRole(store.auth.token);
                // SIMPLIFICADO: Solo unirse a global_tickets via joinRoom
                // El frontend filtra eventos por id_cliente
                joinRoom(socket, role, userId);
            }
        }

        return () => {
            if (store.websocket.socket) {
                disconnectWebSocket(store.websocket.socket);
            }
        };
    }, [store.auth.isAuthenticated, store.auth.token]);

    // NOTA: Las rooms de tickets específicos ya no son necesarias
    // Todos los eventos van a global_tickets y el frontend filtra

    // Hook centralizado para eventos WebSocket comunes
    useWebSocketEvents({
        role: 'cliente',
        store,
        setTickets
    });

    // Configurar listeners de eventos WebSocket
    useEffect(() => {
        if (store.auth.user && store.websocket.connected && store.websocket.socket) {
            // SIMPLIFICADO: No necesitamos unir a rooms específicas
            // Ya estamos en global_tickets via joinRoom en el useEffect anterior
            // El frontend filtra eventos por ticket.id_cliente === store.auth.user.id

            const socket = store.websocket.socket;

            // === HANDLERS ESPECÍFICOS DE CLIENTE ===

            /** @param {TicketWebSocketEvent} data */
            const handleTicketSolucionado = (data) => {
                if (data.ticket_id) {
                    setTickets(prev => Array.isArray(prev) 
                        ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'solucionado' } : t)
                        : prev
                    );
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                    window.dispatchEvent(new CustomEvent('ticket_solucionado_cliente', {
                        detail: { ...data, source: 'cliente_websocket' }
                    }));
                }
            };

            /** @param {TicketWebSocketEvent} data */
            const handleTicketCerrado = (data) => {
                console.log('🔔 [Cliente] Evento ticket_cerrado recibido:', data);
                console.log('🔔 [Cliente] ticket_id:', data.ticket_id);
                console.log('🔔 [Cliente] Tickets actuales:', tickets.length);
                
                if (data.ticket_id) {
                    // IMPORTANTE: Los tickets cerrados se ELIMINAN de la vista del cliente
                    // El cliente solo debe ver tickets activos (en espera, en proceso, solucionado)
                    setTickets(prev => {
                        const filtered = Array.isArray(prev) 
                            ? prev.filter(t => t.id !== data.ticket_id)
                            : prev;
                        
                        console.log(`🗑️ [Cliente] Ticket ${data.ticket_id} cerrado - removido de la vista`);
                        console.log(`📊 [Cliente] Tickets antes: ${Array.isArray(prev) ? prev.length : 0}, después: ${Array.isArray(filtered) ? filtered.length : 0}`);
                        
                        return filtered;
                    });
                    
                    // También limpiar de solicitudes de reapertura si existía
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                } else {
                    console.warn('⚠️ [Cliente] Evento ticket_cerrado sin ticket_id:', data);
                }
            };

            /** @param {TicketWebSocketEvent} data */
            const handleTicketReabierto = (data) => {
                console.log('🔔 [Cliente] Evento ticket_reabierto recibido:', data);
                
                try {
                    if (data.ticket_id) {
                        console.log('🔔 [Cliente] ✅ Actualizando ticket reabierto');
                        
                        setTickets(prev => {
                            return Array.isArray(prev) 
                                ? prev.map(t => t.id === data.ticket_id 
                                    ? { ...t, estado: data.ticket?.estado || 'reabierto' } 
                                    : t)
                                : prev;
                        });
                        
                        // Limpiar solicitudes de reapertura
                        setSolicitudesReapertura(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(data.ticket_id);
                            console.log(`🗑️ [Cliente] Ticket ${data.ticket_id} reabierto - solicitud limpiada`);
                            return newSet;
                        });
                    }
                } catch (error) {
                    console.error('🔔 [Cliente] 💥 ERROR en handleTicketReabierto:', error);
                }
            };

            /** @param {TicketWebSocketEvent} data */
            const handleSolicitudReapertura = (data) => {
                if (data.ticket_id) {
                    setTickets(prev => Array.isArray(prev) 
                        ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'solucionado' } : t)
                        : prev
                    );
                }
            };

            /** @param {TicketWebSocketEvent} data */
            const handleReaperturaAprobada = (data) => {
                if (data.ticket_id) {
                    setTickets(prev => Array.isArray(prev) 
                        ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'en_espera' } : t)
                        : prev
                    );
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                }
            };

            /** @param {TicketWebSocketEvent} data */
            const handleTicketIniciado = (data) => {
                if (data.ticket_id) {
                    setTickets(prev => Array.isArray(prev) 
                        ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'en_proceso' } : t)
                        : prev
                    );
                    // Log para desarrollo
                    if (import.meta.env.DEV) {
                        console.log(`🎯 Ticket ${data.ticket_id} iniciado - Analista trabajando en él`);
                    }
                }
            };

            /** @param {TicketWebSocketEvent} data */
            const handleNuevoTicket = (data) => {
                if (data.ticket) {
                    setTickets(prev => Array.isArray(prev) ? [data.ticket, ...prev] : [data.ticket]);
                }
            };

            // Registrar listeners específicos de cliente
            socket.on('ticket_iniciado', handleTicketIniciado);  // NUEVO: Ver cuando analista inicia
            socket.on('ticket_solucionado', handleTicketSolucionado);
            socket.on('ticket_cerrado', handleTicketCerrado);
            socket.on('solicitud_reapertura', handleSolicitudReapertura);
            socket.on('reapertura_aprobada', handleReaperturaAprobada);
            socket.on('ticket_reabierto', handleTicketReabierto);
            socket.on('nuevo_ticket', handleNuevoTicket);

            // Cleanup
            return () => {
                socket.off('ticket_iniciado', handleTicketIniciado);
                socket.off('ticket_solucionado', handleTicketSolucionado);
                socket.off('ticket_cerrado', handleTicketCerrado);
                socket.off('solicitud_reapertura', handleSolicitudReapertura);
                socket.off('reapertura_aprobada', handleReaperturaAprobada);
                socket.off('ticket_reabierto', handleTicketReabierto);
                socket.off('nuevo_ticket', handleNuevoTicket);
            };
        }
    }, [store.auth.user, store.websocket.connected, tickets.length]);

    // Manejar sincronización manual desde Footer
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

    // Manejar notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];

            if (lastNotification.tipo === 'eliminado' || lastNotification.tipo === 'ticket_eliminado') {
                if (lastNotification.ticket_id) {
                    setTickets(prev => prev.filter(ticket => ticket.id !== lastNotification.ticket_id));
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(lastNotification.ticket_id);
                        return newSet;
                    });
                }
                return;
            }

            if (lastNotification.tipo === TICKET_STATES.SOLUCIONADO) {
                if (lastNotification.ticket_id) {
                    setTickets(prev => Array.isArray(prev) 
                        ? prev.map(t => t.id === lastNotification.ticket_id ? { ...t, estado: 'solucionado' } : t)
                        : prev
                    );
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(lastNotification.ticket_id);
                        return newSet;
                    });
                }
            } else {
                if (lastNotification.ticket_id && lastNotification.estado) {
                    setTickets(prev => Array.isArray(prev) 
                        ? prev.map(t => t.id === lastNotification.ticket_id ? { ...t, estado: lastNotification.estado } : t)
                        : prev
                    );
                }
            }
        }
    }, [store.websocket.notifications]);
}

export default useClienteWebSocket;
