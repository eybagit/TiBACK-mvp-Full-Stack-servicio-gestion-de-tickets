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
    actualizarTodasLasTablas
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
            
            const handleTicketUpdate = () => actualizarTodasLasTablas();
            const handleTicketCerrado = (data) => {
                moveTicketToClosed(data.ticket_id);
                actualizarTodasLasTablas();
            };
            const handleTicketReabierto = (data) => {
                moveTicketToActive(data.ticket_id);
                actualizarTodasLasTablas();
            };

            socket.on('ticket_created', handleTicketUpdate);
            socket.on('ticket_updated', handleTicketUpdate);
            socket.on('ticket_asignado', handleTicketUpdate);
            socket.on('ticket_escalado', handleTicketUpdate);
            socket.on('ticket_cerrado', handleTicketCerrado);
            socket.on('ticket_reabierto', handleTicketReabierto);
            socket.on('nuevo_ticket_disponible', handleTicketUpdate);

            return () => {
                socket.off('ticket_created', handleTicketUpdate);
                socket.off('ticket_updated', handleTicketUpdate);
                socket.off('ticket_asignado', handleTicketUpdate);
                socket.off('ticket_escalado', handleTicketUpdate);
                socket.off('ticket_cerrado', handleTicketCerrado);
                socket.off('ticket_reabierto', handleTicketReabierto);
                socket.off('nuevo_ticket_disponible', handleTicketUpdate);
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
