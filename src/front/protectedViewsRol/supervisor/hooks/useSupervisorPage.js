import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { useSupervisorData } from './useSupervisorData';
import { useTicketOperations } from './useTicketOperations';
import { useWebSocketSync } from './useWebSocketSync';

/**
 * useSupervisorPage - Hook principal que orquesta los otros hooks
 * Dividido en: useSupervisorData, useTicketOperations, useWebSocketSync
 */
export function useSupervisorPage() {
    const navigate = useNavigate();
    const { 
        store, logout, dispatch, 
        connectWebSocket, disconnectWebSocket, 
        joinRoom, joinTicketRoom, 
        startRealtimeSync, emitCriticalTicketAction, 
        joinCriticalRooms, joinAllCriticalRooms 
    } = useGlobalReducer();

    // Estados para UI
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Hook de datos
    const dataHook = useSupervisorData({ store, dispatch });
    
    // Extraer funciones y estados de dataHook
    const {
        tickets, setTickets,
        ticketsCerrados, setTicketsCerrados,
        analistas, analistasCombinados, ticketsCerradosCombinados,
        loading, loadingCerrados, error, setError,
        showCerrados, setShowCerrados,
        userData, infoData, setInfoData,
        ticketsConRecomendaciones, expandedTickets,
        filterEstado, setFilterEstado,
        filterAsignado, setFilterAsignado,
        filterPrioridad, setFilterPrioridad,
        actualizarTodasLasTablas, cargarTicketsCerrados,
        getFilteredTickets, getStats, toggleTicketExpansion
    } = dataHook;

    // Hook de operaciones de tickets
    const operationsHook = useTicketOperations({
        store, dispatch, tickets, setTickets,
        ticketsCerrados, setTicketsCerrados,
        setError, setActiveView, actualizarTodasLasTablas,
        emitCriticalTicketAction, navigate
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
        tickets, setTickets, ticketsCerrados, setTicketsCerrados,
        actualizarTodasLasTablas
    });

    // Funciones UI
    const toggleSidebar = () => setSidebarHidden(!sidebarHidden);
    const changeView = (view) => setActiveView(view);
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-theme');
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = tickets.filter(ticket =>
                ticket.titulo.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(results);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    const closeSearchResults = () => {
        setShowSearchResults(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const selectTicketFromSearch = (ticket) => {
        setActiveView(`ticket-${ticket.id}`);
        closeSearchResults();
    };

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({ ...prev, [name]: value }));
    };

    // Retornar todo lo necesario para el componente
    return {
        // Navegación
        navigate, logout,
        
        // Estados UI
        sidebarHidden, activeView, setActiveView,
        showUserDropdown, setShowUserDropdown,
        isDarkMode, searchQuery, setSearchQuery,
        searchResults, setSearchResults,
        showSearchResults, setShowSearchResults,
        
        // Estados de datos
        tickets, ticketsCerrados, analistas,
        analistasCombinados, ticketsCerradosCombinados,
        loading, loadingCerrados, error,
        showCerrados, setShowCerrados,
        userData, infoData,
        ticketsConRecomendaciones, expandedTickets,
        filterEstado, setFilterEstado,
        filterAsignado, setFilterAsignado,
        filterPrioridad, setFilterPrioridad,
        
        // Funciones UI
        toggleSidebar, changeView, toggleTheme,
        handleSearch, selectTicketFromSearch,
        closeSearchResults, toggleTicketExpansion,
        handleInfoChange,
        
        // Funciones de datos
        cargarTicketsCerrados, actualizarTodasLasTablas,
        getFilteredTickets, getStats,
        
        // Funciones de operaciones
        asignarTicket, cerrarTicket, reabrirTicket,
        generarRecomendacion, getAvailableActions,
        getSemaforoColor, tieneSolicitudReapertura,
        fueEscaladoPorAnalista, getEstadoColor, getPrioridadColor,
        
        // Computados
        filteredTickets: getFilteredTickets(),
        stats: getStats()
    };
}

export default useSupervisorPage;
