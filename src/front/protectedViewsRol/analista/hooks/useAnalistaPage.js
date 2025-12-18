import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { useAnalistaData } from './useAnalistaData';
import { useAnalistaTickets } from './useAnalistaTickets';
import { useAnalistaWebSocket } from './useAnalistaWebSocket';

/**
 * useAnalistaPage - Hook principal orquestador del analista
 * Centraliza toda la lógica de AnalistaPage para mantener el componente < 500 líneas
 */
export function useAnalistaPage() {
    const navigate = useNavigate();
    const globalReducer = useGlobalReducer();
    const { 
        store, dispatch, logout,
        connectWebSocket, disconnectWebSocket,
        joinRoom, joinTicketRoom,
        joinCriticalRooms, joinAllCriticalRooms,
        emitCriticalTicketAction,
        joinChatAnalistaCliente, joinChatSupervisorAnalista
    } = globalReducer;

    // Estados UI
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Hook de datos
    const dataHook = useAnalistaData({ store, dispatch });
    const {
        tickets, setTickets,
        loading, error, setError,
        ticketsSolicitudReapertura, setTicketsSolicitudReapertura,
        expandedTickets, toggleTicketExpansion,
        modalTicketId, setModalTicketId,
        userData, showInfoForm, setShowInfoForm,
        updatingInfo, infoData, setInfoData,
        actualizarTickets, handleInfoChange, updateInfo
    } = dataHook;

    // Hook de operaciones de tickets
    const ticketsHook = useAnalistaTickets({
        store, setError, actualizarTickets, emitCriticalTicketAction
    });
    const { iniciarTrabajo, marcarComoResuelto, escalarTicket, getEstadoColor } = ticketsHook;

    // Hook de WebSocket
    useAnalistaWebSocket({
        store, connectWebSocket, disconnectWebSocket,
        joinRoom, joinTicketRoom, joinCriticalRooms, joinAllCriticalRooms,
        tickets, setTickets, setTicketsSolicitudReapertura, actualizarTickets
    });

    // Funciones UI
    const toggleSidebar = () => setSidebarHidden(!sidebarHidden);
    
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-theme');
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }
        const filtered = tickets.filter(ticket =>
            ticket.titulo.toLowerCase().includes(query.toLowerCase()) ||
            ticket.descripcion.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
        setShowSearchResults(filtered.length > 0);
    };

    const closeSearchResults = () => setShowSearchResults(false);

    const selectTicketFromSearch = (ticket) => {
        setActiveView(`ticket-${ticket.id}`);
        closeSearchResults();
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

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserDropdown && !event.target.closest('.dropdown')) {
                setShowUserDropdown(false);
            }
            if (showSearchResults && !event.target.closest('.hyper-search')) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserDropdown, showSearchResults]);

    // Aplicar tema
    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-theme');
        else document.body.classList.remove('dark-theme');
    }, [isDarkMode]);

    return {
        // Core
        store, navigate, logout,
        // Estados UI
        sidebarHidden, activeView, setActiveView,
        searchQuery, setSearchQuery,
        searchResults, setSearchResults,
        showSearchResults, setShowSearchResults,
        showUserDropdown, setShowUserDropdown,
        isDarkMode,
        // Estados datos
        tickets, loading, error, setError: dataHook.setError,
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
