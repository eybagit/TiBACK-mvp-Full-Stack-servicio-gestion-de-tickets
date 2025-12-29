/**
 * useClienteTickets - Hook para manejar la lógica de tickets del cliente
 * Refactorizado para usar el store global (clienteSlice)
 * NO useState - arquitectura tiback-hello
 */

import { useState, useEffect } from 'react';
import { TICKET_STATES } from '../../../constants/ticketEnums';
import { normalizeFromBackend } from '../../../utils/normalize';
import { tokenUtils } from '../../../store';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import {
    tieneAnalistaAsignado,
    getAnalistaAsignado,
    getFechaAsignacion,
    getEstadoColor,
    getPrioridadColor
} from '../../../utils/ticketHelpers';

function useClienteTickets(passedStore, passedDispatch, joinTicketRoom, emitCriticalTicketAction, joinCriticalRooms, changeView) {
    const { store: globalStore, dispatch: globalDispatch } = useGlobalReducer();
    
    // Usar store y dispatch pasados o globales
    const store = passedStore || globalStore;
    const dispatch = passedDispatch || globalDispatch;
    
    // Acceso al estado del cliente desde el store global
    const clientePage = store.clientePage || {};
    
    // Estados del store
    const tickets = clientePage.tickets || [];
    const loading = clientePage.loading ?? true;
    const error = clientePage.error || '';
    const ticketsConRecomendaciones = clientePage.ticketsConRecomendaciones || [];
    const solicitudesReapertura = clientePage.solicitudesReapertura || [];
    const showTicketForm = clientePage.showTicketForm || false;
    const ticketImageUrl = clientePage.ticketImageUrl || '';
    const uploading = clientePage.uploading || false;

    // Helpers para dispatch
    const setLoading = (v) => dispatch({ type: 'CLIENTE_SET_LOADING', payload: v });
    const setError = (msg) => {
        dispatch({ type: 'CLIENTE_SET_ERROR', payload: msg });
        if (msg) setTimeout(() => dispatch({ type: 'CLIENTE_SET_ERROR', payload: '' }), 2000);
    };
    const setUploading = (v) => dispatch({ type: 'CLIENTE_SET_UPLOADING', payload: v });

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
                dispatch({ type: 'CLIENTE_SET_TICKETS', payload: ticketsData });
                console.log(`📋 Cliente - Tickets cargados: ${ticketsData.length} tickets`);

                // Inicializar solicitudes de reapertura desde los tickets
                const ticketsConSolicitud = ticketsData
                    .filter(ticket => ticket.tiene_solicitud_reapertura_pendiente === true)
                    .map(ticket => ticket.id);
                
                if (ticketsConSolicitud.length > 0) {
                    console.log(`📋 Cliente - Tickets con solicitud de reapertura: ${ticketsConSolicitud.length}`);
                    dispatch({ type: 'CLIENTE_SET_SOLICITUDES_REAPERTURA', payload: ticketsConSolicitud });
                }

                // Limpiar solicitudes de reapertura para tickets que ya NO están en estado 'solucionado'
                ticketsData.forEach(ticket => {
                    if (normalizeFromBackend(ticket.estado) !== TICKET_STATES.SOLUCIONADO && solicitudesReapertura.includes(ticket.id)) {
                        dispatch({ type: 'CLIENTE_REMOVE_SOLICITUD_REAPERTURA', payload: ticket.id });
                    }
                });
            }
        } catch (err) {
            setError("Error al actualizar la lista");
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
            dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: '' });
            dispatch({ type: 'CLIENTE_SET_SHOW_TICKET_FORM', payload: false });

            const responseData = await response.json();
            const ticketId = responseData.id;

            if (store.websocket?.socket && ticketId) {
                emitCriticalTicketAction?.(store.websocket.socket, ticketId, 'ticket_creado', store.auth.user);
            }


            await actualizarTickets();

            if (store.websocket?.socket && ticketId) {
                joinTicketRoom?.(store.websocket.socket, ticketId);
                joinCriticalRooms?.(store.websocket.socket, [ticketId], store.auth.user);
            }

            // Seleccionar visualmente el ticket recién creado
            dispatch({ type: 'CLIENTE_SET_SELECTED_TICKET_ID', payload: ticketId });
            changeView?.('tickets');
            
            // Hacer scroll al ticket después de un breve delay para que se renderice
            setTimeout(() => {
                const ticketElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
                if (ticketElement) {
                    ticketElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
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
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    estado: 'cerrado',
                    calificacion: parseInt(calificacion) 
                })
            });

            if (!response.ok) {
                throw new Error('Error al cerrar ticket');
            }

            if (store.websocket?.socket) {
                emitCriticalTicketAction?.(store.websocket.socket, ticketId, 'ticket_cerrado', store.auth.user);
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

            dispatch({ type: 'CLIENTE_ADD_SOLICITUD_REAPERTURA', payload: ticketId });

            if (store.websocket?.socket) {
                emitCriticalTicketAction?.(store.websocket.socket, ticketId, 'solicitud_reapertura', store.auth.user);
            }

            await actualizarTickets();
            alert('Solicitud de reapertura enviada. El supervisor revisará tu solicitud.');
        } catch (err) {
            setError(err.message);
            console.error('Error al solicitar reapertura:', err);
        }
    };

    // Funciones helper importadas desde ticketHelpers.js
    // getEstadoColor, getPrioridadColor, tieneAnalistaAsignado, getAnalistaAsignado, getFechaAsignacion

    // Funciones de analista ya importadas desde ticketHelpers.js
    // tieneAnalistaAsignado, getAnalistaAsignado, getFechaAsignacion

    // Funciones para imágenes del ticket
    const handleImageUpload = (imageUrl) => dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: imageUrl });
    const handleImageRemove = () => dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: '' });

    const toggleTicketForm = () => dispatch({ type: 'CLIENTE_TOGGLE_TICKET_FORM' });

    // Función para generar recomendación
    const generarRecomendacion = (ticket) => {
        changeView?.(`recomendacion-${ticket.id}`);
    };

    // Setters para compatibilidad
    const setTickets = (tOrFn) => {
        if (typeof tOrFn === 'function') {
            // CRÍTICO: Usar estado actual del store, no del closure
            // CORREGIDO: store.clientePage.tickets (no store.cliente.tickets)
            const currentTickets = store.clientePage?.tickets || [];
            const newValue = tOrFn(currentTickets);
            dispatch({ type: 'CLIENTE_SET_TICKETS', payload: newValue });
        } else {
            dispatch({ type: 'CLIENTE_SET_TICKETS', payload: tOrFn });
        }
    };
    const setTicketsConRecomendaciones = (t) => dispatch({ type: 'CLIENTE_SET_TICKETS_CON_RECOMENDACIONES', payload: Array.from(t) });
    const setSolicitudesReapertura = (sOrFn) => {
        if (typeof sOrFn === 'function') {
            // CRÍTICO: Usar estado actual del store, no del closure
            const currentSolicitudes = store.clientePage?.solicitudesReapertura || [];
            const currentSet = new Set(currentSolicitudes);
            const newSet = sOrFn(currentSet);
            const newArray = Array.from(newSet);
            dispatch({ type: 'CLIENTE_SET_SOLICITUDES_REAPERTURA', payload: newArray });
        } else {
            // sOrFn es un Set
            const newArray = Array.from(sOrFn);
            dispatch({ type: 'CLIENTE_SET_SOLICITUDES_REAPERTURA', payload: newArray });
        }
    };
    const setShowTicketForm = (v) => dispatch({ type: 'CLIENTE_SET_SHOW_TICKET_FORM', payload: v });
    const setTicketImageUrl = (v) => dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: v });

    return {
        // Estados (desde store, con Sets para compatibilidad)
        tickets, setTickets,
        loading, setLoading,
        error, setError,
        ticketsConRecomendaciones: new Set(ticketsConRecomendaciones), setTicketsConRecomendaciones,
        solicitudesReapertura: new Set(solicitudesReapertura), setSolicitudesReapertura,
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
