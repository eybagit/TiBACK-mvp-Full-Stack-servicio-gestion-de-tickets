import { useEffect } from 'react';
import { tokenUtils } from '../../../store';

/**
 * useWebSocketSync - Manejo de WebSocket y sincronización en tiempo real
 */
export function useWebSocketSync({
    store,
    connectWebSocket,
    disconnectWebSocket,
    joinRoom,
    joinTicketRoom,
    startRealtimeSync,
    joinCriticalRooms,
    joinAllCriticalRooms,
    tickets,
    setTickets,
    ticketsCerrados,
    setTicketsCerrados,
    actualizarTodasLasTablas,
    sincronizarSilenciosamente
}) {
    
    // Mover ticket a cerrados
    const moveTicketToClosed = (ticketId) => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            setTickets(prev => prev.filter(t => t.id !== ticketId));
            setTicketsCerrados(prev => [{
                ...ticket,
                estado: 'cerrado_por_supervisor',
                fecha_cierre: new Date().toISOString()
            }, ...prev]);
        }
    };

    // Mover ticket a activos
    const moveTicketToActive = (ticketId) => {
        const ticket = ticketsCerrados.find(t => t.id === ticketId);
        if (ticket) {
            let nuevoEstado = 'en_espera';
            if (ticket.estado === 'solucionado') nuevoEstado = 'reabierto';
            
            setTicketsCerrados(prev => prev.filter(t => t.id !== ticketId));
            setTickets(prev => [{
                ...ticket,
                estado: nuevoEstado,
                fecha_cierre: null,
                asignacion_actual: null
            }, ...prev]);
        }
    };

    // Conectar WebSocket
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                const userId = tokenUtils.getUserId(store.auth.token);
                const role = 'supervisor';
                joinRoom(socket, role, userId);
            }
        }

        return () => {
            if (store.websocket.socket) {
                disconnectWebSocket(store.websocket.socket);
            }
        };
    }, [store.auth.isAuthenticated, store.auth.token]);

    // Configurar sincronización en tiempo real
    useEffect(() => {
        if (store.auth.user && store.websocket.connected && store.websocket.socket) {
            const supervisorData = { ...store.auth.user, role: 'supervisor' };
            joinAllCriticalRooms(store.websocket.socket, supervisorData, store.auth.token);

            startRealtimeSync({
                syncTypes: ['tickets', 'comentarios', 'asignaciones', 'chats'],
                onSyncTriggered: (data) => {
                    if (data.type === 'tickets' || data.priority === 'critical') {
                        actualizarTodasLasTablas();
                    }
                }
            });

            const ticketIds = tickets.map(ticket => ticket.id);
            if (ticketIds.length > 0) {
                joinCriticalRooms(store.websocket.socket, ticketIds, store.auth.user, store.auth.token);
                ticketIds.forEach(ticketId => {
                    try {
                        if (joinTicketRoom) {
                            joinTicketRoom(store.websocket.socket, ticketId);
                        }
                    } catch (e) {}
                });
            }

            const socket = store.websocket.socket;
            
            // === HELPERS PARA ACTUALIZACIONES LOCALES ===
            const updateTicketLocal = (ticketId, changes) => {
                setTickets(prev => Array.isArray(prev) 
                    ? prev.map(t => t.id === ticketId ? { ...t, ...changes } : t)
                    : prev
                );
            };
            
            const addTicketLocal = (ticket) => {
                setTickets(prev => Array.isArray(prev) ? [ticket, ...prev] : [ticket]);
            };
            
            // === HANDLERS INSTANTÁNEOS (100% LOCALES) ===
            
            // Ticket creado
            const handleTicketCreated = (data) => {
                if (data.ticket) {
                    addTicketLocal(data.ticket);
                }
                // Si no hay datos completos, ignorar (el backend enviará evento completo)
            };
            
            // Ticket actualizado
            const handleTicketUpdated = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, data.cambios || {});
                }
            };
            
            // Ticket asignado
            const handleTicketAsignado = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { 
                        estado: 'asignado',
                        id_analista: data.analista_id || data.id_analista
                    });
                }
            };
            
            // Ticket escalado
            const handleTicketEscalado = (data) => {
                if (data.ticket_id) {
                    updateTicketLocal(data.ticket_id, { estado: 'escalado' });
                }
            };
            
            // Ticket cerrado
            const handleTicketCerrado = (data) => {
                if (data.ticket_id) {
                    moveTicketToClosed(data.ticket_id);
                }
            };
            
            // Ticket reabierto
            const handleTicketReabierto = (data) => {
                if (data.ticket_id) {
                    moveTicketToActive(data.ticket_id);
                }
            };
            
            // Actualización crítica
            const handleCriticalUpdate = (data) => {
                if (!data || !data.ticket_id) return;
                
                const estadoMap = {
                    'ticket_asignado': 'asignado',
                    'ticket_asignado_1': 'asignado',
                    'ticket_iniciado': 'en_proceso',
                    'ticket_solucionado': 'solucionado',
                    'ticket_escalado': 'escalado'
                };
                
                const action = data.action;
                
                if (action === 'ticket_cerrado') {
                    moveTicketToClosed(data.ticket_id);
                } else if (action === 'ticket_reabierto') {
                    moveTicketToActive(data.ticket_id);
                } else if (estadoMap[action]) {
                    updateTicketLocal(data.ticket_id, { estado: estadoMap[action] });
                }
                // solicitud_reapertura: ignorar, se maneja con evento específico
            };
            
            // Nuevo ticket disponible
            const handleNuevoTicketDisponible = (data) => {
                if (data.ticket) {
                    addTicketLocal(data.ticket);
                }
            };

            socket.on('ticket_created', handleTicketCreated);
            socket.on('ticket_updated', handleTicketUpdated);
            socket.on('ticket_asignado', handleTicketAsignado);
            socket.on('ticket_escalado', handleTicketEscalado);
            socket.on('ticket_cerrado', handleTicketCerrado);
            socket.on('ticket_reabierto', handleTicketReabierto);
            socket.on('nuevo_ticket_disponible', handleNuevoTicketDisponible);
            socket.on('critical_ticket_update', handleCriticalUpdate);

            return () => {
                socket.off('ticket_created', handleTicketCreated);
                socket.off('ticket_updated', handleTicketUpdated);
                socket.off('ticket_asignado', handleTicketAsignado);
                socket.off('ticket_escalado', handleTicketEscalado);
                socket.off('ticket_cerrado', handleTicketCerrado);
                socket.off('ticket_reabierto', handleTicketReabierto);
                socket.off('nuevo_ticket_disponible', handleNuevoTicketDisponible);
                socket.off('critical_ticket_update', handleCriticalUpdate);
            };
        }
    }, [store.auth.user, store.websocket.connected]);

    // Listeners para eventos HTTP (fallback)
    useEffect(() => {
        const handleSync = () => actualizarTodasLasTablas();
        
        window.addEventListener('forceUpdateAllViews', handleSync);
        window.addEventListener('sync_supervisor', handleSync);
        window.addEventListener('manualSyncTriggered', handleSync);
        window.addEventListener('totalSyncTriggered', handleSync);
        window.addEventListener('sync_tickets', handleSync);

        return () => {
            window.removeEventListener('forceUpdateAllViews', handleSync);
            window.removeEventListener('sync_supervisor', handleSync);
            window.removeEventListener('manualSyncTriggered', handleSync);
            window.removeEventListener('totalSyncTriggered', handleSync);
            window.removeEventListener('sync_tickets', handleSync);
        };
    }, []);

    return {
        moveTicketToClosed,
        moveTicketToActive
    };
}

export default useWebSocketSync;
