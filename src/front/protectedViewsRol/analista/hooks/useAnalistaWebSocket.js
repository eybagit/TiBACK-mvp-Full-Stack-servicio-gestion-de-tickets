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
    actualizarTickets
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

        const ticketIds = tickets.map(t => t.id);
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

        // Handlers
        const onSolicitudReapertura = (data) => {
            if (!data || !data.ticket_id) return;
            setTicketsSolicitudReapertura(prev => { const copy = new Set(prev); copy.add(data.ticket_id); return copy; });
            setTickets(prev => prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'solucionado' } : t));
        };

        const onTicketReabierto = (data) => {
            if (!data || !data.ticket_id) return;
            setTicketsSolicitudReapertura(prev => { const copy = new Set(prev); copy.delete(data.ticket_id); return copy; });
            setTickets(prev => prev.map(t => t.id === data.ticket_id ? { ...t, estado: data.estado || 'en_espera' } : t));
            if (data.assigned_analista_id === store.auth.user?.id) actualizarTickets();
        };

        const onTicketCerrado = (data) => {
            if (!data || !data.ticket_id) return;
            setTickets(prev => prev.filter(t => t.id !== data.ticket_id));
        };

        const onTicketAsignado = (data) => {
            if (!data || !data.ticket_id) return;
            const esParaMi = data.analista_id === store.auth.user?.id || data.id_analista === store.auth.user?.id;
            if (esParaMi) {
                actualizarTickets();
                setTimeout(() => actualizarTickets(), 300);
                setTimeout(() => actualizarTickets(), 800);
            }
        };

        const onTicketAsignadoAMi = () => {
            actualizarTickets();
            setTimeout(() => actualizarTickets(), 200);
            setTimeout(() => actualizarTickets(), 500);
        };

        const onGenericUpdate = (data) => {
            actualizarTickets();
            if (data && (data.tipo === 'asignado' || data.accion === 'asignado' || data.accion === 'reasignado')) {
                const esParaMi = data.analista_id === store.auth.user?.id || data.id_analista === store.auth.user?.id;
                if (esParaMi) {
                    setTimeout(() => actualizarTickets(), 300);
                    setTimeout(() => actualizarTickets(), 1000);
                }
            }
        };

        const onCritical = (data) => {
            if (data && data.ticket_id) {
                actualizarTickets();
                if (data.tipo === 'asignado' || data.accion === 'asignado' || data.accion === 'reasignado') {
                    const esParaMi = data.analista_id === store.auth.user?.id || data.id_analista === store.auth.user?.id;
                    if (esParaMi) {
                        setTimeout(() => actualizarTickets(), 400);
                        setTimeout(() => actualizarTickets(), 1200);
                    }
                }
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
