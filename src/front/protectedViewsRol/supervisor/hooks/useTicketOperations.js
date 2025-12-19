import { tokenUtils } from '../../../store';

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
    const getSemaforoColor = (ticket, allTickets) => {
        if (ticket.estado === 'escalado') return 'table-danger';
        if (ticket.prioridad === 'critica' || ticket.prioridad === 'alta') return 'table-warning';
        return 'table-success';
    };

    // Verificar si ticket tiene solicitud de reapertura
    const tieneSolicitudReapertura = (ticket) => {
        return ticket.estado === 'solicitud_reapertura' || 
               (ticket.comentarios && ticket.comentarios.some(c => 
                   c.texto && c.texto.toLowerCase().includes('solicitud de reapertura')
               ));
    };

    // Verificar si fue escalado por analista
    const fueEscaladoPorAnalista = (ticket) => {
        if (!ticket.comentarios || !Array.isArray(ticket.comentarios)) return false;
        const tieneComentarioEscalacion = ticket.comentarios.some(c =>
            c.texto && (c.texto.toLowerCase().includes('escalado') || c.texto.toLowerCase().includes('escalación'))
        );
        return ticket.estado === 'en_espera' && tieneComentarioEscalacion && !ticket.asignacion_actual?.analista;
    };

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
            case 'escalado':
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
