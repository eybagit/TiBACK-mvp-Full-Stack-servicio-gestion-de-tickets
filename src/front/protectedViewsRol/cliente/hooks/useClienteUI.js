import { useState } from 'react';

/**
 * useClienteUI - Hook para manejar el estado de la interfaz de usuario
 * Incluye: sidebar, tema, búsqueda, filtros, vistas
 */
function useClienteUI() {
    // Estado del sidebar
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // Estado de vista activa
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    
    // Estado del dropdown de usuario
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    
    // Estado del tema
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // Estado de búsqueda
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    // Estado de filtros
    const [filterEstado, setFilterEstado] = useState('');
    const [filterPrioridad, setFilterPrioridad] = useState('');
    const [filterAsignado, setFilterAsignado] = useState('');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    
    // Estado de tickets expandidos
    const [expandedTickets, setExpandedTickets] = useState(new Set());
    
    // Función para alternar sidebar
    const toggleSidebar = () => {
        setSidebarHidden(!sidebarHidden);
    };
    
    // Función para cambiar vista
    const changeView = (view) => {
        setActiveView(view);
        if (view.startsWith('ticket-') || view.startsWith('comentarios-') || 
            view.startsWith('chat-') || view.startsWith('recomendacion-') || 
            view.startsWith('identificar-')) {
            const ticketId = parseInt(view.split('-')[1]);
            setSelectedTicketId(ticketId);
        }
    };
    
    // Función para buscar tickets por título
    const handleSearch = (query, tickets) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }
        const results = tickets.filter(ticket =>
            ticket.titulo.toLowerCase().includes(query.toLowerCase()) ||
            ticket.descripcion.toLowerCase().includes(query.toLowerCase()) ||
            ticket.id.toString().includes(query)
        );
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
    };
    
    // Función para seleccionar un ticket de la búsqueda
    const selectTicketFromSearch = (ticket) => {
        setSelectedTicketId(ticket.id);
        setActiveView(`ticket-${ticket.id}`);
        setShowSearchResults(false);
        setSearchQuery('');
    };
    
    // Función para cerrar resultados de búsqueda
    const closeSearchResults = () => {
        setShowSearchResults(false);
    };
    
    // Función para alternar tema
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-theme');
    };
    
    // Función para aplicar filtros
    const applyFilters = () => {
        setShowFilterDropdown(false);
    };
    
    // Función para limpiar filtros
    const clearFilters = () => {
        setFilterEstado('');
        setFilterPrioridad('');
        setFilterAsignado('');
        setShowFilterDropdown(false);
    };
    
    // Función para alternar expansión de ticket
    const toggleTicketExpansion = (ticketId) => {
        setExpandedTickets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ticketId)) {
                newSet.delete(ticketId);
            } else {
                newSet.add(ticketId);
            }
            return newSet;
        });
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
        
        // Tickets expandidos
        expandedTickets, setExpandedTickets,
        toggleTicketExpansion,
        getFilteredTickets
    };
}

export default useClienteUI;
