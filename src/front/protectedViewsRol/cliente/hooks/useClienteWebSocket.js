import { useEffect } from 'react';
import { tokenUtils } from '../../../store';

/**
 * useClienteWebSocket - Hook para manejar la conexión WebSocket y eventos en tiempo real
 * Configura listeners, sincronización y manejo de eventos de tickets
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
                joinRoom(socket, role, userId);

                // Unirse EXPLÍCITAMENTE a la room específica del cliente
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

            // NO usar startRealtimeSync - causa recargas
            // startRealtimeSync({ ... actualizarTickets() ... });

            // Unirse a rooms críticos de tickets
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

            // === HANDLERS 100% LOCALES (SIN FETCH) ===
            const socket = store.websocket.socket;

            // Helper para actualizar ticket localmente
            const updateTicketLocal = (ticketId, changes) => {
                setTickets(prev => Array.isArray(prev) 
                    ? prev.map(t => t.id === ticketId ? { ...t, ...changes } : t)
                    : prev
                );
            };

            const handleTicketUpdate = (data) => {
                if (data.ticket_id) {
                    // Actualizar estado localmente
                    const updates = {};
                    if (data.ticket_estado) updates.estado = data.ticket_estado;
                    if (data.cambios) Object.assign(updates, data.cambios);
                    if (Object.keys(updates).length > 0) {
                        updateTicketLocal(data.ticket_id, updates);
                    }
                    // Limpiar solicitudes de reapertura si no está solucionado
                    if (data.ticket_estado?.toLowerCase() !== 'solucionado') {
                        setSolicitudesReapertura(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(data.ticket_id);
                            return newSet;
                        });
                    }
                }
            };

            const handleTicketSolucionado = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { estado: 'solucionado' });
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

            const handleTicketAsignado = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { 
                        estado: 'asignado',
                        id_analista: data.analista_id || data.id_analista
                    });
                }
            };

            const handleTicketEscalado = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { estado: 'escalado' });
                }
            };

            const handleTicketCerrado = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { estado: 'cerrado' });
                }
            };

            const handleTicketReabierto = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { estado: data.estado || 'en_espera' });
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                }
            };

            const handleSolicitudReapertura = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { estado: 'solucionado' });
                }
            };

            const handleReaperturaAprobada = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { estado: 'en_espera' });
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                }
            };

            const handleNuevoComentario = (data) => {
                // Los comentarios se cargan al abrir el ticket, ignorar aquí
            };

            const handleNuevoTicket = (data) => {
                if (data.ticket) {
                    setTickets(prev => Array.isArray(prev) ? [data.ticket, ...prev] : [data.ticket]);
                }
            };

            socket.on('ticket_actualizado', handleTicketUpdate);
            socket.on('ticket_estado_changed', handleTicketUpdate);
            socket.on('nuevo_comentario', handleNuevoComentario);
            socket.on('ticket_asignado', handleTicketAsignado);
            socket.on('ticket_escalado', handleTicketEscalado);
            socket.on('ticket_solucionado', handleTicketSolucionado);
            socket.on('ticket_cerrado', handleTicketCerrado);
            socket.on('solicitud_reapertura', handleSolicitudReapertura);
            socket.on('reapertura_aprobada', handleReaperturaAprobada);
            socket.on('ticket_reabierto', handleTicketReabierto);
            socket.on('nuevo_ticket', handleNuevoTicket);

            return () => {
                socket.off('ticket_actualizado', handleTicketUpdate);
                socket.off('ticket_estado_changed', handleTicketUpdate);
                socket.off('nuevo_comentario', handleNuevoComentario);
                socket.off('ticket_asignado', handleTicketAsignado);
                socket.off('ticket_escalado', handleTicketEscalado);
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
                actualizarTickets(); // OK: acción manual del usuario
            }
        };

        const handleTotalSync = (event) => {
            if (event.detail.role === 'cliente' || event.detail.source === 'footer_sync') {
                actualizarTickets(); // OK: acción manual del usuario
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

    // Manejar actualizaciones críticas de tickets
    useEffect(() => {
        // NO actualizar automáticamente - causa recargas
        // if (store.websocket.criticalTicketUpdate?.priority === 'critical') {
        //     actualizarTickets();
        // }
    }, [store.websocket.criticalTicketUpdate]);

    // Actualizar tickets cuando lleguen notificaciones WebSocket
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

            if (lastNotification.tipo === 'solucionado') {
                if (lastNotification.ticket_id) {
                    // Actualizar localmente
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
                // NO hacer fetch - ya actualizamos localmente
            } else {
                // Otras notificaciones: actualizar localmente si tenemos datos
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
