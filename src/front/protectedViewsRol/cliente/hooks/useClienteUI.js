/**
 * useClienteUI - Hook para manejar el estado de la interfaz de usuario
 * Refactorizado para usar el store global (clienteSlice)
 * NO useState - arquitectura tiback-hello
 */

import useGlobalReducer from '../../../hooks/useGlobalReducer';

function useClienteUI() {
    const { store, dispatch } = useGlobalReducer();
    
    // Acceso al estado del cliente desde el store global
    const clientePage = store.clientePage || {};
    
    // Estados del store
    const sidebarHidden = clientePage.sidebarHidden || false;
    const sidebarCollapsed = clientePage.sidebarCollapsed || false;
    const activeView = clientePage.activeView || 'dashboard';
    const selectedTicketId = clientePage.selectedTicketId || null;
    const showUserDropdown = clientePage.showUserDropdown || false;
    const isDarkMode = clientePage.isDarkMode || false;
    const searchQuery = clientePage.searchQuery || '';
    const searchResults = clientePage.searchResults || [];
    const showSearchResults = clientePage.showSearchResults || false;
    const filterEstado = clientePage.filterEstado || '';
    const filterPrioridad = clientePage.filterPrioridad || '';
    const filterAsignado = clientePage.filterAsignado || '';
    const showFilterDropdown = clientePage.showFilterDropdown || false;
    const expandedTickets = clientePage.expandedTickets || [];
    
    // Función para alternar sidebar
    const toggleSidebar = () => dispatch({ type: 'CLIENTE_TOGGLE_SIDEBAR' });
    
    // Función para cambiar vista
    const changeView = (view) => dispatch({ type: 'CLIENTE_SET_ACTIVE_VIEW', payload: view });
    
    // Función para buscar tickets por título
    const handleSearch = (query, tickets) => {
        dispatch({ type: 'CLIENTE_SET_SEARCH_QUERY', payload: query });
        if (query.trim() === '') {
            dispatch({ type: 'CLIENTE_CLOSE_SEARCH_RESULTS' });
            return;
        }
        const results = tickets.filter(ticket =>
            ticket.titulo.toLowerCase().includes(query.toLowerCase()) ||
            ticket.descripcion.toLowerCase().includes(query.toLowerCase()) ||
            ticket.id.toString().includes(query)
        );
        dispatch({ type: 'CLIENTE_SET_SEARCH_RESULTS', payload: results });
    };
    
    // Función para seleccionar un ticket de la búsqueda
    const selectTicketFromSearch = (ticket) => {
        dispatch({ type: 'CLIENTE_SELECT_TICKET_FROM_SEARCH', payload: ticket.id });
    };
    
    // Función para cerrar resultados de búsqueda
    const closeSearchResults = () => dispatch({ type: 'CLIENTE_CLOSE_SEARCH_RESULTS' });
    
    // Función para alternar tema
    const toggleTheme = () => {
        dispatch({ type: 'CLIENTE_TOGGLE_THEME' });
        document.body.classList.toggle('dark-theme');
    };
    
    // Función para aplicar filtros
    const applyFilters = () => dispatch({ type: 'CLIENTE_SET_SHOW_FILTER_DROPDOWN', payload: false });
    
    // Función para limpiar filtros
    const clearFilters = () => dispatch({ type: 'CLIENTE_CLEAR_FILTERS' });
    
    // Función para alternar expansión de ticket
    const toggleTicketExpansion = (ticketId) => {
        dispatch({ type: 'CLIENTE_TOGGLE_EXPANDED_TICKET', payload: ticketId });
    };
    
    // Función para obtener tickets filtrados
    const getFilteredTickets = (tickets) => {
        return tickets.filter(ticket => {
            const estadoMatch = !filterEstado || ticket.estado?.toLowerCase() === filterEstado.toLowerCase();
            const prioridadMatch = !filterPrioridad || ticket.prioridad?.toLowerCase() === filterPrioridad.toLowerCase();
            let asignadoMatch = true;
            if (filterAsignado === 'asignados') {
                asignadoMatch = ticket.analista_asignado || ticket.analista_id;
            } else if (filterAsignado === 'sin_asignar') {
                asignadoMatch = !ticket.analista_asignado && !ticket.analista_id;
            }
            return estadoMatch && prioridadMatch && asignadoMatch;
        });
    };

    // Setters para compatibilidad
    const setActiveView = (view) => dispatch({ type: 'CLIENTE_SET_ACTIVE_VIEW', payload: view });
    const setSelectedTicketId = (id) => dispatch({ type: 'CLIENTE_SET_SELECTED_TICKET_ID', payload: id });
    const setSidebarHidden = (v) => dispatch({ type: 'CLIENTE_SET_SIDEBAR_HIDDEN', payload: v });
    const setSidebarCollapsed = (v) => dispatch({ type: 'CLIENTE_SET_SIDEBAR_COLLAPSED', payload: v });
    const setShowUserDropdown = (v) => dispatch({ type: 'CLIENTE_SET_SHOW_USER_DROPDOWN', payload: v });
    const setIsDarkMode = (v) => dispatch({ type: 'CLIENTE_SET_DARK_MODE', payload: v });
    const setSearchQuery = (q) => dispatch({ type: 'CLIENTE_SET_SEARCH_QUERY', payload: q });
    const setSearchResults = (r) => dispatch({ type: 'CLIENTE_SET_SEARCH_RESULTS', payload: r });
    const setShowSearchResults = (v) => dispatch({ type: 'CLIENTE_SET_SHOW_SEARCH_RESULTS', payload: v });
    const setFilterEstado = (v) => dispatch({ type: 'CLIENTE_SET_FILTER_ESTADO', payload: v });
    const setFilterPrioridad = (v) => dispatch({ type: 'CLIENTE_SET_FILTER_PRIORIDAD', payload: v });
    const setFilterAsignado = (v) => dispatch({ type: 'CLIENTE_SET_FILTER_ASIGNADO', payload: v });
    const setShowFilterDropdown = (v) => dispatch({ type: 'CLIENTE_TOGGLE_FILTER_DROPDOWN' });
    const setExpandedTickets = (v) => {}; // No direct set, use toggle

    return {
        // Sidebar
        sidebarHidden, setSidebarHidden,
        sidebarCollapsed, setSidebarCollapsed,
        toggleSidebar,
        
        // Vista activa
        activeView, setActiveView,
        selectedTicketId, setSelectedTicketId,
        changeView,
        
        // Dropdown usuario
        showUserDropdown, setShowUserDropdown,
        
        // Tema
        isDarkMode, setIsDarkMode,
        toggleTheme,
        
        // Búsqueda
        searchQuery, setSearchQuery,
        searchResults, setSearchResults,
        showSearchResults, setShowSearchResults,
        handleSearch, selectTicketFromSearch, closeSearchResults,
        
        // Filtros
        filterEstado, setFilterEstado,
        filterPrioridad, setFilterPrioridad,
        filterAsignado, setFilterAsignado,
        showFilterDropdown, setShowFilterDropdown,
        applyFilters, clearFilters,
        
        // Tickets expandidos (convertir a Set para compatibilidad)
        expandedTickets: new Set(expandedTickets), setExpandedTickets,
        toggleTicketExpansion,
        getFilteredTickets
    };
}

export default useClienteUI;
