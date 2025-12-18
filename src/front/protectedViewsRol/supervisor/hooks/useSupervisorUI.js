/**
 * useSupervisorUI - Hook para gestión de estado de UI del supervisor
 * 
 * REFACTORIZADO: Arquitectura tiback-hello
 * - Eliminados todos los useState
 * - Usa store.supervisor como fuente de verdad
 * - dispatch para modificar estado
 */

import { useEffect } from 'react';
import { supervisorActions } from '../../../store';

/**
 * useSupervisorUI - Hook de UI del supervisor
 * Lee del store global y usa dispatch para cambios
 */
export function useSupervisorUI({ store, dispatch }) {
  // ==============================
  // LEER DEL STORE (en lugar de useState)
  // ==============================
  const {
    sidebarHidden,
    activeView,
    showUserDropdown,
    selectedTicketId,
    searchQuery,
    searchResults,
    showSearchResults,
    isDarkMode,
    showFilterDropdown,
    filterEstado,
    filterAnalista,
    filterPrioridad,
    expandedTickets
  } = store.supervisor;

  // ==============================
  // FUNCIONES DE DISPATCH (en lugar de setters)
  // ==============================

  // Función para alternar sidebar
  const toggleSidebar = () => dispatch({ type: 'SUPERVISOR_TOGGLE_SIDEBAR' });

  // Función para cambiar vista
  const changeView = (view) => {
    dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: view });
  };

  // Setters directos
  const setShowUserDropdown = (value) => dispatch({ type: 'SUPERVISOR_SET_SHOW_USER_DROPDOWN', payload: value });
  const setShowFilterDropdown = (value) => dispatch({ type: 'SUPERVISOR_SET_SHOW_FILTER_DROPDOWN', payload: value });
  const setFilterEstado = (value) => dispatch({ type: 'SUPERVISOR_SET_FILTER_ESTADO', payload: value });
  const setFilterAnalista = (value) => dispatch({ type: 'SUPERVISOR_SET_FILTER_ANALISTA', payload: value });
  const setFilterPrioridad = (value) => dispatch({ type: 'SUPERVISOR_SET_FILTER_PRIORIDAD', payload: value });

  // Función para buscar tickets
  const handleSearch = (query, tickets) => {
    supervisorActions.handleSearch(dispatch, query, tickets);
  };

  // Función para seleccionar ticket de búsqueda
  const selectTicketFromSearch = (ticket) => {
    supervisorActions.selectTicketFromSearch(dispatch, ticket);
  };

  // Función para alternar tema
  const toggleTheme = () => {
    dispatch({ type: 'SUPERVISOR_TOGGLE_DARK_MODE' });
  };

  // Función para expandir/colapsar tickets
  const toggleTicketExpansion = (ticketId) => {
    dispatch({ type: 'SUPERVISOR_TOGGLE_EXPANDED_TICKET', payload: ticketId });
  };

  // Obtener tickets filtrados
  const getFilteredTickets = (tickets, analistas) => {
    return supervisorActions.getFilteredTickets(store.supervisor);
  };

  // ==============================
  // EFFECTS
  // ==============================

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.dropdown')) {
        dispatch({ type: 'SUPERVISOR_SET_SHOW_USER_DROPDOWN', payload: false });
      }
      if (showSearchResults && !event.target.closest('.hyper-search')) {
        dispatch({ type: 'SUPERVISOR_SET_SHOW_SEARCH_RESULTS', payload: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown, showSearchResults, dispatch]);

  // Aplicar tema (el reducer ya lo hace, pero mantenemos por compatibilidad)
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  // ==============================
  // RETORNO (misma interfaz que antes)
  // ==============================
  return {
    // Estados UI (del store)
    sidebarHidden,
    activeView,
    showUserDropdown,
    setShowUserDropdown,
    selectedTicketId,
    
    // Estados búsqueda (del store)
    searchQuery,
    searchResults,
    showSearchResults,
    
    // Estados tema y filtros (del store)
    isDarkMode,
    showFilterDropdown,
    setShowFilterDropdown,
    filterEstado,
    setFilterEstado,
    filterAnalista,
    setFilterAnalista,
    filterPrioridad,
    setFilterPrioridad,
    
    // Estados tickets (del store)
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

export default useSupervisorUI;
