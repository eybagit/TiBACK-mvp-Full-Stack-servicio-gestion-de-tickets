/**
 * useAnalistaData - Estados y carga de datos del analista
 * 
 * REFACTORIZADO: Arquitectura tiback-hello
 * - Eliminados todos los useState
 * - Usa store.analista como fuente de verdad
 * - dispatch para modificar estado
 */

import { useEffect } from 'react';
import { analistaActions } from '../../../store';

/**
 * useAnalistaData - Hook de datos del analista
 * Lee del store global y usa dispatch para cambios
 */
export function useAnalistaData({ store, dispatch }) {
    // ==============================
    // LEER DEL STORE (en lugar de useState)
    // ==============================
    const {
        tickets,
        loading,
        error,
        ticketsSolicitudReapertura,
        expandedTickets,
        modalTicketId,
        userData,
        showInfoForm,
        updatingInfo,
        infoData
    } = store.analista;

    // ==============================
    // FUNCIONES DE DISPATCH (en lugar de setters)
    // ==============================
    
    const setError = (value) => dispatch({ type: 'ANALISTA_SET_ERROR', payload: value });
    const setTicketsSolicitudReapertura = (value) => {
        if (typeof value === 'function') {
            // Si es una función, ejecutarla con el estado actual
            const currentSet = store.analista.ticketsSolicitudReapertura;
            const newValue = value(currentSet);
            dispatch({ type: 'ANALISTA_SET_SOLICITUDES_REAPERTURA', payload: Array.from(newValue) });
        } else if (value instanceof Set) {
            dispatch({ type: 'ANALISTA_SET_SOLICITUDES_REAPERTURA', payload: Array.from(value) });
        } else {
            dispatch({ type: 'ANALISTA_SET_SOLICITUDES_REAPERTURA', payload: Array.isArray(value) ? value : [] });
        }
    };
    const setModalTicketId = (value) => dispatch({ type: 'ANALISTA_SET_MODAL_TICKET_ID', payload: value });
    const setShowInfoForm = (value) => dispatch({ type: 'ANALISTA_SET_SHOW_INFO_FORM', payload: value });
    const setInfoData = (value) => dispatch({ type: 'ANALISTA_SET_INFO_DATA', payload: value });
    const setTickets = (valueOrFn) => {
        if (typeof valueOrFn === 'function') {
            const newValue = valueOrFn(tickets);
            dispatch({ type: 'ANALISTA_SET_TICKETS', payload: newValue });
        } else {
            dispatch({ type: 'ANALISTA_SET_TICKETS', payload: valueOrFn });
        }
    };

    // Toggle expansión de ticket
    const toggleTicketExpansion = (ticketId) => {
        dispatch({ type: 'ANALISTA_TOGGLE_EXPANDED_TICKET', payload: ticketId });
    };

    // ==============================
    // FUNCIONES ASYNC (usan analistaActions)
    // ==============================

    // Actualizar lista de tickets (con loading visible)
    const actualizarTickets = async () => {
        await analistaActions.loadTickets(dispatch, store.auth.token);
    };

    // Sincronización silenciosa (sin loading, sin flasheo)
    const sincronizarSilenciosamente = async () => {
        await analistaActions.loadTicketsSilent(dispatch, store.auth.token, tickets);
    };

    // Manejar cambios en formulario
    const handleInfoChange = (e) => {
        analistaActions.handleInfoChange(dispatch, e);
    };

    // Actualizar información del analista
    const updateInfo = async () => {
        const result = await analistaActions.updateProfile(dispatch, store.auth.token, infoData);
        if (result.success) {
            alert('Información actualizada exitosamente');
        }
        return result;
    };

    // ==============================
    // EFFECTS (cargar datos)
    // ==============================

    // Cargar datos iniciales
    useEffect(() => {
        const load = async () => {
            dispatch({ type: 'ANALISTA_SET_LOADING', payload: true });
            await actualizarTickets();
            dispatch({ type: 'ANALISTA_SET_LOADING', payload: false });
        };
        if (store.auth.token) {
            load();
        }
    }, [store.auth.token]);

    // Cargar datos del usuario
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token) {
            analistaActions.loadUserData(dispatch, store.auth.token);
        }
    }, [store.auth.isAuthenticated, store.auth.token, dispatch]);

    // ==============================
    // RETORNO (misma interfaz que antes)
    // ==============================
    return {
        // Datos (del store)
        tickets,
        loading,
        error,
        ticketsSolicitudReapertura,
        expandedTickets,
        modalTicketId,
        userData,
        showInfoForm,
        updatingInfo,
        infoData,
        
        // Setters (dispatch wrappers)
        setTickets,
        setError,
        setTicketsSolicitudReapertura,
        setModalTicketId,
        setShowInfoForm,
        setInfoData,
        
        // Funciones
        toggleTicketExpansion,
        actualizarTickets,
        sincronizarSilenciosamente,
        handleInfoChange,
        updateInfo
    };
}

export default useAnalistaData;
