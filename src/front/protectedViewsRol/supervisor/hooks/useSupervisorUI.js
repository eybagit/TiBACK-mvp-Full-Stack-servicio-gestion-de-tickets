/**
 * useSupervisorUI - Hook para gestión de estado de UI del supervisor
 */

import { useState, useEffect } from 'react';

export function useSupervisorUI() {
  // Estados para el diseño Hyper
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  
  // Estados de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Estados de tema y filtros
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterAnalista, setFilterAnalista] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  
  // Estados para tickets expandidos
  const [expandedTickets, setExpandedTickets] = useState(new Set());

  // Función para alternar sidebar
  const toggleSidebar = () => setSidebarHidden(!sidebarHidden);

  // Función para cambiar vista
  const changeView = (view) => {
    setActiveView(view);
    if (view.startsWith('ticket-') || view.startsWith('comentarios-') || view.startsWith('chat-')) {
      const ticketId = view.replace(/^(ticket-|comentarios-|chat-)/, '');
      setSelectedTicketId(parseInt(ticketId));
    } else {
      setSelectedTicketId(null);
    }
  };

  // Función para buscar tickets
  const handleSearch = (query, tickets) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filteredTickets = tickets.filter(ticket =>
      ticket.titulo?.toLowerCase().includes(query.toLowerCase().trim()) ||
      ticket.id?.toString().includes(query)
    );

    setSearchResults(filteredTickets.slice(0, 5));
    setShowSearchResults(filteredTickets.length > 0);
  };

  // Función para seleccionar ticket de búsqueda
  const selectTicketFromSearch = (ticket) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    changeView(`ticket-${ticket.id}`);
  };

  // Función para alternar tema
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-theme');
  };

  // Función para expandir/colapsar tickets
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

  // Obtener tickets filtrados
  const getFilteredTickets = (tickets, analistas) => {
    return tickets.filter(ticket => {
      if (filterEstado && ticket.estado !== filterEstado) return false;
      if (filterPrioridad && ticket.prioridad !== filterPrioridad) return false;
      if (filterAnalista) {
        const tieneAnalista = ticket.asignaciones?.some(a => a.analista_id === parseInt(filterAnalista));
        if (!tieneAnalista) return false;
      }
      return true;
    });
  };

  // Cerrar dropdowns al hacer clic fuera
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
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  return {
    // Estados UI
    sidebarHidden,
    activeView,
    showUserDropdown,
    setShowUserDropdown,
    selectedTicketId,
    
    // Estados búsqueda
    searchQuery,
    searchResults,
    showSearchResults,
    
    // Estados tema y filtros
    isDarkMode,
    showFilterDropdown,
    setShowFilterDropdown,
    filterEstado,
    setFilterEstado,
    filterAnalista,
    setFilterAnalista,
    filterPrioridad,
    setFilterPrioridad,
    
    // Estados tickets
    expandedTickets,
    
    // Funciones
    toggleSidebar,
    changeView,
    handleSearch,
    selectTicketFromSearch,
    toggleTheme,
    toggleTicketExpansion,
    getFilteredTickets
  };
}
