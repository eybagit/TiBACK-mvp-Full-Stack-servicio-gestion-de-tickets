import { useEffect } from 'react';
import { tokenUtils } from '../../../store';

/**
 * useAnalistaWebSocket - Conexión y eventos WebSocket del analista
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
    // Conectar WebSocket
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

    // Setup listeners
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

        // === ACTUALIZACIONES INSTANTÁNEAS (100% LOCALES) ===

        // === HANDLERS INSTANTÁNEOS ===
        
        const onSolicitudReapertura = (data) => {
            if (!data || !data.ticket_id) return;
            setTicketsSolicitudReapertura(prev => { const copy = new Set(prev); copy.add(data.ticket_id); return copy; });
            setTickets(prev => Array.isArray(prev) ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'solucionado' } : t) : prev);
        };

        const onTicketReabierto = (data) => {
            if (!data || !data.ticket_id) return;
            setTicketsSolicitudReapertura(prev => { const copy = new Set(prev); copy.delete(data.ticket_id); return copy; });
            setTickets(prev => Array.isArray(prev) ? prev.map(t => t.id === data.ticket_id ? { ...t, estado: data.estado || 'en_espera' } : t) : prev);
        };

        const onTicketCerrado = (data) => {
            if (!data || !data.ticket_id) return;
            setTickets(prev => Array.isArray(prev) ? prev.filter(t => t.id !== data.ticket_id) : prev);
        };

        const onTicketAsignado = (data) => {
            if (!data || !data.ticket_id) return;
            const esParaMi = data.analista_id === store.auth.user?.id || data.id_analista === store.auth.user?.id;
            if (esParaMi) {
                if (data.ticket) {
                    // Si viene el ticket completo, agregarlo
                    setTickets(prev => {
                        const exists = Array.isArray(prev) && prev.some(t => t.id === data.ticket.id);
                        if (exists) {
                            return prev.map(t => t.id === data.ticket.id ? data.ticket : t);
                        }
                        return Array.isArray(prev) ? [data.ticket, ...prev] : [data.ticket];
                    });
                } else {
                    // No viene ticket completo, hacer fetch específico de ese ticket
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

        const onTicketAsignadoAMi = (data) => {
            if (data && data.ticket) {
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

        const onGenericUpdate = (data) => {
            if (data && data.ticket_id && data.cambios) {
                setTickets(prev => Array.isArray(prev) ? prev.map(t => 
                    t.id === data.ticket_id ? { ...t, ...data.cambios } : t
                ) : prev);
            }
        };

        const onCritical = (data) => {
            if (!data || !data.ticket_id) return;
            const estadoMap = {
                'ticket_iniciado': 'en_proceso',
                'ticket_solucionado': 'solucionado',
                'ticket_escalado': 'escalado'
            };
            const nuevoEstado = estadoMap[data.action];
            if (nuevoEstado) {
                setTickets(prev => Array.isArray(prev) ? prev.map(t => 
                    t.id === data.ticket_id ? { ...t, estado: nuevoEstado } : t
                ) : prev);
            }
        };

        socket.on('solicitud_reapertura', onSolicitudReapertura);
        socket.on('ticket_reabierto', onTicketReabierto);
        socket.on('ticket_cerrado', onTicketCerrado);
        socket.on('ticket_asignado', onTicketAsignado);
        socket.on('ticket_asignado_a_mi', onTicketAsignadoAMi);
        socket.on('ticket_actualizado', onGenericUpdate);
        socket.on('nuevo_comentario', onGenericUpdate);
        socket.on('critical_ticket_update', onCritical);
        socket.on('critical_ticket_action', onCritical);
        socket.on('global_ticket_update', onGenericUpdate);
        socket.on('ticket_estado_changed', onGenericUpdate);

        return () => {
            socket.off('solicitud_reapertura', onSolicitudReapertura);
            socket.off('ticket_reabierto', onTicketReabierto);
            socket.off('ticket_cerrado', onTicketCerrado);
            socket.off('ticket_asignado', onTicketAsignado);
            socket.off('ticket_asignado_a_mi', onTicketAsignadoAMi);
            socket.off('ticket_actualizado', onGenericUpdate);
            socket.off('nuevo_comentario', onGenericUpdate);
            socket.off('critical_ticket_update', onCritical);
            socket.off('critical_ticket_action', onCritical);
            socket.off('global_ticket_update', onGenericUpdate);
            socket.off('ticket_estado_changed', onGenericUpdate);
        };
    }, [store.auth.user, store.websocket.connected, tickets]);
}

export default useAnalistaWebSocket;
