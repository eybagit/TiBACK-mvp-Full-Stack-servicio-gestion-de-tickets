import { tokenUtils } from '../../../store';
import { fueEscaladoPorAnalista } from '../../../utils/ticketHelpers';

/**
 * useTicketOperations - Operaciones CRUD sobre tickets
 * Incluye: asignar, cerrar, reabrir, escalar
 */
export function useTicketOperations({
    store,
    dispatch,
    tickets,
    setTickets,
    ticketsCerrados,
    setTicketsCerrados,
    setError,
    setActiveView,
    actualizarTodasLasTablas,
    emitCriticalTicketAction,
    navigate
}) {
    
    // Función para asignar ticket a analista
    const asignarTicket = async (ticketId, analistaId) => {
        try {
            const token = store.auth.token;
            const ticketActual = tickets.find(t => t.id === ticketId);
            const esReasignacion = ticketActual?.asignacion_actual?.analista != null;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/asignar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_analista: analistaId,
                    es_reasignacion: esReasignacion
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error al asignar ticket: ${errorData.message || 'Error desconocido'}`);
            }

            // Emitir acción crítica de asignación
            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, `ticket_asignado_${analistaId}`, store.auth.user);
            }

            actualizarTodasLasTablas();
        } catch (err) {
            setError(err.message);
        }
    };

    // Función para cerrar ticket
    const cerrarTicket = async (ticketId) => {
        if (!confirm('¿Estás seguro de que quieres cerrar este ticket?')) return;
        
        try {
            const token = store.auth.token;
            const ticketACerrar = tickets.find(t => t.id === ticketId);

            // Actualización optimista
            if (ticketACerrar) {
                setTickets(prev => prev.filter(t => t.id !== ticketId));
                setTicketsCerrados(prev => [{
                    ...ticketACerrar,
                    estado: 'cerrado_por_supervisor',
                    fecha_cierre: new Date().toISOString()
                }, ...prev]);
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'cerrado' })
            });

            if (!response.ok) {
                // Revertir actualización optimista
                if (ticketACerrar) {
                    setTickets(prev => [ticketACerrar, ...prev]);
                    setTicketsCerrados(prev => prev.filter(t => t.id !== ticketId));
                }
                throw new Error('Error al cerrar ticket');
            }

            // Emitir acción crítica
            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_cerrado', store.auth.user);
            }

            actualizarTodasLasTablas();
        } catch (err) {
            setError(err.message);
        }
    };

    // Función para reabrir ticket
    const reabrirTicket = async (ticketId) =>{
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'reabierto' })
            });

            if (response.ok) {
                // Emitir acción crítica
                if (store.websocket.socket) {
                    emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_reabierto', store.auth.user);
                }
                actualizarTodasLasTablas();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al reabrir ticket');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // Función para generar recomendación IA
    const generarRecomendacion = (ticket) => {
        if (!ticket || !ticket.id) {
            console.error('Se requiere un ticket válido con ID');
            return;
        }
        setActiveView(`recomendacion-${ticket.id}`);
    };

    // Funciones helper para colores y estados
    const getEstadoColor = (estado) => {
        const colores = {
            'cerrado': 'badge bg-secondary',
            'cerrado_por_supervisor': 'badge bg-info',
            'cerrado_por_cliente': 'badge bg-success'
        };
        return colores[estado] || 'badge bg-secondary';
    };

    const getPrioridadColor = (prioridad) => {
        const colores = {
            'baja': 'badge bg-success',
            'media': 'badge bg-warning',
            'alta': 'badge bg-danger',
            'critica': 'badge bg-dark'
        };
        return colores[prioridad] || 'badge bg-secondary';
    };

    // Función para determinar color del semáforo del ticket
    const getSemaforoColor = (ticket, tickets) => {
        const estado = ticket.estado?.toLowerCase();
        const prioridad = ticket.prioridad?.toLowerCase();
        
        // SOLO 6 estados oficiales: creado, en_espera, en_proceso, solucionado, cerrado, reabierto
        // Prioridad alta siempre es rojo
        if (prioridad === 'alta') return 'table-danger';
        
        // Tickets escalados (detectados por comentarios) son amarillos
        if (fueEscaladoPorAnalista(ticket)) return 'table-warning';
        
        // Estados normales
        if (estado === 'solucionado') return 'table-success';
        if (estado === 'en_proceso' || estado === 'en proceso') return 'table-info';
        if (estado === 'cerrado') return 'table-secondary';
        
        return '';
    };

    // Verificar si ticket tiene solicitud de reapertura
    const tieneSolicitudReapertura = (ticket) => {
        return ticket.estado === 'solicitud_reapertura' || 
               (ticket.comentarios && ticket.comentarios.some(c => 
                   c.texto && c.texto.toLowerCase().includes('solicitud de reapertura')
               ));
    };

    // fueEscaladoPorAnalista importado de ticketHelpers (centralizado)

    // Función para determinar acciones disponibles
    const getAvailableActions = (ticket) => {
        const actions = {
            canAssign: false,
            canClose: false,
            canReopen: false,
            canEscalate: false,
            canComment: true,
            showReassignMessage: false,
            showReopenButton: false
        };

        const tieneSolicitud = tieneSolicitudReapertura(ticket);

        switch (ticket.estado) {
            case 'en_espera':
            case 'reabierto':
            case 'creado':
            case 'sin_asignar':
                actions.canAssign = true;
                actions.showReassignMessage = ['en_espera', 'reabierto'].includes(ticket.estado);
                break;
            case 'asignado':
            case 'en_progreso':
                actions.canClose = true;
                actions.canEscalate = true;
                break;
            case 'solucionado':
                actions.canClose = true;
                actions.canReopen = true;
                actions.showReopenButton = true;
                break;
            case 'solicitud_reapertura':
                actions.canClose = true;
                actions.canReopen = true;
                actions.showReopenButton = true;
                break;
            default:
                break;
        }

        return actions;
    };

    return {
        asignarTicket,
        cerrarTicket,
        reabrirTicket,
        generarRecomendacion,
        getEstadoColor,
        getPrioridadColor,
        getSemaforoColor,
        tieneSolicitudReapertura,
        fueEscaladoPorAnalista,
        getAvailableActions
    };
}

export default useTicketOperations;
