/**
 * @fileoverview ticketHelpers - Funciones helper centralizadas para tickets
 * 
 * Funciones compartidas entre todos los roles (cliente, analista, supervisor, admin)
 * para manejar lógica común de tickets.
 * 
 * @module utils/ticketHelpers
 */

// ============================================
// FUNCIONES DE ANALISTA
// ============================================

/**
 * Verifica si un ticket tiene un analista asignado
 * @param {Object} ticket - Objeto ticket
 * @returns {boolean} true si tiene analista asignado
 */
export const tieneAnalistaAsignado = (ticket) => {
    // PRIORIDAD 1: asignacion_actual del backend (estructura correcta)
    if (ticket.asignacion_actual?.analista) return true;
    if (ticket.asignacion_actual?.id_analista) return true;
    
    // PRIORIDAD 2: Campos directos de eventos WebSocket
    if (ticket.analista_nombre) return true;
    if (ticket.id_analista) return true;
    
    // FALLBACK: Campos legacy
    if (ticket.analista_asignado) return true;
    if (ticket.analista) return true;
    
    return false;
};

/**
 * Obtiene el nombre completo del analista asignado
 * @param {Object} ticket - Objeto ticket
 * @returns {string} Nombre completo del analista o texto por defecto
 */
export const getAnalistaAsignado = (ticket) => {
    // PRIORIDAD 1: asignacion_actual del backend
    if (ticket.asignacion_actual?.analista) {
        const analista = ticket.asignacion_actual.analista;
        return `${analista.nombre} ${analista.apellido}`;
    }
    
    // PRIORIDAD 2: analista_nombre directo (eventos WebSocket)
    if (ticket.analista_nombre) {
        return ticket.analista_nombre;
    }
    
    // FALLBACK: Otros campos
    if (ticket.analista?.nombre) {
        return `${ticket.analista.nombre} ${ticket.analista.apellido || ''}`.trim();
    }
    
    if (ticket.analista_asignado?.nombre) {
        return `${ticket.analista_asignado.nombre} ${ticket.analista_asignado.apellido || ''}`.trim();
    }
    
    return 'Analista asignado';
};

/**
 * Obtiene la fecha de asignación del analista
 * @param {Object} ticket - Objeto ticket
 * @returns {string} Fecha formateada o cadena vacía
 */
export const getFechaAsignacion = (ticket) => {
    // PRIORIDAD 1: asignacion_actual del backend
    const fecha = ticket.asignacion_actual?.fecha_asignacion || 
                 ticket.fecha_asignacion || 
                 ticket.updated_at;
    
    if (!fecha) return '';
    
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// ============================================
// FUNCIONES DE ESTADO
// ============================================

/**
 * Obtiene el color Bootstrap para un estado de ticket
 * @param {string} estado - Estado del ticket
 * @returns {string} Clase de color Bootstrap (success, warning, info, etc.)
 */
export const getEstadoColor = (estado) => {
    const estadoLower = estado?.toLowerCase().replace(/\s+/g, '_') || '';
    
    // SOLO 6 estados oficiales: creado, en_espera, en_proceso, solucionado, cerrado, reabierto
    switch (estadoLower) {
        case 'creado':
            return 'primary';
        case 'en_espera':
        case 'en espera':
            return 'info';
        case 'en_proceso':
        case 'en proceso':
            return 'warning';
        case 'solucionado':
            return 'success';
        case 'cerrado':
            return 'secondary';
        case 'reabierto':
            return 'warning';
        default:
            return 'primary';
    }
};

/**
 * Normaliza el estado del ticket (espacios → guiones bajos)
 * @param {string} estado - Estado del ticket
 * @returns {string} Estado normalizado
 */
export const normalizeEstado = (estado) => {
    if (!estado) return '';
    return estado.toLowerCase().replace(/\s+/g, '_');
};

/**
 * Obtiene el label formateado del estado
 * @param {string} estado - Estado del ticket
 * @returns {string} Label formateado para mostrar
 */
export const getEstadoLabel = (estado) => {
    if (!estado) return 'Sin estado';
    
    const estadoLower = normalizeEstado(estado);
    
    // SOLO 6 estados oficiales
    const labels = {
        'creado': 'Creado',
        'en_espera': 'En espera',
        'en_proceso': 'En proceso',
        'solucionado': 'Solucionado',
        'cerrado': 'Cerrado',
        'reabierto': 'Reabierto'
    };
    
    return labels[estadoLower] || estado;
};

// ============================================
// FUNCIONES DE PRIORIDAD
// ============================================

/**
 * Obtiene el color Bootstrap para una prioridad
 * @param {string} prioridad - Prioridad del ticket
 * @returns {string} Clase de color Bootstrap
 */
export const getPrioridadColor = (prioridad) => {
    const prioridadLower = prioridad?.toLowerCase() || '';
    
    switch (prioridadLower) {
        case 'alta':
            return 'danger';
        case 'media':
            return 'warning';
        case 'baja':
        case 'normal':
            return 'secondary';
        default:
            return 'secondary';
    }
};

/**
 * Obtiene el label formateado de la prioridad
 * @param {string} prioridad - Prioridad del ticket
 * @returns {string} Label formateado
 */
export const getPrioridadLabel = (prioridad) => {
    if (!prioridad) return 'Normal';
    
    const labels = {
        'alta': 'Alta',
        'media': 'Media',
        'baja': 'Baja',
        'normal': 'Normal'
    };
    
    return labels[prioridad.toLowerCase()] || prioridad;
};

// ============================================
// FUNCIONES DE FILTRADO POR ROL
// ============================================

/**
 * Verifica si un usuario puede ver un ticket según su rol
 * @param {Object} ticket - Objeto ticket
 * @param {Object} user - Usuario actual
 * @returns {boolean} true si el usuario puede ver el ticket
 */
export const puedeVerTicket = (ticket, user) => {
    if (!user || !user.role) return false;
    
    switch (user.role.toLowerCase()) {
        case 'cliente':
            // Cliente solo ve sus propios tickets
            return ticket.id_cliente === user.id;
            
        case 'analista':
            // Analista ve tickets asignados a él
            return ticket.asignacion_actual?.id_analista === user.id ||
                   ticket.id_analista === user.id;
            
        case 'supervisor':
        case 'administrador':
        case 'admin':
            // Supervisor y admin ven todo
            return true;
            
        default:
            return false;
    }
};

/**
 * Filtra una lista de tickets según el rol del usuario
 * @param {Array} tickets - Lista de tickets
 * @param {Object} user - Usuario actual
 * @returns {Array} Lista filtrada de tickets
 */
export const filtrarTicketsPorRol = (tickets, user) => {
    if (!Array.isArray(tickets)) return [];
    if (!user) return [];
    
    // Supervisor y admin ven todo
    if (user.role === 'supervisor' || user.role === 'administrador' || user.role === 'admin') {
        return tickets;
    }
    
    // Filtrar según rol
    return tickets.filter(ticket => puedeVerTicket(ticket, user));
};

// ============================================
// FUNCIONES DE CALIFICACIÓN
// ============================================

/**
 * Verifica si un ticket tiene calificación
 * @param {Object} ticket - Objeto ticket
 * @returns {boolean} true si tiene calificación
 */
export const tieneCalificacion = (ticket) => {
    return ticket.calificacion !== null && 
           ticket.calificacion !== undefined && 
           ticket.calificacion > 0;
};

/**
 * Obtiene la calificación del ticket
 * @param {Object} ticket - Objeto ticket
 * @returns {number|null} Calificación (1-5) o null
 */
export const getCalificacion = (ticket) => {
    return ticket.calificacion || null;
};

// ============================================
// FUNCIONES DE FECHA
// ============================================

/**
 * Formatea la fecha de creación del ticket
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatFechaCreacion = (fecha) => {
    if (!fecha) return '';
    
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Formatea la fecha de cierre del ticket
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Fecha formateada o cadena vacía
 */
export const formatFechaCierre = (fecha) => {
    if (!fecha) return '';
    
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Formatea una fecha en formato relativo (hace X tiempo)
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} Texto relativo (ej: "Hace 2 horas")
 */
export const formatFechaRelativa = (fecha) => {
    if (!fecha) return '';
    
    const ahora = new Date();
    const fechaObj = new Date(fecha);
    const diffMs = ahora - fechaObj;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    
    return formatFechaCreacion(fecha);
};

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================

export default {
    // Analista
    tieneAnalistaAsignado,
    getAnalistaAsignado,
    getFechaAsignacion,
    
    // Estado
    getEstadoColor,
    normalizeEstado,
    getEstadoLabel,
    
    // Prioridad
    getPrioridadColor,
    getPrioridadLabel,
    
    // Filtrado
    puedeVerTicket,
    filtrarTicketsPorRol,
    
    // Calificación
    tieneCalificacion,
    getCalificacion,
    
    // Fechas
    formatFechaCreacion,
    formatFechaCierre,
    formatFechaRelativa
};
