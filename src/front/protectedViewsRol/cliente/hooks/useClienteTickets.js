import { useState, useEffect } from 'react';
import { tokenUtils } from '../../../store';

/**
 * useClienteTickets - Hook para manejar la lógica de tickets del cliente
 * Incluye: CRUD, estados, utilidades de tickets
 */
function useClienteTickets(store, dispatch, joinTicketRoom, emitCriticalTicketAction, joinCriticalRooms, changeView) {
    // Estados de tickets
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ticketsConRecomendaciones, setTicketsConRecomendaciones] = useState(new Set());
    const [solicitudesReapertura, setSolicitudesReapertura] = useState(new Set());
    
    // Estados para formulario de tickets
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [ticketImageUrl, setTicketImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Función helper para actualizar tickets sin recargar la página
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente?t=${Date.now()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (ticketsResponse.ok) {
                const ticketsData = await ticketsResponse.json();
                setTickets(ticketsData);
                console.log(`📋 Cliente - Tickets cargados: ${ticketsData.length} tickets`);

                // Limpiar solicitudes de reapertura para tickets que ya NO están en estado 'solucionado'
                setSolicitudesReapertura(prev => {
                    const newSet = new Set(prev);
                    ticketsData.forEach(ticket => {
                        if (ticket.estado && ticket.estado.toLowerCase() !== 'solucionado' && newSet.has(ticket.id)) {
                            newSet.delete(ticket.id);
                        }
                    });
                    const ticketIds = new Set(ticketsData.map(t => t.id));
                    Array.from(newSet).forEach(ticketId => {
                        if (!ticketIds.has(ticketId)) {
                            newSet.delete(ticketId);
                        }
                    });
                    return newSet;
                });
            }
        } catch (err) {
            setError("Error al actualizar la lista");
            setTimeout(() => setError(""), 2000);
            console.error('Error al actualizar tickets:', err);
        }
    };

    // Función para crear ticket
    const crearTicket = async (e) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.target);
        const ticketData = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            prioridad: formData.get('prioridad'),
            url_imagen: ticketImageUrl
        };
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticketData)
            });
            if (!response.ok) {
                throw new Error('Error al crear ticket');
            }

            e.target.reset();
            setTicketImageUrl('');
            setShowTicketForm(false);

            const responseData = await response.json();
            const ticketId = responseData.id;

            if (store.websocket.socket && ticketId) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_creado', store.auth.user);
            }

            await actualizarTickets();

            if (store.websocket.socket && ticketId) {
                joinTicketRoom(store.websocket.socket, ticketId);
                joinCriticalRooms(store.websocket.socket, [ticketId], store.auth.user);
            }

            changeView('tickets');
        } catch (err) {
            setError(err.message);
            console.error('Error al crear ticket:', err);
        } finally {
            setUploading(false);
        }
    };

    // Función para cerrar ticket
    const cerrarTicket = async (ticketId) => {
        const calificacion = prompt('Por favor califica el servicio (1-5):');
        if (!calificacion || isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
            alert('Por favor ingresa una calificación válida entre 1 y 5');
            return;
        }

        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cerrar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ calificacion: parseInt(calificacion) })
            });

            if (!response.ok) {
                throw new Error('Error al cerrar ticket');
            }

            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_cerrado', store.auth.user);
            }

            await actualizarTickets();
        } catch (err) {
            setError(err.message);
            console.error('Error al cerrar ticket:', err);
        }
    };

    // Función para solicitar reapertura
    const solicitarReapertura = async (ticketId) => {
        const motivo = prompt('Por favor indica el motivo de la reapertura:');
        if (!motivo || motivo.trim() === '') {
            alert('Debes indicar un motivo para solicitar la reapertura');
            return;
        }

        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/solicitar-reapertura`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ motivo })
            });

            if (!response.ok) {
                throw new Error('Error al solicitar reapertura');
            }

            setSolicitudesReapertura(prev => {
                const newSet = new Set(prev);
                newSet.add(ticketId);
                return newSet;
            });

            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, 'solicitud_reapertura', store.auth.user);
            }

            await actualizarTickets();
            alert('Solicitud de reapertura enviada. El supervisor revisará tu solicitud.');
        } catch (err) {
            setError(err.message);
            console.error('Error al solicitar reapertura:', err);
        }
    };

    // Funciones helper para estados de tickets
    const getEstadoColor = (estado) => {
        const estadoLower = estado?.toLowerCase() || '';
        switch (estadoLower) {
            case 'solucionado': return 'success';
            case 'en_proceso': return 'warning';
            case 'en_espera': return 'info';
            case 'cerrado': return 'secondary';
            case 'escalado': return 'danger';
            default: return 'primary';
        }
    };

    const getPrioridadColor = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case 'alta': return 'danger';
            case 'media': return 'warning';
            default: return 'secondary';
        }
    };

    // Funciones para manejar analista
    const tieneAnalistaAsignado = (ticket) => {
        return ticket.analista_asignado || ticket.analista_id || ticket.analista;
    };

    const getAnalistaAsignado = (ticket) => {
        if (ticket.analista_nombre) return ticket.analista_nombre;
        if (ticket.analista?.nombre) return ticket.analista.nombre;
        if (ticket.analista_asignado?.nombre) return ticket.analista_asignado.nombre;
        return 'Analista asignado';
    };

    const getFechaAsignacion = (ticket) => {
        const fecha = ticket.fecha_asignacion || ticket.updated_at;
        if (!fecha) return '';
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Funciones para imágenes del ticket
    const handleImageUpload = (imageUrl) => {
        setTicketImageUrl(imageUrl);
    };

    const handleImageRemove = () => {
        setTicketImageUrl('');
    };

    const toggleTicketForm = () => {
        setShowTicketForm(!showTicketForm);
        if (showTicketForm) {
            setTicketImageUrl('');
        }
    };

    // Función para generar recomendación
    const generarRecomendacion = (ticket) => {
        changeView(`recomendacion-${ticket.id}`);
    };

    return {
        // Estados
        tickets, setTickets,
        loading, setLoading,
        error, setError,
        ticketsConRecomendaciones, setTicketsConRecomendaciones,
        solicitudesReapertura, setSolicitudesReapertura,
        showTicketForm, setShowTicketForm,
        ticketImageUrl, setTicketImageUrl,
        uploading, setUploading,
        
        // Funciones CRUD
        actualizarTickets,
        crearTicket,
        cerrarTicket,
        solicitarReapertura,
        
        // Helpers
        getEstadoColor, getPrioridadColor,
        tieneAnalistaAsignado, getAnalistaAsignado, getFechaAsignacion,
        
        // Imágenes
        handleImageUpload, handleImageRemove,
        toggleTicketForm,
        generarRecomendacion
    };
}

export default useClienteTickets;
