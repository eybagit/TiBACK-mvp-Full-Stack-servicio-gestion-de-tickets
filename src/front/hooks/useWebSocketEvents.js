import { useEffect, useCallback } from 'react';
import { validateTicketEvent, logValidationError } from '../utils/websocket-validators';

/**
 * Hook centralizado para eventos WebSocket
 * @param {Object} config
 * @param {'supervisor' | 'analista' | 'cliente'} config.role
 * @param {Object} config.store
 * @param {Function} config.setTickets - Función setter de tickets
 */
export function useWebSocketEvents({ role, store, setTickets }) {
    const socket = store.websocket.socket;
    const connected = store.websocket.connected;
    
    const getTickets = useCallback(() => {
        switch (role) {
            case 'supervisor': return store.supervisor.tickets || [];
            case 'analista': return store.analista.tickets || [];
            case 'cliente': return store.cliente.tickets || [];
            default: return [];
        }
    }, [role, store]);
    
    const handleTicketUpdate = useCallback((data) => {
        // Validar estructura de datos
        if (!validateTicketEvent(data)) {
            logValidationError('ticket_update', data, 'Invalid event structure - missing ticket_id or invalid data types');
            return;
        }
        
        // Usar ticket completo si viene, sino usar cambios
        const updates = data.ticket || data.cambios || {};
        
        setTickets(prev => {
            if (!Array.isArray(prev)) return prev;
            return prev.map(t => 
                t.id === data.ticket_id ? { ...t, ...updates } : t
            );
        });
    }, [setTickets]);
    
    useEffect(() => {
        if (!socket || !connected) return;
        
        socket.on('ticket_updated', handleTicketUpdate);
        socket.on('ticket_asignado', handleTicketUpdate);
        socket.on('ticket_escalado', handleTicketUpdate);
        socket.on('ticket_reasignado', handleTicketUpdate);
        
        return () => {
            socket.off('ticket_updated', handleTicketUpdate);
            socket.off('ticket_asignado', handleTicketUpdate);
            socket.off('ticket_escalado', handleTicketUpdate);
            socket.off('ticket_reasignado', handleTicketUpdate);
        };
    }, [socket, connected, handleTicketUpdate]);
    
    return { socket, connected };
}
