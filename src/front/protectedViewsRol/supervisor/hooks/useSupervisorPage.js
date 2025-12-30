/**
 * useSupervisorPage - Hook principal que orquesta los otros hooks
 * 
 * REFACTORIZADO: Arquitectura tiback-hello
 * - Eliminados todos los useState
 * - Eliminado useNavigate (usar Link declarativo)
 * - Usa store.supervisor como fuente de verdad
 * - dispatch para modificar estado
 */

import { useEffect } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { useSupervisorData } from './useSupervisorData';
import { useSupervisorActions } from './useSupervisorActions';
import { useTicketOperations } from './useTicketOperations';
import { useWebSocketSync } from './useWebSocketSync';
import { supervisorActions } from '../../../store';

/**
 * useSupervisorPage - Hook principal del supervisor
 * Orquesta los hooks de datos, operaciones y WebSocket
 */
export function useSupervisorPage() {
    const { 
        store, logout, dispatch, 
        connectWebSocket, disconnectWebSocket, 
        joinRoom, joinTicketRoom, 
        startRealtimeSync, emitCriticalTicketAction, 
        joinCriticalRooms, joinAllCriticalRooms 
    } = useGlobalReducer();

    // ==============================
    // LEER DEL STORE (en lugar de useState)
    // ==============================
    const {
        sidebarHidden,
        activeView,
        showUserDropdown,
        showInfoForm,
        isDarkMode,
        searchQuery,
        searchResults,
        showSearchResults,
        updatingInfo,
        selectedTicketImages,
        selectedImageIndex
    } = store.supervisor;

    // ==============================
    // HOOKS COMPUESTOS
    // ==============================

    // Hook de datos
    const dataHook = useSupervisorData({ store, dispatch });
    
    // Extraer funciones y estados de dataHook
    const {
        tickets,
        ticketsCerrados,
        analistas,
        analistasCombinados,
        ticketsCerradosCombinados,
        loading,
        loadingCerrados,
        error,
        showCerrados,
        setShowCerrados,
        userData,
        infoData,
        setInfoData,
        ticketsConRecomendaciones,
        expandedTickets,
        filterEstado,
        setFilterEstado,
        filterAsignado,
        setFilterAsignado,
        filterPrioridad,
        setFilterPrioridad,
        actualizarTodasLasTablas,
        cargarTicketsCerrados,
        getFilteredTickets,
        getStats,
        toggleTicketExpansion
    } = dataHook;

    // Hook de operaciones de tickets
    const operationsHook = useTicketOperations({
        store, dispatch, tickets,
        setTickets: (data) => dispatch({ type: 'SUPERVISOR_SET_TICKETS', payload: data }),
        ticketsCerrados,
        setTicketsCerrados: (data) => dispatch({ type: 'SUPERVISOR_SET_TICKETS_CERRADOS', payload: data }),
        setError: (msg) => dispatch({ type: 'SUPERVISOR_SET_ERROR', payload: msg }),
        setActiveView: (view) => dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: view }),
        actualizarTodasLasTablas,
        emitCriticalTicketAction
    });

    const {
        asignarTicket, cerrarTicket, reabrirTicket,
        generarRecomendacion, getEstadoColor, getPrioridadColor,
        getSemaforoColor, tieneSolicitudReapertura,
        fueEscaladoPorAnalista, getAvailableActions
    } = operationsHook;

    // Hook de acciones del supervisor (reasignar, aprobar reapertura, etc.)
    const actionsHook = useSupervisorActions({
        store,
        tickets,
        actualizarTickets: dataHook.actualizarTickets,
        actualizarTodasLasTablas,
        setError: (msg) => dispatch({ type: 'SUPERVISOR_SET_ERROR', payload: msg }),
        backendRequest: async (url, options) => {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${url}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${store.auth.token}`,
                    'Content-Type': 'application/json',
                    ...options?.headers
                }
            });
            return response;
        }
    });

    // Hook de WebSocket
    useWebSocketSync({
        store, connectWebSocket, disconnectWebSocket,
        joinRoom, joinTicketRoom, startRealtimeSync,
        joinCriticalRooms, joinAllCriticalRooms,
        tickets,
        setTickets: (dataOrFn) => {
            // Soportar tanto datos directos como funciones updater
            if (typeof dataOrFn === 'function') {
                // CRÍTICO: Usar estado actual del store, no del closure
                const currentTickets = store.supervisor.tickets || [];
                const newData = dataOrFn(currentTickets);
                dispatch({ type: 'SUPERVISOR_SET_TICKETS', payload: newData });
            } else {
                dispatch({ type: 'SUPERVISOR_SET_TICKETS', payload: dataOrFn });
            }
        },
        ticketsCerrados,
        setTicketsCerrados: (dataOrFn) => {
            if (typeof dataOrFn === 'function') {
                // CRÍTICO: Usar estado actual del store, no del closure
                const currentTicketsCerrados = store.supervisor.ticketsCerrados || [];
                const newData = dataOrFn(currentTicketsCerrados);
                dispatch({ type: 'SUPERVISOR_SET_TICKETS_CERRADOS', payload: newData });
            } else {
                dispatch({ type: 'SUPERVISOR_SET_TICKETS_CERRADOS', payload: dataOrFn });
            }
        },
        actualizarTodasLasTablas,
        sincronizarSilenciosamente: dataHook.sincronizarSilenciosamente
    });

    // ==============================
    // FUNCIONES UI (dispatch)
    // ==============================

    const toggleSidebar = () => dispatch({ type: 'SUPERVISOR_TOGGLE_SIDEBAR' });
    const changeView = (view) => dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: view });
    const toggleTheme = () => dispatch({ type: 'SUPERVISOR_TOGGLE_DARK_MODE' });
    const setShowUserDropdown = (value) => dispatch({ type: 'SUPERVISOR_SET_SHOW_USER_DROPDOWN', payload: value });
    const setShowInfoForm = (value) => dispatch({ type: 'SUPERVISOR_SET_SHOW_INFO_FORM', payload: value });
    const setSearchQuery = (value) => dispatch({ type: 'SUPERVISOR_SET_SEARCH_QUERY', payload: value });
    const setSearchResults = (value) => dispatch({ type: 'SUPERVISOR_SET_SEARCH_RESULTS', payload: value });
    const setShowSearchResults = (value) => dispatch({ type: 'SUPERVISOR_SET_SHOW_SEARCH_RESULTS', payload: value });
    const setSelectedTicketImages = (value) => dispatch({ type: 'SUPERVISOR_SET_SELECTED_TICKET_IMAGES', payload: value });
    const setSelectedImageIndex = (value) => dispatch({ type: 'SUPERVISOR_SET_SELECTED_IMAGE_INDEX', payload: value });

    const handleSearch = (query) => {
        supervisorActions.handleSearch(dispatch, query, tickets);
    };

    const closeSearchResults = () => {
        dispatch({ type: 'SUPERVISOR_CLEAR_SEARCH' });
    };

    const selectTicketFromSearch = (ticket) => {
        supervisorActions.selectTicketFromSearch(dispatch, ticket);
    };

    const handleInfoChange = (e) => {
        supervisorActions.handleInfoChange(dispatch, e);
    };

    // Actualizar información del perfil
    const updateInfo = async () => {
        const result = await supervisorActions.updateProfile(dispatch, store.auth.token, infoData);
        if (result.success) {
            alert('Información actualizada correctamente');
        }
        return result;
    };

    // Actualizar información (modal)
    const actualizarInformacion = async (e) => {
        e.preventDefault();
        await updateInfo();
    };

    // Escalar ticket
    const escalarTicket = async (ticketId) => {
        const result = await supervisorActions.escalateTicket(dispatch, store.auth.token, ticketId);
        if (result.success) {
            await actualizarTodasLasTablas();
        }
    };

    // Agregar comentario
    const agregarComentario = (ticketId) => {
        dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: `comentarios-${ticketId}` });
    };

    // ==============================
    // FUNCIONES DE NAVEGACIÓN ATÓMICAS (FIX para comentarios)
    // ==============================
    const openComments = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {
            console.error('Error joining ticket room:', e);
        }
        dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: `comentarios-${ticketId}` });
    };

    const openChat = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {
            console.error('Error joining ticket room:', e);
        }
        dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: `supervisor-chat-${ticketId}` });
    };

    const openVerHD = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {
            console.error('Error joining ticket room:', e);
        }
        dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: `ticket-${ticketId}` });
    };

    const openRecomendacion = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {
            console.error('Error joining ticket room:', e);
        }
        dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: `recomendacion-${ticketId}` });
    };

    const openIdentificar = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {
            console.error('Error joining ticket room:', e);
        }
        dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: `identificar-${ticketId}` });
    };

    // ==============================
    // RETORNO (misma interfaz que antes)
    // ==============================
    return {
        // Logout (NO navigate - usar Link declarativo)
        logout,
        
        // Estados UI (del store)
        sidebarHidden,
        activeView,
        setActiveView: changeView,
        showUserDropdown,
        setShowUserDropdown,
        showInfoForm,
        setShowInfoForm,
        isDarkMode,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        showSearchResults,
        setShowSearchResults,
        selectedTicketImages,
        setSelectedTicketImages,
        selectedImageIndex,
        setSelectedImageIndex,
        
        // Estados de datos (del store via dataHook)
        tickets,
        ticketsCerrados,
        analistas,
        analistasCombinados,
        ticketsCerradosCombinados,
        loading,
        loadingCerrados,
        error,
        showCerrados,
        setShowCerrados,
        userData,
        infoData,
        setInfoData,
        ticketsConRecomendaciones,
        expandedTickets,
        filterEstado,
        setFilterEstado,
        filterAsignado,
        setFilterAsignado,
        filterPrioridad,
        setFilterPrioridad,
        updatingInfo,
        
        // Funciones UI
        toggleSidebar,
        changeView,
        toggleTheme,
        handleSearch,
        selectTicketFromSearch,
        closeSearchResults,
        toggleTicketExpansion,
        handleInfoChange,
        
        // Funciones de datos
        cargarTicketsCerrados,
        actualizarTodasLasTablas,
        getFilteredTickets,
        getStats,
        
        // Funciones de operaciones
        asignarTicket,
        reasignarTicket: actionsHook.reasignarTicket,
        cerrarTicket,
        reabrirTicket,
        escalarTicket,
        agregarComentario,
        generarRecomendacion,
        getAvailableActions,
        getSemaforoColor,
        tieneSolicitudReapertura,
        fueEscaladoPorAnalista,
        getEstadoColor,
        getPrioridadColor,
        updateInfo,
        actualizarInformacion,
        
        // Funciones de navegación atómicas
        openComments,
        openChat,
        openVerHD,
        openRecomendacion,
        openIdentificar,
        
        // Computados
        filteredTickets: getFilteredTickets(),
        stats: getStats()
    };
}

export default useSupervisorPage;
