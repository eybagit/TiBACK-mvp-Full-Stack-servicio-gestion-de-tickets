import { useEffect, useCallback } from 'react';
import { validateTicketEvent, logValidationError } from '../utils/websocket-validators';

/**
 * Hook centralizado para eventos WebSocket
 * 
 * Eventos manejados:
 * - ticket_created: Nuevo ticket creado
 * - ticket_updated: Actualización genérica de ticket
 * - ticket_asignado: Ticket asignado a analista
 * - ticket_reasignado: Ticket reasignado a otro analista
 * - ticket_escalado: Ticket escalado a supervisor
 * - ticket_iniciado: Analista inicia trabajo
 * - ticket_solucionado: Ticket marcado como solucionado
 * - ticket_cerrado: Ticket cerrado
 * - ticket_reabierto: Ticket reabierto
 * - ticket_evaluado: Cliente evalúa ticket
 * - solicitud_reapertura: Cliente solicita reapertura
 * - nuevo_comentario: Nuevo comentario agregado
 * - ticket_eliminado: Ticket eliminado
 * - todos_tickets_eliminados: Borrado masivo
 * 
 * @param {Object} config
 * @param {'supervisor' | 'analista' | 'cliente'} config.role
 * @param {Object} config.store
 * @param {Function} config.setTickets - Función setter de tickets
 */
export function useWebSocketEvents({ role, store, setTickets }) {
    const socket = store.websocket.socket;
    const connected = store.websocket.connected;
    
    // Handler para actualización de ticket existente
    const handleTicketUpdate = useCallback((data, eventName) => {
        if (import.meta.env.DEV) {
            console.log(`[${role}] 📨 WebSocket evento recibido:`, eventName || 'unknown', data);
        }
        
        if (!validateTicketEvent(data)) {
            logValidationError('ticket_update', data, 'Invalid event structure - missing ticket_id or invalid data types');
            return;
        }
        
        // IMPORTANTE: Priorizar ticket completo sobre cambios parciales
        const updates = data.ticket || data.cambios || {};
        
        if (import.meta.env.DEV) {
            console.log(`[${role}] 🔄 Actualizando ticket ${data.ticket_id}:`, updates);
        }
        
        // FILTRO POR ROL: Analistas solo actualizan tickets que ya tienen (asignados)
        if (role === 'analista') {
            const userId = store?.auth?.user?.id;
            const ticketActualizado = data.ticket || updates;
            const esParaMi = ticketActualizado.asignacion_actual?.id_analista === userId ||
                           ticketActualizado.id_analista === userId;
            
            if (!esParaMi) {
                if (import.meta.env.DEV) {
                    console.log(`[${role}] ⏭️ Actualización de ticket ${data.ticket_id} no asignado a mí, ignorando`);
                }
                return; // No actualizar tickets no asignados
            }
        }
        
        setTickets(prev => {
            if (!Array.isArray(prev)) return prev;
            
            return prev.map(t => {
                if (t.id === data.ticket_id) {
                    const merged = { ...t, ...updates };
                    if (import.meta.env.DEV) {
                        console.log(`[${role}] ✅ Ticket ${t.id} actualizado`);
                    }
                    return merged;
                }
                return t;
            });
        });
    }, [setTickets, role, store]);
    
    // Handler para nuevo ticket creado
    const handleTicketCreated = useCallback((data) => {
        if (import.meta.env.DEV) {
            console.log(`[${role}] 🎉 Nuevo ticket creado:`, data);
        }
        
        if (!data.ticket && !data.ticket_id) {
            logValidationError('ticket_created', data, 'Missing ticket data');
            return;
        }
        
        const newTicket = data.ticket;
        if (!newTicket) return;
        
        // FILTRO POR ROL: Analistas solo ven tickets asignados a ellos
        if (role === 'analista') {
            const userId = store?.auth?.user?.id;
            const esParaMi = newTicket.asignacion_actual?.id_analista === userId ||
                           newTicket.id_analista === userId;
            
            if (!esParaMi) {
                if (import.meta.env.DEV) {
                    console.log(`[${role}] ⏭️ Ticket ${newTicket.id} no asignado a mí, ignorando`);
                }
                return; // No agregar tickets sin asignar
            }
        }
        
        setTickets(prev => {
            if (!Array.isArray(prev)) return [newTicket];
            
            // Evitar duplicados
            if (prev.some(t => t.id === newTicket.id)) {
                if (import.meta.env.DEV) {
                    console.log(`[${role}] ⚠️ Ticket ${newTicket.id} ya existe, actualizando`);
                }
                return prev.map(t => t.id === newTicket.id ? newTicket : t);
            }
            
            // Agregar al inicio
            return [newTicket, ...prev];
        });
    }, [setTickets, role, store]);
    
    // Handler para nuevo comentario
    const handleNuevoComentario = useCallback((data) => {
        if (import.meta.env.DEV) {
            console.log(`[${role}] 💬 Nuevo comentario:`, data);
        }
        
        if (!data.ticket_id) {
            logValidationError('nuevo_comentario', data, 'Missing ticket_id');
            return;
        }
        
        // Si viene ticket completo, usar handleTicketUpdate
        if (data.ticket) {
            setTickets(prev => {
                if (!Array.isArray(prev)) return prev;
                return prev.map(t => t.id === data.ticket_id ? { ...t, ...data.ticket } : t);
            });
            return;
        }
        
        // Si viene el comentario individual
        if (data.comentario) {
            setTickets(prev => {
                if (!Array.isArray(prev)) return prev;
                return prev.map(t => {
                    if (t.id === data.ticket_id) {
                        const comentariosActuales = t.comentarios || [];
                        // Evitar duplicados
                        if (comentariosActuales.some(c => c.id === data.comentario.id)) {
                            return t;
                        }
                        return {
                            ...t,
                            comentarios: [...comentariosActuales, data.comentario]
                        };
                    }
                    return t;
                });
            });
        }
    }, [setTickets, role]);
    
    // Handler para eliminación de asignación
    const handleAsignacionEliminada = useCallback((data) => {
        if (import.meta.env.DEV) {
            console.log(`[${role}] 🔓 Asignación eliminada:`, data);
        }
        
        if (!data.ticket_id) return;
        
        setTickets(prev => {
            if (!Array.isArray(prev)) return prev;
            return prev.map(t => {
                if (t.id === data.ticket_id) {
                    return {
                        ...t,
                        asignacion_actual: null,
                        id_analista: null,
                        analista_nombre: null
                    };
                }
                return t;
            });
        });
    }, [setTickets, role]);
    
    useEffect(() => {
        if (!socket || !connected) return;
        
        // Handler para borrado masivo de tickets
        const handleTodosTicketsEliminados = (data) => {
            if (import.meta.env.DEV) {
                console.log(`[${role}] 🗑️ Todos los tickets eliminados:`, data);
            }
            setTickets([]);
        };
        
        // Handler para borrado individual de ticket
        const handleTicketEliminado = (data) => {
            if (import.meta.env.DEV) {
                console.log(`[${role}] 🗑️ Ticket eliminado:`, data);
            }
            setTickets(prev => {
                if (!Array.isArray(prev)) return prev;
                return prev.filter(t => t.id !== data.ticket_id);
            });
        };
        
        // ============================================
        // EVENTOS DE CREACIÓN
        // ============================================
        socket.on('ticket_created', handleTicketCreated);
        
        // ============================================
        // EVENTOS DE ACTUALIZACIÓN
        // ============================================
        socket.on('ticket_updated', handleTicketUpdate);
        socket.on('ticket_asignado', handleTicketUpdate);
        socket.on('ticket_escalado', handleTicketUpdate);
        socket.on('ticket_reasignado', handleTicketUpdate);
        socket.on('asignacion_eliminada', handleAsignacionEliminada);
        
        // ============================================
        // EVENTOS DE CAMBIO DE ESTADO
        // ============================================
        socket.on('ticket_iniciado', handleTicketUpdate);
        socket.on('ticket_solucionado', handleTicketUpdate);
        socket.on('ticket_cerrado', handleTicketUpdate);
        socket.on('ticket_reabierto', handleTicketUpdate);
        socket.on('ticket_evaluado', handleTicketUpdate);
        socket.on('solicitud_reapertura', handleTicketUpdate);
        socket.on('notificacion_ticket_solucionado', handleTicketUpdate);
        
        // ============================================
        // EVENTOS DE COMENTARIOS
        // ============================================
        socket.on('nuevo_comentario', handleNuevoComentario);
        
        // ============================================
        // EVENTOS DE ELIMINACIÓN
        // ============================================
        socket.on('ticket_eliminado', handleTicketEliminado);
        socket.on('todos_tickets_eliminados', handleTodosTicketsEliminados);
        
        return () => {
            // Creación
            socket.off('ticket_created', handleTicketCreated);
            
            // Actualización
            socket.off('ticket_updated', handleTicketUpdate);
            socket.off('ticket_asignado', handleTicketUpdate);
            socket.off('ticket_escalado', handleTicketUpdate);
            socket.off('ticket_reasignado', handleTicketUpdate);
            socket.off('asignacion_eliminada', handleAsignacionEliminada);
            
            // Cambio de estado
            socket.off('ticket_iniciado', handleTicketUpdate);
            socket.off('ticket_solucionado', handleTicketUpdate);
            socket.off('ticket_cerrado', handleTicketUpdate);
            socket.off('ticket_reabierto', handleTicketUpdate);
            socket.off('ticket_evaluado', handleTicketUpdate);
            socket.off('solicitud_reapertura', handleTicketUpdate);
            socket.off('notificacion_ticket_solucionado', handleTicketUpdate);
            
            // Comentarios
            socket.off('nuevo_comentario', handleNuevoComentario);
            
            // Eliminación
            socket.off('ticket_eliminado', handleTicketEliminado);
            socket.off('todos_tickets_eliminados', handleTodosTicketsEliminados);
        };
    }, [socket, connected, handleTicketUpdate, handleTicketCreated, handleNuevoComentario, handleAsignacionEliminada, setTickets, role]);
    
    return { socket, connected };
}

