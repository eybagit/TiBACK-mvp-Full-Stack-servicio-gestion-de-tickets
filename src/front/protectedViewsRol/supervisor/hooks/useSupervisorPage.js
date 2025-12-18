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
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [selectedTicketImages, setSelectedTicketImages] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

    // Actualizar información del perfil
    const updateInfo = async () => {
        try {
            setUpdatingInfo(true);
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/perfil`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(infoData)
            });
            if (response.ok) {
                const data = await response.json();
                dispatch({ type: 'SET_USER', payload: data });
                alert('Información actualizada correctamente');
            }
        } catch (err) {
            console.error('Error actualizando perfil:', err);
        } finally {
            setUpdatingInfo(false);
        }
    };

    // Actualizar información (modal)
    const actualizarInformacion = async (e) => {
        e.preventDefault();
        await updateInfo();
        setShowInfoForm(false);
    };

    // Escalar ticket
    const escalarTicket = async (ticketId) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/escalar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                actualizarTodasLasTablas();
            }
        } catch (err) {
            console.error('Error escalando ticket:', err);
        }
    };

    // Agregar comentario
    const agregarComentario = (ticketId) => {
        setActiveView(`comentarios-${ticketId}`);
    };

    // Retornar todo lo necesario para el componente
    return {
        // Navegación
        navigate, logout,
        
        // Estados UI
        sidebarHidden, activeView, setActiveView,
        showUserDropdown, setShowUserDropdown,
        showInfoForm, setShowInfoForm,
        isDarkMode, searchQuery, setSearchQuery,
        searchResults, setSearchResults,
        showSearchResults, setShowSearchResults,
        selectedTicketImages, setSelectedTicketImages,
        selectedImageIndex, setSelectedImageIndex,
        
        // Estados de datos
        tickets, ticketsCerrados, analistas,
        analistasCombinados, ticketsCerradosCombinados,
        loading, loadingCerrados, error,
        showCerrados, setShowCerrados,
        userData, infoData, setInfoData,
        ticketsConRecomendaciones, expandedTickets,
        filterEstado, setFilterEstado,
        filterAsignado, setFilterAsignado,
        filterPrioridad, setFilterPrioridad,
        updatingInfo,
        
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
        escalarTicket, agregarComentario,
        generarRecomendacion, getAvailableActions,
        getSemaforoColor, tieneSolicitudReapertura,
        fueEscaladoPorAnalista, getEstadoColor, getPrioridadColor,
        updateInfo, actualizarInformacion,
        
        // Computados
        filteredTickets: getFilteredTickets(),
        stats: getStats()
    };
}

export default useSupervisorPage;
