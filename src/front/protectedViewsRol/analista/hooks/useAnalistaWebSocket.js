/**
 * @fileoverview useAnalistaWebSocket - Hook de WebSocket para Analista
 * 
 * Maneja la conexión WebSocket, eventos de tickets y sincronización
 * en tiempo real para el rol de Analista.
 * 
 * @module protectedViewsRol/analista/hooks/useAnalistaWebSocket
 */

import { useEffect } from 'react';
import { tokenUtils } from '../../../store';
import { useWebSocketEvents } from '../../../hooks/useWebSocketEvents';
import { validateTicketEvent, validateTicketObject, logValidationError } from '../../../utils/websocket-validators';

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
 * @property {number} [analista_id] - ID del analista
 */

/**
 * @typedef {Object} UseAnalistaWebSocketConfig
 * @property {Object} store - Store global
 * @property {Function} connectWebSocket - Conectar WebSocket
 * @property {Function} disconnectWebSocket - Desconectar WebSocket
 * @property {Function} joinRoom - Unirse a room
 * @property {Function} joinTicketRoom - Unirse a room de ticket
 * @property {Function} joinCriticalRooms - Unirse a rooms críticas
 * @property {Function} joinAllCriticalRooms - Unirse a todas las rooms
 * @property {Ticket[]} tickets - Lista de tickets
 * @property {Function} setTickets - Setter de tickets
 * @property {Function} setTicketsSolicitudReapertura - Setter de solicitudes
 * @property {Function} actualizarTickets - Actualizar tickets desde API
 * @property {Function} [sincronizarSilenciosamente] - Sincronización silenciosa
 */

/**
 * Hook para manejar WebSocket y eventos del Analista.
 * 
 * Eventos manejados:
 * - ticket_asignado: Ticket asignado al analista
 * - ticket_asignado_a_mi: Ticket específicamente para este analista
 * - ticket_cerrado: Ticket cerrado
 * - ticket_reabierto: Ticket reabierto
 * - solicitud_reapertura: Cliente solicita reapertura
 * - critical_ticket_update: Actualización crítica
 * 
 * @param {UseAnalistaWebSocketConfig} config - Configuración del hook
 */
export function useAnalistaWebSocket({
    store,
    connectWebSocket,
    disconnectWebSocket,
    joinRoom,
    joinTicketRoom,
    joinCriticalRooms,
    joinAllCriticalRooms,
    tickets,
    setTickets,
    setTicketsSolicitudReapertura,
    actualizarTickets,
    sincronizarSilenciosamente
}) {
    // Conectar WebSocket cuando usuario está autenticado
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected && !store.websocket.connecting) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                const decoded = tokenUtils.decodeToken(store.auth.token) || {};
                const userId = store.auth.user?.id || decoded.user_id;
                const role = 'analista';

                if (joinRoom) {
                    try {
                        joinRoom(socket, role, userId);
                        socket.emit('join_room', 'global_system_room');
                        socket.emit('join_room', 'global_tickets');
                        socket.emit('join_room', 'ticket_status_changes');
                    } catch (e) {}
                }

                if (userId) {
                    try {
                        socket.emit('join_room', `analista_${userId}`);
                    } catch (e) {}
                }

                const userData = { id: userId, role: 'analista' };
                if (joinAllCriticalRooms) {
                    try {
                        joinAllCriticalRooms(socket, userData, store.auth.token);
                    } catch (e) {}
                }
            }
        }

        return () => {
            if (store.websocket.socket) disconnectWebSocket(store.websocket.socket);
        };
    }, [store.auth.isAuthenticated, store.auth.token, store.websocket.connected, store.websocket.connecting]);

    // Hook centralizado para eventos WebSocket comunes
    useWebSocketEvents({
        role: 'analista',
        store,
        setTickets
    });

    // Configurar listeners de eventos WebSocket
    useEffect(() => {
        const tokenDecoded = store.auth.token ? tokenUtils.decodeToken(store.auth.token) : null;
        if (!((store.auth.user || tokenDecoded) && store.websocket.connected && store.websocket.socket)) {
            return;
        }
        const socket = store.websocket.socket;

        const userData = store.auth.user
            ? { ...store.auth.user, role: 'analista' }
            : (tokenDecoded ? { id: tokenDecoded.user_id, role: 'analista' } : null);

        try {
            joinAllCriticalRooms && joinAllCriticalRooms(socket, userData, store.auth.token);
        } catch (e) {}

        const ticketIds = Array.isArray(tickets) ? tickets.map(t => t.id) : [];
        if (ticketIds.length && joinCriticalRooms) {
            try { joinCriticalRooms(socket, ticketIds, store.auth.user, store.auth.token); } catch (e) {}
        }

        if (ticketIds.length) {
            ticketIds.forEach(id => {
                if (joinTicketRoom) {
                    try { joinTicketRoom(socket, id); } catch (err) {}
                }
            });
        }

        // === HANDLERS DE EVENTOS ===

        /** @param {TicketWebSocketEvent} data */
        const onSolicitudReapertura = (data) => {
            if (!data || !data.ticket_id) return;
            setTicketsSolicitudReapertura(prev => { const copy = new Set(prev); copy.add(data.ticket_id); return copy; });
            setTickets(prev => Array.isArray(prev) ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'solucionado' } : t) : prev);
        };

        /** @param {TicketWebSocketEvent} data */
        const onTicketReabierto = (data) => {
            if (!data || !data.ticket_id) return;
            setTicketsSolicitudReapertura(prev => { const copy = new Set(prev); copy.delete(data.ticket_id); return copy; });
            setTickets(prev => Array.isArray(prev) ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: data.estado || 'en_espera' } : t) : prev);
        };

        /** @param {TicketWebSocketEvent} data */
        const onTicketCerrado = (data) => {
            if (!data || !data.ticket_id) return;
            setTickets(prev => Array.isArray(prev) ? prev.filter(t => t.id !== data.ticket_id) : prev);
        };

        /** @param {TicketWebSocketEvent} data */
        const onTicketAsignado = (data) => {
            // Validar estructura básica
            if (!validateTicketEvent(data)) {
                logValidationError('ticket_asignado', data, 'Invalid event structure');
                return;
            }
            
            const esParaMi = data.analista_id === store.auth.user?.id || data.id_analista === store.auth.user?.id;
            if (esParaMi) {
                if (data.ticket) {
                    // Validar ticket completo si viene
                    if (!validateTicketObject(data.ticket)) {
                        logValidationError('ticket_asignado', data.ticket, 'Invalid ticket object');
                        return;
                    }
                    
                    // Si viene el ticket completo, agregarlo
                    setTickets(prev => {
                        const exists = Array.isArray(prev) && prev.some(t => t.id === data.ticket.id);
                        if (exists) {
                            return prev.map(t => t.id === data.ticket.id ? data.ticket : t);
                        }
                        return Array.isArray(prev) ? [data.ticket, ...prev] : [data.ticket];
                    });
                } else {
                    // No viene ticket completo, hacer fetch específico
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${data.ticket_id}`, {
                        headers: { 'Authorization': `Bearer ${store.auth.token}` }
                    })
                    .then(res => res.ok ? res.json() : null)
                    .then(ticket => {
                        if (ticket) {
                            setTickets(prev => {
                                const exists = Array.isArray(prev) && prev.some(t => t.id === ticket.id);
                                if (exists) {
                                    return prev.map(t => t.id === ticket.id ? ticket : t);
                                }
                                return Array.isArray(prev) ? [ticket, ...prev] : [ticket];
                            });
                        }
                    })
                    .catch(err => console.debug('Error fetching ticket:', err));
                }
            }
        };

        /** @param {TicketWebSocketEvent} data */
        const onTicketAsignadoAMi = (data) => {
            // Validar estructura básica
            if (!validateTicketEvent(data)) {
                logValidationError('ticket_asignado_a_mi', data, 'Invalid event structure');
                return;
            }
            
            if (data && data.ticket) {
                // Validar ticket completo
                if (!validateTicketObject(data.ticket)) {
                    logValidationError('ticket_asignado_a_mi', data.ticket, 'Invalid ticket object');
                    return;
                }
                
                setTickets(prev => {
                    const exists = Array.isArray(prev) && prev.some(t => t.id === data.ticket.id);
                    if (exists) {
                        return prev.map(t => t.id === data.ticket.id ? data.ticket : t);
                    }
                    return Array.isArray(prev) ? [data.ticket, ...prev] : [data.ticket];
                });
            } else if (data && data.ticket_id) {
                // Fetch específico si no viene completo
                fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${data.ticket_id}`, {
                    headers: { 'Authorization': `Bearer ${store.auth.token}` }
                })
                .then(res => res.ok ? res.json() : null)
                .then(ticket => {
                    if (ticket) {
                        setTickets(prev => {
                            const exists = Array.isArray(prev) && prev.some(t => t.id === ticket.id);
                            if (exists) {
                                return prev.map(t => t.id === ticket.id ? ticket : t);
                            }
                            return Array.isArray(prev) ? [ticket, ...prev] : [ticket];
                        });
                    }
                })
                .catch(err => console.debug('Error fetching ticket:', err));
            }
        };

        // Registrar listeners específicos de analista
        socket.on('solicitud_reapertura', onSolicitudReapertura);
        socket.on('ticket_reabierto', onTicketReabierto);
        socket.on('ticket_cerrado', onTicketCerrado);
        socket.on('ticket_asignado', onTicketAsignado);
        socket.on('ticket_asignado_a_mi', onTicketAsignadoAMi);

        // Cleanup
        return () => {
            socket.off('solicitud_reapertura', onSolicitudReapertura);
            socket.off('ticket_reabierto', onTicketReabierto);
            socket.off('ticket_cerrado', onTicketCerrado);
            socket.off('ticket_asignado', onTicketAsignado);
            socket.off('ticket_asignado_a_mi', onTicketAsignadoAMi);
        };
    }, [store.auth.user, store.websocket.connected, tickets]);
}

export default useAnalistaWebSocket;
