/**
 * useClienteUI - Hook para gestión de estado de UI del cliente
 * Sidebar, filtros, búsqueda, tema, vista activa
 */

import { useState } from 'react';

export function useClienteUI() {
  // Estados para el diseño Hyper
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const [filterAsignado, setFilterAsignado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  
  // Estados para formularios
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [updatingInfo, setUpdatingInfo] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState(new Set());
  
  // Estados para modal de imágenes
  const [selectedTicketImages, setSelectedTicketImages] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Función para alternar sidebar
  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  // Función para cambiar vista
  const changeView = (view) => {
    setActiveView(view);
    if (view.startsWith('ticket-') || view.startsWith('comentarios-') || view.startsWith('chat-') || view.startsWith('recomendacion-') || view.startsWith('identificar-')) {
      const ticketId = view.replace(/^(ticket-|comentarios-|chat-|recomendacion-|identificar-)/, '');
      setSelectedTicketId(parseInt(ticketId));
    } else {
      setSelectedTicketId(null);
    }
  };

  // Función para buscar tickets por título
  const handleSearch = (query, tickets) => {
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filteredTickets = tickets.filter(ticket =>
      ticket.titulo.toLowerCase().includes(query.toLowerCase().trim())
    );

    const limitedResults = filteredTickets.slice(0, 5);
    setSearchResults(limitedResults);
    setShowSearchResults(limitedResults.length > 0);
  };

  // Función para seleccionar un ticket de la búsqueda
  const selectTicketFromSearch = (ticket) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    changeView(`ticket-${ticket.id}`);
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
    setFilterAsignado('');
    setFilterPrioridad('');
    setShowFilterDropdown(false);
  };

  // Función para alternar formulario de ticket
  const toggleTicketForm = () => {
    setShowTicketForm(!showTicketForm);
  };

  // Función para expandir/colapsar tickets
  const toggleExpandTicket = (ticketId) => {
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

  // Obtener ticket filtrados
  const getFilteredTickets = (tickets) => {
    return tickets.filter(ticket => {
      if (filterEstado && ticket.estado !== filterEstado) return false;
      if (filterPrioridad && ticket.prioridad !== filterPrioridad) return false;
      return true;
    });
  };

  return {
    // Estados UI
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarHidden,
    setSidebarHidden,
    activeView,
    setActiveView,
    showUserDropdown,
    setShowUserDropdown,
    selectedTicketId,
    setSelectedTicketId,
    
    // Estados búsqueda
    searchQuery,
    setSearchQuery,
    searchResults,
    showSearchResults,
    
    // Estados tema y filtros
    isDarkMode,
    showFilterDropdown,
    setShowFilterDropdown,
    filterEstado,
    setFilterEstado,
    filterAsignado,
    setFilterAsignado,
    filterPrioridad,
    setFilterPrioridad,
    
    // Estados formularios
    showInfoForm,
    setShowInfoForm,
    updatingInfo,
    setUpdatingInfo,
    showTicketForm,
    setShowTicketForm,
    expandedTickets,
    
    // Estados imágenes
    selectedTicketImages,
    setSelectedTicketImages,
    selectedImageIndex,
    setSelectedImageIndex,
    
    // Funciones
    toggleSidebar,
    changeView,
    handleSearch,
    selectTicketFromSearch,
    closeSearchResults,
    toggleTheme,
    applyFilters,
    clearFilters,
    toggleTicketForm,
    toggleExpandTicket,
    getFilteredTickets
  };
}
