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

    // Hook de WebSocket
    useWebSocketSync({
        store, connectWebSocket, disconnectWebSocket,
        joinRoom, joinTicketRoom, startRealtimeSync,
        joinCriticalRooms, joinAllCriticalRooms,
        tickets,
        setTickets: (dataOrFn) => {
            // Soportar tanto datos directos como funciones updater
            if (typeof dataOrFn === 'function') {
                const newData = dataOrFn(tickets);
                dispatch({ type: 'SUPERVISOR_SET_TICKETS', payload: newData });
            } else {
                dispatch({ type: 'SUPERVISOR_SET_TICKETS', payload: dataOrFn });
            }
        },
        ticketsCerrados,
        setTicketsCerrados: (dataOrFn) => {
            if (typeof dataOrFn === 'function') {
                const newData = dataOrFn(ticketsCerrados);
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
        
        // Computados
        filteredTickets: getFilteredTickets(),
        stats: getStats()
    };
}

export default useSupervisorPage;
