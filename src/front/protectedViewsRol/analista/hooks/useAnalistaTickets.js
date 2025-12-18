/**
 * useAnalistaTickets - Operaciones sobre tickets del analista
 */
export function useAnalistaTickets({ store, setError, actualizarTickets, emitCriticalTicketAction }) {
    
    // Iniciar trabajo en un ticket
    const iniciarTrabajo = async (ticketId) => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${store.auth.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'en_proceso' })
            });
            if (!resp.ok) throw new Error('Error iniciar trabajo');
            
            if (store.websocket.socket) {
                emitCriticalTicketAction && emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_iniciado', store.auth.user);
                store.websocket.socket.emit('ticket_iniciado', { ticket_id: ticketId, analista_id: store.auth.user.id });
                store.websocket.socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'en_proceso' });
            }
            await actualizarTickets();
        } catch (e) {
            setError(e.message);
        }
    };

    // Marcar ticket como resuelto
    const marcarComoResuelto = async (ticketId) => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${store.auth.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'solucionado' })
            });
            if (!resp.ok) throw new Error('Error marcar resuelto');
            
            if (store.websocket.socket) {
                emitCriticalTicketAction && emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_solucionado', store.auth.user);
                store.websocket.socket.emit('ticket_solucionado', { ticket_id: ticketId, analista_id: store.auth.user.id });
                store.websocket.socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'solucionado' });
                store.websocket.socket.emit('ticket_estado_changed', { ticket_id: ticketId, estado: 'solucionado' });
            }
            await actualizarTickets();
        } catch (e) {
            setError(e.message);
        }
    };

    // Escalar ticket
    const escalarTicket = async (ticketId) => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${store.auth.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'en_espera' })
            });
            if (!resp.ok) throw new Error('Error escalar');
            
            if (store.websocket.socket) {
                emitCriticalTicketAction && emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_escalado', store.auth.user);
                store.websocket.socket.emit('ticket_escalado', { ticket_id: ticketId, analista_id: store.auth.user.id, motivo: 'Escalado por analista' });
                store.websocket.socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'en_espera' });
                store.websocket.socket.emit('ticket_estado_changed', { ticket_id: ticketId, estado: 'en_espera', was_escalated: true });
            }
            await actualizarTickets();
        } catch (e) {
            setError(e.message);
        }
    };

    // Obtener color según estado
    const getEstadoColor = (estado) => {
        switch ((estado || '').toLowerCase()) {
            case 'en_espera': return 'badge bg-warning';
            case 'en_proceso': return 'badge bg-primary';
            case 'solucionado': return 'badge bg-success';
            case 'cerrado': return 'badge bg-dark';
            default: return 'badge bg-secondary';
        }
    };

    return {
        iniciarTrabajo,
        marcarComoResuelto,
        escalarTicket,
        getEstadoColor
    };
}

export default useAnalistaTickets;
