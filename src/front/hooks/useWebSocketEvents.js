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
    
    const handleTicketUpdate = useCallback((data, eventName) => {
        // Log para debugging (solo en desarrollo)
        if (import.meta.env.DEV) {
            console.log(`[${role}] 📨 WebSocket evento recibido:`, eventName || 'unknown', data);
        }
        
        // Validar estructura de datos
        if (!validateTicketEvent(data)) {
            logValidationError('ticket_update', data, 'Invalid event structure - missing ticket_id or invalid data types');
            return;
        }
        
        // IMPORTANTE: Priorizar ticket completo sobre cambios parciales
        // Muchos eventos envían el ticket completo en data.ticket
        const updates = data.ticket || data.cambios || {};
        
        // Log de updates para debugging
        if (import.meta.env.DEV) {
            console.log(`[${role}] 🔄 Actualizando ticket ${data.ticket_id}:`, updates);
        }
        
        setTickets(prev => {
            if (!Array.isArray(prev)) return prev;
            
            const updated = prev.map(t => {
                if (t.id === data.ticket_id) {
                    const merged = { ...t, ...updates };
                    if (import.meta.env.DEV) {
                        console.log(`[${role}] ✅ Ticket ${t.id} actualizado de:`, t, 'a:', merged);
                    }
                    return merged;
                }
                return t;
            });
            
            return updated;
        });
    }, [setTickets, role]);
    
    useEffect(() => {
        if (!socket || !connected) return;
        
        // Handler para borrado masivo de tickets
        const handleTodosTicketsEliminados = (data) => {
            if (import.meta.env.DEV) {
                console.log(`[${role}] 🗑️ Todos los tickets eliminados:`, data);
            }
            // Limpiar lista de tickets
            setTickets([]);
        };
        
        // Handler para borrado individual de ticket
        const handleTicketEliminado = (data) => {
            if (import.meta.env.DEV) {
                console.log(`[${role}] 🗑️ Ticket eliminado:`, data);
            }
            // Eliminar ticket de la lista
            setTickets(prev => {
                if (!Array.isArray(prev)) return prev;
                return prev.filter(t => t.id !== data.ticket_id);
            });
        };
        
        // Eventos genéricos de actualización
        socket.on('ticket_updated', handleTicketUpdate);
        socket.on('ticket_asignado', handleTicketUpdate);
        socket.on('ticket_escalado', handleTicketUpdate);
        socket.on('ticket_reasignado', handleTicketUpdate);
        
        // Eventos de cambio de estado - TODOS los roles deben verlos
        socket.on('ticket_iniciado', handleTicketUpdate);  // Analista inicia trabajo
        socket.on('ticket_solucionado', handleTicketUpdate);  // Analista finaliza trabajo
        socket.on('ticket_cerrado', handleTicketUpdate);  // Ticket cerrado
        socket.on('ticket_reabierto', handleTicketUpdate);  // Ticket reabierto
        socket.on('notificacion_ticket_solucionado', handleTicketUpdate);  // Notificación específica cliente
        
        // Eventos de eliminación
        socket.on('ticket_eliminado', handleTicketEliminado);  // Borrado individual
        socket.on('todos_tickets_eliminados', handleTodosTicketsEliminados);  // Borrado masivo
        
        return () => {
            socket.off('ticket_updated', handleTicketUpdate);
            socket.off('ticket_asignado', handleTicketUpdate);
            socket.off('ticket_escalado', handleTicketUpdate);
            socket.off('ticket_reasignado', handleTicketUpdate);
            socket.off('ticket_iniciado', handleTicketUpdate);
            socket.off('ticket_solucionado', handleTicketUpdate);
            socket.off('ticket_cerrado', handleTicketUpdate);
            socket.off('ticket_reabierto', handleTicketUpdate);
            socket.off('notificacion_ticket_solucionado', handleTicketUpdate);
            socket.off('ticket_eliminado', handleTicketEliminado);
            socket.off('todos_tickets_eliminados', handleTodosTicketsEliminados);
        };
    }, [socket, connected, handleTicketUpdate, setTickets, role]);
    
    return { socket, connected };
}
