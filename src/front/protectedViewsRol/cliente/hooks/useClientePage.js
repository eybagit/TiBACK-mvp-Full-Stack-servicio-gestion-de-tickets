import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

// Hooks especializados
import useClienteUI from './useClienteUI';
import useClienteTickets from './useClienteTickets';
import useClienteProfile from './useClienteProfile';
import useClienteWebSocket from './useClienteWebSocket';

/**
 * useClientePage - Hook principal que compone los hooks especializados
 * Este hook orquesta la lógica del componente ClientePage combinando:
 * - useClienteUI: Estado de UI (sidebar, tema, búsqueda, filtros)
 * - useClienteTickets: CRUD de tickets
 * - useClienteProfile: Perfil del usuario
 * - useClienteWebSocket: Conexión WebSocket y sincronización
 * 
 * @returns {Object} Estados y funciones combinados de todos los hooks
 */
function useClientePage() {
    const navigate = useNavigate();
    const {
        store,
        logout,
        dispatch,
        connectWebSocket,
        disconnectWebSocket,
        joinRoom,
        joinTicketRoom,
        startRealtimeSync,
        emitCriticalTicketAction,
        joinCriticalRooms,
        joinAllCriticalRooms
    } = useGlobalReducer();

    // Hook de UI
    const ui = useClienteUI();

    // Hook de tickets (pasamos changeView para navegación)
    const ticketsHook = useClienteTickets(
        store,
        dispatch,
        joinTicketRoom,
        emitCriticalTicketAction,
        joinCriticalRooms,
        ui.changeView
    );

    // Hook de perfil
    const profile = useClienteProfile(store, dispatch);

    // Hook de WebSocket
    useClienteWebSocket({
        store,
        connectWebSocket,
        disconnectWebSocket,
        joinRoom,
        joinTicketRoom,
        startRealtimeSync,
        joinCriticalRooms,
        joinAllCriticalRooms,
        tickets: ticketsHook.tickets,
        actualizarTickets: ticketsHook.actualizarTickets,
        setSolicitudesReapertura: ticketsHook.setSolicitudesReapertura,
        setTickets: ticketsHook.setTickets
    });

    // Cargar datos del usuario y tickets al montar
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                ticketsHook.setLoading(true);
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);

                // Cargar datos del usuario
                const userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    profile.setUserData(userData);
                    dispatch({ type: 'SET_USER', payload: userData });

                    profile.setInfoData({
                        nombre: userData.nombre === 'Pendiente' ? '' : userData.nombre || '',
                        apellido: userData.apellido === 'Pendiente' ? '' : userData.apellido || '',
                        email: userData.email || '',
                        telefono: userData.telefono === '0000000000' ? '' : userData.telefono || '',
                        direccion: userData.direccion === 'Pendiente' ? '' : userData.direccion || '',
                        lat: userData.latitude || null,
                        lng: userData.longitude || null,
                        password: '',
                        confirmPassword: ''
                    });
                    profile.setClienteImageUrl(userData.url_imagen || '');
                }

                // Cargar tickets del cliente
                const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (ticketsResponse.ok) {
                    const ticketsData = await ticketsResponse.json();
                    ticketsHook.setTickets(ticketsData);
                }
            } catch (err) {
                console.error('Error al cargar datos:', err);
                ticketsHook.setError(err.message);
            } finally {
                ticketsHook.setLoading(false);
            }
        };

        cargarDatos();
    }, [store.auth.token]);

    // Verificar recomendaciones para todos los tickets
    useEffect(() => {
        const verificarRecomendaciones = async () => {
            if (ticketsHook.tickets.length === 0 || !store.auth.token) return;

            try {
                const token = store.auth.token;
                const recomendacionesPromises = ticketsHook.tickets.map(async (ticket) => {
                    try {
                        if (!ticket.titulo || !ticket.descripcion) {
                            return { ticketId: ticket.id, tieneRecomendaciones: false };
                        }

                        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/recomendaciones-similares`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            signal: AbortSignal.timeout(15000)
                        });

                        if (response.ok) {
                            const data = await response.json();
                            return { ticketId: ticket.id, tieneRecomendaciones: data.total_encontrados > 0 };
                        }
                        return { ticketId: ticket.id, tieneRecomendaciones: false };
                    } catch {
                        return { ticketId: ticket.id, tieneRecomendaciones: false };
                    }
                });

                const resultados = await Promise.all(recomendacionesPromises);
                const ticketsConRec = new Set();
                resultados.forEach(({ ticketId, tieneRecomendaciones }) => {
                    if (tieneRecomendaciones) ticketsConRec.add(ticketId);
                });
                ticketsHook.setTicketsConRecomendaciones(ticketsConRec);
            } catch (error) {
                console.error('Error verificando recomendaciones:', error);
            }
        };

        const timeoutId = setTimeout(verificarRecomendaciones, 500);
        return () => clearTimeout(timeoutId);
    }, [ticketsHook.tickets.length, store.auth.token]);

    // Combinar y retornar todos los estados y funciones
    return {
        // Navegación
        navigate,
        logout,
        
        // Tickets
        tickets: ticketsHook.tickets,
        setTickets: ticketsHook.setTickets,
        loading: ticketsHook.loading,
        error: ticketsHook.error,
        ticketsConRecomendaciones: ticketsHook.ticketsConRecomendaciones,
        solicitudesReapertura: ticketsHook.solicitudesReapertura,
        showTicketForm: ticketsHook.showTicketForm,
        ticketImageUrl: ticketsHook.ticketImageUrl,
        setTicketImageUrl: ticketsHook.setTicketImageUrl,
        uploading: ticketsHook.uploading,
        actualizarTickets: ticketsHook.actualizarTickets,
        crearTicket: ticketsHook.crearTicket,
        cerrarTicket: ticketsHook.cerrarTicket,
        solicitarReapertura: ticketsHook.solicitarReapertura,
        getEstadoColor: ticketsHook.getEstadoColor,
        getPrioridadColor: ticketsHook.getPrioridadColor,
        tieneAnalistaAsignado: ticketsHook.tieneAnalistaAsignado,
        getAnalistaAsignado: ticketsHook.getAnalistaAsignado,
        getFechaAsignacion: ticketsHook.getFechaAsignacion,
        handleImageUpload: ticketsHook.handleImageUpload,
        handleImageRemove: ticketsHook.handleImageRemove,
        toggleTicketForm: ticketsHook.toggleTicketForm,
        generarRecomendacion: ticketsHook.generarRecomendacion,
        
        // Perfil
        userData: profile.userData,
        clienteImageUrl: profile.clienteImageUrl,
        showInfoForm: profile.showInfoForm,
        setShowInfoForm: profile.setShowInfoForm,
        updatingInfo: profile.updatingInfo,
        infoData: profile.infoData,
        updateInfo: profile.updateInfo,
        handleInfoChange: profile.handleInfoChange,
        handleLocationChange: profile.handleLocationChange,
        handleClienteImageUpload: profile.handleClienteImageUpload,
        handleClienteImageRemove: profile.handleClienteImageRemove,
        
        // UI
        sidebarHidden: ui.sidebarHidden,
        toggleSidebar: ui.toggleSidebar,
        activeView: ui.activeView,
        selectedTicketId: ui.selectedTicketId,
        setSelectedTicketId: ui.setSelectedTicketId,
        changeView: ui.changeView,
        showUserDropdown: ui.showUserDropdown,
        setShowUserDropdown: ui.setShowUserDropdown,
        isDarkMode: ui.isDarkMode,
        toggleTheme: ui.toggleTheme,
        searchQuery: ui.searchQuery,
        searchResults: ui.searchResults,
        showSearchResults: ui.showSearchResults,
        setShowSearchResults: ui.setShowSearchResults,
        handleSearch: (query) => ui.handleSearch(query, ticketsHook.tickets),
        selectTicketFromSearch: ui.selectTicketFromSearch,
        closeSearchResults: ui.closeSearchResults,
        filterEstado: ui.filterEstado,
        setFilterEstado: ui.setFilterEstado,
        filterPrioridad: ui.filterPrioridad,
        setFilterPrioridad: ui.setFilterPrioridad,
        filterAsignado: ui.filterAsignado,
        setFilterAsignado: ui.setFilterAsignado,
        showFilterDropdown: ui.showFilterDropdown,
        setShowFilterDropdown: ui.setShowFilterDropdown,
        applyFilters: ui.applyFilters,
        clearFilters: ui.clearFilters,
        expandedTickets: ui.expandedTickets,
        toggleTicketExpansion: ui.toggleTicketExpansion,
        getFilteredTickets: () => ui.getFilteredTickets(ticketsHook.tickets),
        
        // Funciones de navegación (similar al analista - FIX para comentarios)
        openComments: (ticketId) => {
            try {
                const socket = store.websocket.socket;
                if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
            } catch (e) {}
            ui.setSelectedTicketId(ticketId);
            ui.changeView(`comentarios-${ticketId}`);
        },
        openChat: (ticketId) => {
            try {
                const socket = store.websocket.socket;
                if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
            } catch (e) {}
            ui.setSelectedTicketId(ticketId);
            ui.changeView(`chat-${ticketId}`);
        },
        openVerHD: (ticketId) => {
            try {
                const socket = store.websocket.socket;
                if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
            } catch (e) {}
            ui.setSelectedTicketId(ticketId);
            ui.changeView(`ticket-${ticketId}`);
        },
        openRecomendacion: (ticketId) => {
            try {
                const socket = store.websocket.socket;
                if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
            } catch (e) {}
            ui.setSelectedTicketId(ticketId);
            ui.changeView(`recomendacion-${ticketId}`);
        },
        openIdentificar: (ticketId) => {
            try {
                const socket = store.websocket.socket;
                if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
            } catch (e) {}
            ui.setSelectedTicketId(ticketId);
            ui.changeView(`identificar-${ticketId}`);
        },
        
        // Modal de imágenes
        selectedTicketImages: null,
        setSelectedTicketImages: () => {},
        selectedImageIndex: 0,
        setSelectedImageIndex: () => {}
    };
}

export default useClientePage;
