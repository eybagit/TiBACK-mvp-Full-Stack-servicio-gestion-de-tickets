/**
 * useSupervisorData - Carga de datos y gestión de estado
 * 
 * REFACTORIZADO: Arquitectura tiback-hello
 * - Eliminados todos los useState
 * - Usa store.supervisor como fuente de verdad
 * - dispatch para modificar estado
 */

import { useEffect } from 'react';
import { supervisorActions } from '../../../store';

/**
 * useSupervisorData - Hook de datos del supervisor
 * Lee del store global y usa dispatch para cambios
 */
export function useSupervisorData({ store, dispatch }) {
    // ==============================
    // LEER DEL STORE (en lugar de useState)
    // ==============================
    const {
        tickets,
        ticketsCerrados,
        analistas,
        loading,
        loadingCerrados,
        error,
        showCerrados,
        userData,
        infoData,
        ticketsConRecomendaciones,
        expandedTickets,
        filterEstado,
        filterAsignado,
        filterPrioridad
    } = store.supervisor;

    // Combinar con datos del store global
    const analistasCombinados = store.analistas?.length > 0 ? store.analistas : analistas;
    const ticketsCerradosCombinados = store.ticketsCerrados?.length > 0 ? store.ticketsCerrados : ticketsCerrados;

    // ==============================
    // FUNCIONES DE DISPATCH (en lugar de setters)
    // ==============================
    
    // Funciones para filtros
    const setFilterEstado = (value) => dispatch({ type: 'SUPERVISOR_SET_FILTER_ESTADO', payload: value });
    const setFilterAsignado = (value) => dispatch({ type: 'SUPERVISOR_SET_FILTER_ASIGNADO', payload: value });
    const setFilterPrioridad = (value) => dispatch({ type: 'SUPERVISOR_SET_FILTER_PRIORIDAD', payload: value });
    const setShowCerrados = (value) => dispatch({ type: 'SUPERVISOR_SET_SHOW_CERRADOS', payload: value });
    const setError = (value) => dispatch({ type: 'SUPERVISOR_SET_ERROR', payload: value });
    const setInfoData = (value) => dispatch({ type: 'SUPERVISOR_SET_INFO_DATA', payload: value });

    // Toggle expansión de ticket
    const toggleTicketExpansion = (ticketId) => {
        dispatch({ type: 'SUPERVISOR_TOGGLE_EXPANDED_TICKET', payload: ticketId });
    };

    // ==============================
    // FUNCIONES ASYNC (usan supervisorActions)
    // ==============================

    // Actualizar tickets
    const actualizarTickets = async () => {
        await supervisorActions.loadTickets(dispatch, store.auth.token);
    };

    // Actualizar analistas
    const actualizarAnalistas = async () => {
        await supervisorActions.loadAnalistas(dispatch, store.auth.token);
    };

    // Cargar tickets cerrados
    const cargarTicketsCerrados = async () => {
        await supervisorActions.loadClosedTickets(dispatch, store.auth.token);
    };

    // Actualizar todas las tablas (con loading visible - para acciones manuales)
    const actualizarTodasLasTablas = async () => {
        await actualizarTickets();
        await actualizarAnalistas();
        if (showCerrados) {
            await cargarTicketsCerrados();
        }
    };

    // === SINCRONIZACIÓN SILENCIOSA (sin loading, sin flasheo) ===
    // Usada por WebSocket para background sync
    const sincronizarSilenciosamente = async () => {
        await supervisorActions.loadTicketsSilent(dispatch, store.auth.token, tickets);
        if (showCerrados) {
            await supervisorActions.loadClosedTicketsSilent(dispatch, store.auth.token, ticketsCerrados);
        }
    };

    // ==============================
    // SELECTORES (funciones puras)
    // ==============================

    // Filtrar tickets
    const getFilteredTickets = () => {
        return supervisorActions.getFilteredTickets(store.supervisor);
    };

    // Estadísticas
    const getStats = () => supervisorActions.getStats(tickets);

    // Backend request helper
    const backendRequest = async (path, options = {}) => {
        const backendBase = import.meta.env.VITE_BACKEND_URL || '';
        const candidates = [];
        if (backendBase) candidates.push(`${backendBase}${path}`);
        try { candidates.push(`${window.location.origin}${path}`); } catch (e) {}
        candidates.push(path);

        for (const url of candidates) {
            if (!url) continue;
            try {
                const resp = await fetch(url, options);
                if (resp.ok) return resp;
            } catch (err) { continue; }
        }
        throw new Error('Network request failed');
    };

    // ==============================
    // EFFECTS (cargar datos)
    // ==============================

    // Cargar datos del usuario
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            supervisorActions.loadUserData(dispatch, store.auth.token);
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user, dispatch]);

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            dispatch({ type: 'SUPERVISOR_SET_LOADING', payload: true });
            try {
                await actualizarTickets();
                await actualizarAnalistas();
            } catch (err) {
                dispatch({ type: 'SUPERVISOR_SET_ERROR', payload: err.message });
            } finally {
                dispatch({ type: 'SUPERVISOR_SET_LOADING', payload: false });
            }
        };
        
        if (store.auth.token) {
            cargarDatos();
        }
    }, [store.auth.token]);

    // ==============================
    // RETORNO (misma interfaz que antes)
    // ==============================
    return {
        // Datos (del store)
        tickets,
        ticketsCerrados,
        analistas,
        analistasCombinados,
        ticketsCerradosCombinados,
        loading,
        loadingCerrados,
        error,
        showCerrados,
        userData,
        infoData,
        ticketsConRecomendaciones,
        expandedTickets,
        filterEstado,
        filterAsignado,
        filterPrioridad,
        
        // Setters (dispatch wrappers)
        setFilterEstado,
        setFilterAsignado,
        setFilterPrioridad,
        setShowCerrados,
        setError,
        setInfoData,
        
        // Funciones
        actualizarTodasLasTablas,
        sincronizarSilenciosamente,
        cargarTicketsCerrados,
        getFilteredTickets,
        getStats,
        toggleTicketExpansion,
        backendRequest
    };
}

export default useSupervisorData;
