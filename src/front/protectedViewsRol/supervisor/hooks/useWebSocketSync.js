/**
 * @fileoverview useWebSocketSync - Hook de WebSocket para Supervisor
 * 
 * Maneja la conexión WebSocket, eventos de tickets y sincronización
 * en tiempo real para el rol de Supervisor.
 * 
 * @module protectedViewsRol/supervisor/hooks/useWebSocketSync
 */

import { useEffect } from 'react';
import { tokenUtils } from '../../../store';
import { useWebSocketEvents } from '../../../hooks/useWebSocketEvents';

/**
 * @typedef {Object} Ticket
 * @property {number} id - ID único del ticket
 * @property {string} titulo - Título del ticket
 * @property {string} descripcion - Descripción del problema
 * @property {string} estado - Estado actual (creado, asignado, en_proceso, etc.)
 * @property {string} prioridad - Prioridad (alta, media, baja)
 * @property {number} id_cliente - ID del cliente
 * @property {number} [id_analista] - ID del analista asignado
 * @property {string} fecha_creacion - Fecha de creación ISO
 * @property {string} [fecha_cierre] - Fecha de cierre ISO
 */

/**
 * @typedef {Object} TicketWebSocketEvent
 * @property {number} ticket_id - ID del ticket afectado
 * @property {Ticket} [ticket] - Ticket completo (cuando el backend lo envía)
 * @property {string} [action] - Acción realizada
 * @property {Object} [cambios] - Cambios específicos
 * @property {number} [analista_id] - ID del analista (en asignaciones)
 */

/**
 * @typedef {Object} UseWebSocketSyncConfig
 * @property {Object} store - Store global de la aplicación
 * @property {Function} connectWebSocket - Función para conectar WebSocket
 * @property {Function} disconnectWebSocket - Función para desconectar WebSocket
 * @property {Function} joinRoom - Función para unirse a una room
 * @property {Function} joinTicketRoom - Función para unirse a room de ticket
 * @property {Function} startRealtimeSync - Función para iniciar sincronización
 * @property {Function} joinCriticalRooms - Función para unirse a rooms críticas
 * @property {Function} joinAllCriticalRooms - Función para unirse a todas las rooms
 * @property {Ticket[]} tickets - Lista de tickets activos
 * @property {Function} setTickets - Setter para tickets
 * @property {Ticket[]} ticketsCerrados - Lista de tickets cerrados
 * @property {Function} setTicketsCerrados - Setter para tickets cerrados
 * @property {Function} actualizarTodasLasTablas - Función para refrescar datos
 * @property {Function} [sincronizarSilenciosamente] - Sincronización silenciosa
 */

/**
 * @typedef {Object} UseWebSocketSyncReturn
 * @property {Function} moveTicketToClosed - Mover ticket a cerrados
 * @property {Function} moveTicketToActive - Mover ticket a activos
 */

/**
 * Hook para manejar WebSocket y sincronización en tiempo real del Supervisor.
 * 
 * Responsabilidades:
 * - Conectar/desconectar WebSocket
 * - Escuchar eventos de tickets (creado, asignado, escalado, etc.)
 * - Actualizar estado local de tickets
 * - Mover tickets entre listas activos/cerrados
 * 
 * @param {UseWebSocketSyncConfig} config - Configuración del hook
 * @returns {UseWebSocketSyncReturn} Funciones para mover tickets
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
    
    /**
     * Mover ticket de activos a cerrados
     * @param {number} ticketId - ID del ticket a mover
     */
    const moveTicketToClosed = (ticketId) => {
        // CRÍTICO: Usar estado actual del store, no del closure
        const currentTickets = store.supervisor.tickets || [];
        const ticket = currentTickets.find(t => t.id === ticketId);
        if (ticket) {
            setTickets(prev => {
                if (!Array.isArray(prev)) return prev;
                return prev.filter(t => t.id !== ticketId);
            });
            setTicketsCerrados(prev => {
                if (!Array.isArray(prev)) return [{...ticket, estado: 'cerrado_por_supervisor', fecha_cierre: new Date().toISOString()}];
                return [{
                    ...ticket,
                    estado: 'cerrado_por_supervisor',
                    fecha_cierre: new Date().toISOString()
                }, ...prev];
            });
        }
    };

    /**
     * Mover ticket de cerrados a activos
     * @param {number} ticketId - ID del ticket a mover
     */
    const moveTicketToActive = (ticketId) => {
        // CRÍTICO: Usar estado actual del store, no del closure
        const currentTicketsCerrados = store.supervisor.ticketsCerrados || [];
        const ticket = currentTicketsCerrados.find(t => t.id === ticketId);
        if (ticket) {
            let nuevoEstado = 'en_espera';
            if (ticket.estado === 'solucionado') nuevoEstado = 'reabierto';
            
            setTicketsCerrados(prev => {
                if (!Array.isArray(prev)) return prev;
                return prev.filter(t => t.id !== ticketId);
            });
            setTickets(prev => {
                if (!Array.isArray(prev)) return [{...ticket, estado: nuevoEstado, fecha_cierre: null, asignacion_actual: null}];
                return [{
                    ...ticket,
                    estado: nuevoEstado,
                    fecha_cierre: null,
                    asignacion_actual: null
                }, ...prev];
            });
        }
    };

    // Conectar WebSocket cuando usuario está autenticado
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

    // Hook centralizado para eventos WebSocket comunes
    useWebSocketEvents({
        role: 'supervisor',
        store,
        setTickets
    });

    // Configurar listeners de eventos WebSocket
    useEffect(() => {
        if (store.auth.user && store.websocket.connected && store.websocket.socket) {
            // SIMPLIFICADO: Solo global_tickets, eliminadas todas las rooms específicas
            
            startRealtimeSync({
                syncTypes: ['tickets', 'comentarios', 'asignaciones', 'chats'],
                onSyncTriggered: (data) => {
                    if (data.type === 'tickets' || data.priority === 'critical') {
                        actualizarTodasLasTablas();
                    }
                }
            });

            const socket = store.websocket.socket;
            
            // === HANDLERS ESPECÍFICOS DE SUPERVISOR ===
            
            /** @param {TicketWebSocketEvent} data */
            const handleTicketCreated = (data) => {
                console.log('🎉 [SUPERVISOR] Evento ticket_created recibido:', data);
                
                if (data.ticket) {
                    setTickets(prev => {
                        if (!Array.isArray(prev)) return [data.ticket];
                        // Evitar duplicados: solo agregar si no existe
                        const exists = prev.some(t => t.id === data.ticket.id);
                        if (exists) {
                            console.log('⚠️ Ticket ya existe, actualizando:', data.ticket.id);
                            return prev.map(t => t.id === data.ticket.id ? data.ticket : t);
                        }
                        console.log('✅ Ticket nuevo agregado:', data.ticket.id);
                        return [data.ticket, ...prev];
                    });
                } else {
                    console.warn('❌ Evento ticket_created sin ticket:', data);
                }
            };
            
            /** @param {TicketWebSocketEvent} data */
            const handleTicketCerrado = (data) => {
                if (data.ticket_id) {
                    moveTicketToClosed(data.ticket_id);
                }
            };
            
            /** @param {TicketWebSocketEvent} data */
            const handleTicketReabierto = (data) => {
                if (data.ticket_id) {
                    moveTicketToActive(data.ticket_id);
                }
            };
            
            /** @param {TicketWebSocketEvent} data */
            const handleCriticalUpdate = (data) => {
                if (!data || !data.ticket_id) return;
                
                const action = data.action;
                
                if (action === 'ticket_cerrado') {
                    moveTicketToClosed(data.ticket_id);
                } else if (action === 'ticket_reabierto') {
                    moveTicketToActive(data.ticket_id);
                }
            };
            
            /** @param {TicketWebSocketEvent} data */
            const handleNuevoTicketDisponible = (data) => {
                if (data.ticket) {
                    setTickets(prev => {
                        if (!Array.isArray(prev)) return [data.ticket];
                        // Evitar duplicados
                        const exists = prev.some(t => t.id === data.ticket.id);
                        if (exists) {
                            return prev.map(t => t.id === data.ticket.id ? data.ticket : t);
                        }
                        return [data.ticket, ...prev];
                    });
                }
            };
            
            /** 
             * Handler para ticket escalado - agregar ticket si no existe
             * @param {TicketWebSocketEvent} data 
             */
            const handleTicketEscalado = (data) => {
                if (data.ticket) {
                    setTickets(prev => {
                        if (!Array.isArray(prev)) return [data.ticket];
                        // Si el ticket no existe en la lista, agregarlo
                        const exists = prev.some(t => t.id === data.ticket.id);
                        if (!exists) {
                            return [data.ticket, ...prev];
                        }
                        // Si ya existe, solo actualizarlo (el hook centralizado ya lo hace)
                        return prev;
                    });
                }
            };

            /**
             * Handler para ticket evaluado - actualizar calificación
             * @param {TicketWebSocketEvent} data 
             */
            const handleTicketEvaluado = (data) => {
                if (!data || !data.ticket_id) return;
                
                console.log('⭐ [SUPERVISOR] Evento ticket_evaluado recibido:', data);
                
                setTickets(prev => {
                    if (!Array.isArray(prev)) return prev;
                    return prev.map(t => 
                        t.id === data.ticket_id 
                            ? { 
                                ...t, 
                                calificacion: data.calificacion,
                                comentario_evaluacion: data.comentario,
                                ...(data.ticket || {})
                              }
                            : t
                    );
                });
                
                // También actualizar en tickets cerrados
                setTicketsCerrados(prev => {
                    if (!Array.isArray(prev)) return prev;
                    return prev.map(t => 
                        t.id === data.ticket_id 
                            ? { 
                                ...t, 
                                calificacion: data.calificacion,
                                comentario_evaluacion: data.comentario,
                                ...(data.ticket || {})
                              }
                            : t
                    );
                });
            };

            // Registrar handlers específicos de supervisor
            socket.on('ticket_created', handleTicketCreated);
            socket.on('ticket_cerrado', handleTicketCerrado);
            socket.on('ticket_reabierto', handleTicketReabierto);
            socket.on('nuevo_ticket_disponible', handleNuevoTicketDisponible);
            socket.on('ticket_escalado', handleTicketEscalado);
            socket.on('ticket_evaluado', handleTicketEvaluado);
            socket.on('critical_ticket_update', handleCriticalUpdate);

            // Cleanup: remover listeners
            return () => {
                socket.off('ticket_created', handleTicketCreated);
                socket.off('ticket_cerrado', handleTicketCerrado);
                socket.off('ticket_reabierto', handleTicketReabierto);
                socket.off('nuevo_ticket_disponible', handleNuevoTicketDisponible);
                socket.off('ticket_escalado', handleTicketEscalado);
                socket.off('ticket_evaluado', handleTicketEvaluado);
                socket.off('critical_ticket_update', handleCriticalUpdate);
            };
        }
    }, [store.auth.user, store.websocket.connected]);

    // Listeners para eventos HTTP (fallback cuando WebSocket falla)
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
