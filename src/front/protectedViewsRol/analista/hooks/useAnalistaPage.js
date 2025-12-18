/**
 * useAnalistaPage - Hook principal orquestador del analista
 * 
 * REFACTORIZADO: Arquitectura tiback-hello
 * - Eliminados todos los useState
 * - Eliminado useNavigate
 * - Usa store.analista como fuente de verdad
 * - dispatch para modificar estado
 */

import { useEffect } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { useAnalistaData } from './useAnalistaData';
import { useAnalistaTickets } from './useAnalistaTickets';
import { useAnalistaWebSocket } from './useAnalistaWebSocket';
import { analistaActions } from '../../../store';

/**
 * useAnalistaPage - Hook principal del analista
 * Centraliza toda la lógica de AnalistaPage para mantener el componente < 500 líneas
 */
export function useAnalistaPage() {
    const globalReducer = useGlobalReducer();
    const { 
        store, dispatch, logout,
        connectWebSocket, disconnectWebSocket,
        joinRoom, joinTicketRoom,
        joinCriticalRooms, joinAllCriticalRooms,
        emitCriticalTicketAction,
        joinChatAnalistaCliente, joinChatSupervisorAnalista
    } = globalReducer;

    // ==============================
    // LEER DEL STORE (en lugar de useState)
    // ==============================
    const {
        sidebarHidden,
        activeView,
        searchQuery,
        searchResults,
        showSearchResults,
        showUserDropdown,
        isDarkMode
    } = store.analista;

    // Hook de datos
    const dataHook = useAnalistaData({ store, dispatch });
    const {
        tickets, setTickets,
        loading, error,
        ticketsSolicitudReapertura, setTicketsSolicitudReapertura,
        expandedTickets, toggleTicketExpansion,
        modalTicketId, setModalTicketId,
        userData, showInfoForm, setShowInfoForm,
        updatingInfo, infoData, setInfoData,
        actualizarTickets, handleInfoChange, updateInfo,
        setError
    } = dataHook;

    // Hook de operaciones de tickets
    const ticketsHook = useAnalistaTickets({
        store, dispatch, setError, actualizarTickets, emitCriticalTicketAction
    });
    const { iniciarTrabajo, marcarComoResuelto, escalarTicket, getEstadoColor } = ticketsHook;

    // Hook de WebSocket
    useAnalistaWebSocket({
        store, connectWebSocket, disconnectWebSocket,
        joinRoom, joinTicketRoom, joinCriticalRooms, joinAllCriticalRooms,
        tickets, setTickets, setTicketsSolicitudReapertura, actualizarTickets
    });

    // ==============================
    // FUNCIONES UI (dispatch)
    // ==============================
    const toggleSidebar = () => dispatch({ type: 'ANALISTA_TOGGLE_SIDEBAR' });
    const setActiveView = (view) => dispatch({ type: 'ANALISTA_SET_ACTIVE_VIEW', payload: view });
    const setSearchQuery = (value) => dispatch({ type: 'ANALISTA_SET_SEARCH_QUERY', payload: value });
    const setSearchResults = (value) => dispatch({ type: 'ANALISTA_SET_SEARCH_RESULTS', payload: value });
    const setShowSearchResults = (value) => dispatch({ type: 'ANALISTA_SET_SHOW_SEARCH_RESULTS', payload: value });
    const setShowUserDropdown = (value) => dispatch({ type: 'ANALISTA_SET_SHOW_USER_DROPDOWN', payload: value });
    
    const toggleTheme = () => {
        dispatch({ type: 'ANALISTA_TOGGLE_DARK_MODE' });
    };

    const handleSearch = (query) => {
        analistaActions.handleSearch(dispatch, query, tickets);
    };

    const closeSearchResults = () => {
        dispatch({ type: 'ANALISTA_CLEAR_SEARCH' });
    };

    const selectTicketFromSearch = (ticket) => {
        analistaActions.selectTicketFromSearch(dispatch, ticket);
    };

    // Funciones para abrir vistas
    const openComments = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {}
        setModalTicketId(ticketId);
        setActiveView(`comentarios-${ticketId}`);
    };

    const openChat = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinChatAnalistaCliente) joinChatAnalistaCliente(socket, ticketId);
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {}
        setModalTicketId(ticketId);
        setActiveView(`chat-${ticketId}`);
    };

    const openSupervisorChat = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinChatSupervisorAnalista) joinChatSupervisorAnalista(socket, ticketId);
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {}
        setModalTicketId(ticketId);
        setActiveView(`supervisor-chat-${ticketId}`);
    };

    const openVerHD = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {}
        setModalTicketId(ticketId);
        setActiveView(`ticket-${ticketId}`);
    };

    // ==============================
    // EFFECTS
    // ==============================

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserDropdown && !event.target.closest('.dropdown')) {
                dispatch({ type: 'ANALISTA_SET_SHOW_USER_DROPDOWN', payload: false });
            }
            if (showSearchResults && !event.target.closest('.hyper-search')) {
                dispatch({ type: 'ANALISTA_SET_SHOW_SEARCH_RESULTS', payload: false });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserDropdown, showSearchResults, dispatch]);

    // Aplicar tema
    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-theme');
        else document.body.classList.remove('dark-theme');
    }, [isDarkMode]);

    // ==============================
    // RETORNO (misma interfaz que antes)
    // ==============================
    return {
        // Core (NO navigate - usar Link declarativo)
        store, logout,
        // Estados UI (del store)
        sidebarHidden, activeView, setActiveView,
        searchQuery, setSearchQuery,
        searchResults, setSearchResults,
        showSearchResults, setShowSearchResults,
        showUserDropdown, setShowUserDropdown,
        isDarkMode,
        // Estados datos (del dataHook)
        tickets, loading, error, setError,
        ticketsSolicitudReapertura, expandedTickets,
        modalTicketId, setModalTicketId,
        userData, showInfoForm, setShowInfoForm,
        updatingInfo, infoData, setInfoData,
        // Funciones UI
        toggleSidebar, toggleTheme,
        handleSearch, closeSearchResults, selectTicketFromSearch,
        toggleTicketExpansion,
        // Funciones de navegación
        openComments, openChat, openSupervisorChat, openVerHD,
        // Funciones de datos
        actualizarTickets, handleInfoChange, updateInfo,
        // Funciones de tickets
        iniciarTrabajo, marcarComoResuelto, escalarTicket, getEstadoColor
    };
}

export default useAnalistaPage;
