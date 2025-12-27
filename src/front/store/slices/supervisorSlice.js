/**
 * Supervisor Slice - Estado y reducers para SupervisorPage
 * Arquitectura tiback-hello: useReducer + Context API exclusivamente
 * NO useState en ningún componente
 * 
 * Migrado desde:
 * - useSupervisorData.js (14 useState)
 * - useSupervisorUI.js (13 useState)
 * - useSupervisorPage.js (11 useState)
 */

// Estado inicial del supervisor
export const supervisorInitialState = {
  // === DATOS PRINCIPALES ===
  tickets: [],
  ticketsCerrados: [],
  analistas: [],
  userData: null,
  
  // === ESTADOS DE CARGA ===
  loading: true,
  loadingCerrados: false,
  error: '',
  updatingInfo: false,
  
  // === UI - SIDEBAR Y NAVEGACIÓN ===
  sidebarHidden: false,
  activeView: 'dashboard',
  selectedTicketId: null,
  showCerrados: false,
  
  // === UI - DROPDOWNS Y MODALES ===
  showUserDropdown: false,
  showInfoForm: false,
  showFilterDropdown: false,
  
  // === UI - BÚSQUEDA ===
  searchQuery: '',
  searchResults: [],
  showSearchResults: false,
  
  // === UI - TEMA ===
  isDarkMode: false,
  
  // === FILTROS ===
  filterEstado: '',
  filterAsignado: '',
  filterAnalista: '',
  filterPrioridad: '',
  
  // === FORMULARIO DE INFORMACIÓN ===
  infoData: {
    nombre: '',
    apellido: '',
    email: '',
    area_responsable: '',
    password: '',
    confirmPassword: ''
  },
  
  // === TICKETS EXPANDIDOS Y RECOMENDACIONES ===
  expandedTickets: new Set(),
  ticketsConRecomendaciones: new Set(),
  
  // === MODAL DE IMÁGENES ===
  selectedTicketImages: [],
  selectedImageIndex: 0,
};

/**
 * Reducers para el estado del supervisor
 * Nomenclatura: SUPERVISOR_[ACCION]
 */
export const supervisorReducer = {
  // === TICKETS ===
  SUPERVISOR_SET_TICKETS(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, tickets: payload }
    };
  },

  SUPERVISOR_ADD_TICKET(store, payload) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        tickets: [payload, ...store.supervisor.tickets]
      }
    };
  },

  SUPERVISOR_UPDATE_TICKET(store, payload) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        tickets: store.supervisor.tickets.map(t =>
          t.id === payload.id ? { ...t, ...payload } : t
        )
      }
    };
  },

  SUPERVISOR_REMOVE_TICKET(store, payload) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        tickets: store.supervisor.tickets.filter(t => t.id !== payload)
      }
    };
  },

  // === TICKETS CERRADOS ===
  SUPERVISOR_SET_TICKETS_CERRADOS(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, ticketsCerrados: payload }
    };
  },

  SUPERVISOR_SET_SHOW_CERRADOS(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, showCerrados: payload }
    };
  },

  // === ANALISTAS ===
  SUPERVISOR_SET_ANALISTAS(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, analistas: payload }
    };
  },

  // === DATOS DE USUARIO ===
  SUPERVISOR_SET_USER_DATA(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, userData: payload }
    };
  },

  // === ESTADOS DE CARGA Y ERROR ===
  SUPERVISOR_SET_LOADING(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, loading: payload }
    };
  },

  SUPERVISOR_SET_LOADING_CERRADOS(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, loadingCerrados: payload }
    };
  },

  SUPERVISOR_SET_ERROR(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, error: payload }
    };
  },

  SUPERVISOR_SET_UPDATING_INFO(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, updatingInfo: payload }
    };
  },

  // === SIDEBAR Y NAVEGACIÓN ===
  SUPERVISOR_TOGGLE_SIDEBAR(store) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        sidebarHidden: !store.supervisor.sidebarHidden
      }
    };
  },

  SUPERVISOR_SET_SIDEBAR_HIDDEN(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, sidebarHidden: payload }
    };
  },

  SUPERVISOR_SET_ACTIVE_VIEW(store, payload) {
    const newState = {
      ...store,
      supervisor: { ...store.supervisor, activeView: payload }
    };
    // Si es una vista de ticket, extraer el ID
    if (payload.startsWith('ticket-') || payload.startsWith('comentarios-') || payload.startsWith('chat-')) {
      const ticketId = payload.replace(/^(ticket-|comentarios-|chat-)/, '');
      newState.supervisor.selectedTicketId = parseInt(ticketId);
    } else {
      newState.supervisor.selectedTicketId = null;
    }
    return newState;
  },

  SUPERVISOR_SET_SELECTED_TICKET_ID(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, selectedTicketId: payload }
    };
  },

  // === DROPDOWNS Y MODALES ===
  SUPERVISOR_TOGGLE_USER_DROPDOWN(store) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        showUserDropdown: !store.supervisor.showUserDropdown
      }
    };
  },

  SUPERVISOR_SET_SHOW_USER_DROPDOWN(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, showUserDropdown: payload }
    };
  },

  SUPERVISOR_TOGGLE_INFO_FORM(store) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        showInfoForm: !store.supervisor.showInfoForm
      }
    };
  },

  SUPERVISOR_SET_SHOW_INFO_FORM(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, showInfoForm: payload }
    };
  },

  SUPERVISOR_TOGGLE_FILTER_DROPDOWN(store) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        showFilterDropdown: !store.supervisor.showFilterDropdown
      }
    };
  },

  SUPERVISOR_SET_SHOW_FILTER_DROPDOWN(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, showFilterDropdown: payload }
    };
  },

  // === BÚSQUEDA ===
  SUPERVISOR_SET_SEARCH_QUERY(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, searchQuery: payload }
    };
  },

  SUPERVISOR_SET_SEARCH_RESULTS(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, searchResults: payload }
    };
  },

  SUPERVISOR_SET_SHOW_SEARCH_RESULTS(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, showSearchResults: payload }
    };
  },

  SUPERVISOR_CLEAR_SEARCH(store) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        searchQuery: '',
        searchResults: [],
        showSearchResults: false
      }
    };
  },

  // === TEMA ===
  SUPERVISOR_TOGGLE_DARK_MODE(store) {
    const newDarkMode = !store.supervisor.isDarkMode;
    // Toggle de clase en body
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-theme', newDarkMode);
    }
    return {
      ...store,
      supervisor: { ...store.supervisor, isDarkMode: newDarkMode }
    };
  },

  SUPERVISOR_SET_DARK_MODE(store, payload) {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-theme', payload);
    }
    return {
      ...store,
      supervisor: { ...store.supervisor, isDarkMode: payload }
    };
  },

  // === FILTROS ===
  SUPERVISOR_SET_FILTER_ESTADO(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, filterEstado: payload }
    };
  },

  SUPERVISOR_SET_FILTER_ASIGNADO(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, filterAsignado: payload }
    };
  },

  SUPERVISOR_SET_FILTER_ANALISTA(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, filterAnalista: payload }
    };
  },

  SUPERVISOR_SET_FILTER_PRIORIDAD(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, filterPrioridad: payload }
    };
  },

  SUPERVISOR_CLEAR_FILTERS(store) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        filterEstado: '',
        filterAsignado: '',
        filterAnalista: '',
        filterPrioridad: ''
      }
    };
  },

  // === FORMULARIO DE INFORMACIÓN ===
  SUPERVISOR_SET_INFO_DATA(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, infoData: payload }
    };
  },

  SUPERVISOR_UPDATE_INFO_FIELD(store, payload) {
    const { field, value } = payload;
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        infoData: { ...store.supervisor.infoData, [field]: value }
      }
    };
  },

  SUPERVISOR_RESET_PASSWORD_FIELDS(store) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        infoData: {
          ...store.supervisor.infoData,
          password: '',
          confirmPassword: ''
        }
      }
    };
  },

  // === TICKETS EXPANDIDOS ===
  SUPERVISOR_TOGGLE_EXPANDED_TICKET(store, payload) {
    const newExpandedTickets = new Set(store.supervisor.expandedTickets);
    if (newExpandedTickets.has(payload)) {
      newExpandedTickets.delete(payload);
    } else {
      newExpandedTickets.add(payload);
    }
    return {
      ...store,
      supervisor: { ...store.supervisor, expandedTickets: newExpandedTickets }
    };
  },

  SUPERVISOR_CLEAR_EXPANDED_TICKETS(store) {
    return {
      ...store,
      supervisor: { ...store.supervisor, expandedTickets: new Set() }
    };
  },

  // === RECOMENDACIONES ===
  SUPERVISOR_ADD_TICKET_CON_RECOMENDACION(store, payload) {
    const newSet = new Set(store.supervisor.ticketsConRecomendaciones);
    newSet.add(payload);
    return {
      ...store,
      supervisor: { ...store.supervisor, ticketsConRecomendaciones: newSet }
    };
  },

  SUPERVISOR_REMOVE_TICKET_CON_RECOMENDACION(store, payload) {
    const newSet = new Set(store.supervisor.ticketsConRecomendaciones);
    newSet.delete(payload);
    return {
      ...store,
      supervisor: { ...store.supervisor, ticketsConRecomendaciones: newSet }
    };
  },

  // === MODAL DE IMÁGENES ===
  SUPERVISOR_SET_SELECTED_TICKET_IMAGES(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, selectedTicketImages: payload }
    };
  },

  SUPERVISOR_SET_SELECTED_IMAGE_INDEX(store, payload) {
    return {
      ...store,
      supervisor: { ...store.supervisor, selectedImageIndex: payload }
    };
  },

  SUPERVISOR_CLOSE_IMAGE_MODAL(store) {
    return {
      ...store,
      supervisor: {
        ...store.supervisor,
        selectedTicketImages: [],
        selectedImageIndex: 0
      }
    };
  },

  // === RESET ESTADO ===
  SUPERVISOR_RESET(store) {
    return {
      ...store,
      supervisor: { ...supervisorInitialState }
    };
  }
};

/**
 * Acciones auxiliares para el supervisor
 * Estas funciones encapsulan lógica de negocio que no cabe en reducers puros
 */
export const supervisorActions = {
  // Búsqueda de tickets
  handleSearch: (dispatch, query, tickets) => {
    dispatch({ type: 'SUPERVISOR_SET_SEARCH_QUERY', payload: query });
    
    if (query.trim().length === 0) {
      dispatch({ type: 'SUPERVISOR_SET_SEARCH_RESULTS', payload: [] });
      dispatch({ type: 'SUPERVISOR_SET_SHOW_SEARCH_RESULTS', payload: false });
      return;
    }

    const filteredTickets = tickets.filter(ticket =>
      ticket.titulo?.toLowerCase().includes(query.toLowerCase().trim()) ||
      ticket.id?.toString().includes(query)
    );

    dispatch({ type: 'SUPERVISOR_SET_SEARCH_RESULTS', payload: filteredTickets.slice(0, 5) });
    dispatch({ type: 'SUPERVISOR_SET_SHOW_SEARCH_RESULTS', payload: filteredTickets.length > 0 });
  },

  // Seleccionar ticket desde búsqueda
  selectTicketFromSearch: (dispatch, ticket) => {
    dispatch({ type: 'SUPERVISOR_CLEAR_SEARCH' });
    dispatch({ type: 'SUPERVISOR_SET_ACTIVE_VIEW', payload: `ticket-${ticket.id}` });
  },

  // Inicializar datos de usuario en formulario
  initInfoData: (dispatch, userData) => {
    dispatch({
      type: 'SUPERVISOR_SET_INFO_DATA',
      payload: {
        nombre: userData.nombre === 'Pendiente' ? '' : userData.nombre || '',
        apellido: userData.apellido === 'Pendiente' ? '' : userData.apellido || '',
        email: userData.email || '',
        area_responsable: userData.area_responsable || '',
        password: '',
        confirmPassword: ''
      }
    });
  },

  // Manejar cambio en campo de formulario
  handleInfoChange: (dispatch, e) => {
    const { name, value } = e.target;
    dispatch({
      type: 'SUPERVISOR_UPDATE_INFO_FIELD',
      payload: { field: name, value }
    });
  }
};

export default supervisorReducer;
