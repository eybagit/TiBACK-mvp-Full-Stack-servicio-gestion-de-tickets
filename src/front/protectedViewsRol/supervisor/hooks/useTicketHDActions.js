/**
 * useTicketHDActions - Hook para acciones del ticket en vista HD del supervisor
 * Extraído de verTicketHDsupervisor.jsx para cumplir con límite de 500 líneas
 */

/**
 * Verifica si un ticket tiene analista asignado
 */
export const tieneAnalistaAsignado = (ticket) => {
    return ticket?.asignacion_actual && ticket.asignacion_actual.analista;
};

/**
 * Obtiene el nombre completo del analista asignado
 */
export const getAnalistaAsignado = (ticket) => {
    if (tieneAnalistaAsignado(ticket)) {
        const analista = ticket.asignacion_actual.analista;
        return `${analista.nombre} ${analista.apellido}`;
    }
    return null;
};

/**
 * Obtiene el color del badge según el estado
 */
export const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
        case 'solucionado': return 'success';
        case 'en_proceso': return 'warning';
        case 'en_espera': return 'info';
        case 'escalado': return 'danger';
        case 'cerrado': return 'secondary';
        default: return 'primary';
    }
};

/**
 * Obtiene el color del badge según la prioridad
 */
export const getPrioridadColor = (prioridad) => {
    switch (prioridad?.toLowerCase()) {
        case 'critica': return 'dark';
        case 'alta': return 'danger';
        case 'media': return 'warning';
        case 'baja': return 'success';
        default: return 'secondary';
    }
};

/**
 * Asigna un analista al ticket
 */
export const asignarAnalistaAction = async (token, ticketId, analistaId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/asignar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_analista: parseInt(analistaId) })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error desconocido');
    }
    return response;
};

/**
 * Escala un ticket
 */
export const escalarTicketAction = async (token, ticketId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/escalar`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error desconocido');
    }
    return response;
};

/**
 * Cierra un ticket
 */
export const cerrarTicketAction = async (token, ticketId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cerrar`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error desconocido');
    }
    return response;
};

/**
 * Reabre un ticket - determina el nuevo estado según el estado actual
 */
export const reabrirTicketAction = async (token, ticket) => {
    let nuevoEstado = 'en_espera';

    if (ticket) {
        const estadoActual = ticket.estado.toLowerCase();
        if (estadoActual === 'solucionado' || ['creado', 'reabierto'].includes(estadoActual)) {
            nuevoEstado = 'en espera';
        } else {
            throw new Error('No se puede reabrir este ticket desde su estado actual. El ticket debe estar solucionado o cerrado.');
        }
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/estado`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error desconocido');
    }
    return response;
};
