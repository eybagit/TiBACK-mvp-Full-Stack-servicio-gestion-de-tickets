/**
 * Analista Slice - Estado y reducers para AnalistaPage
 * Arquitectura tiback-hello: useReducer + Context API exclusivamente
 * NO useState en ningún componente
 * 
 * Migrado desde:
 * - useAnalistaData.js (10 useState)
 * - useAnalistaPage.js (7 useState)
 */

// Estado inicial del analista
export const analistaInitialState = {
  // === DATOS PRINCIPALES ===
  tickets: [],
  userData: null,
  
  // === ESTADOS DE CARGA ===
  loading: true,
  error: '',
  updatingInfo: false,
  
  // === UI - SIDEBAR Y NAVEGACIÓN ===
  sidebarHidden: false,
  activeView: 'dashboard',
  selectedTicketId: null,
  modalTicketId: null,
  
  // === UI - DROPDOWNS Y MODALES ===
  showUserDropdown: false,
  showInfoForm: false,
  
  // === UI - BÚSQUEDA ===
  searchQuery: '',
  searchResults: [],
  showSearchResults: false,
  
  // === UI - TEMA ===
  isDarkMode: false,
  
  // === FORMULARIO DE INFORMACIÓN ===
  infoData: {
    nombre: '',
    apellido: '',
    email: '',
    especialidad: '',
    password: '',
    confirmPassword: ''
  },
  
  // === TICKETS EXPANDIDOS Y SOLICITUDES ===
  expandedTickets: new Set(),
  ticketsSolicitudReapertura: new Set(),
};

/**
 * Reducers para el estado del analista
 * Nomenclatura: ANALISTA_[ACCION]
 */
export const analistaReducer = {
  // === TICKETS ===
  ANALISTA_SET_TICKETS(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, tickets: payload }
    };
  },

  ANALISTA_ADD_TICKET(store, payload) {
    return {
      ...store,
      analista: {
        ...store.analista,
        tickets: [payload, ...store.analista.tickets]
      }
    };
  },

  ANALISTA_UPDATE_TICKET(store, payload) {
    return {
      ...store,
      analista: {
        ...store.analista,
        tickets: store.analista.tickets.map(t =>
          t.id === payload.id ? { ...t, ...payload } : t
        )
      }
    };
  },

  ANALISTA_REMOVE_TICKET(store, payload) {
    return {
      ...store,
      analista: {
        ...store.analista,
        tickets: store.analista.tickets.filter(t => t.id !== payload)
      }
    };
  },

  // === DATOS DE USUARIO ===
  ANALISTA_SET_USER_DATA(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, userData: payload }
    };
  },

  // === ESTADOS DE CARGA Y ERROR ===
  ANALISTA_SET_LOADING(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, loading: payload }
    };
  },

  ANALISTA_SET_ERROR(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, error: payload }
    };
  },

  ANALISTA_SET_UPDATING_INFO(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, updatingInfo: payload }
    };
  },

  // === SIDEBAR Y NAVEGACIÓN ===
  ANALISTA_TOGGLE_SIDEBAR(store) {
    return {
      ...store,
      analista: {
        ...store.analista,
        sidebarHidden: !store.analista.sidebarHidden
      }
    };
  },

  ANALISTA_SET_SIDEBAR_HIDDEN(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, sidebarHidden: payload }
    };
  },

  ANALISTA_SET_ACTIVE_VIEW(store, payload) {
    const newState = {
      ...store,
      analista: { ...store.analista, activeView: payload }
    };
    // Si es una vista de ticket, extraer el ID
    if (payload.startsWith('ticket-') || payload.startsWith('comentarios-') || 
        payload.startsWith('chat-') || payload.startsWith('supervisor-chat-')) {
      const ticketId = payload.replace(/^(ticket-|comentarios-|chat-|supervisor-chat-)/, '');
      newState.analista.selectedTicketId = parseInt(ticketId);
      newState.analista.modalTicketId = parseInt(ticketId);
    } else {
      newState.analista.selectedTicketId = null;
    }
    return newState;
  },

  ANALISTA_SET_MODAL_TICKET_ID(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, modalTicketId: payload }
    };
  },

  // === DROPDOWNS Y MODALES ===
  ANALISTA_TOGGLE_USER_DROPDOWN(store) {
    return {
      ...store,
      analista: {
        ...store.analista,
        showUserDropdown: !store.analista.showUserDropdown
      }
    };
  },

  ANALISTA_SET_SHOW_USER_DROPDOWN(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, showUserDropdown: payload }
    };
  },

  ANALISTA_TOGGLE_INFO_FORM(store) {
    return {
      ...store,
      analista: {
        ...store.analista,
        showInfoForm: !store.analista.showInfoForm
      }
    };
  },

  ANALISTA_SET_SHOW_INFO_FORM(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, showInfoForm: payload }
    };
  },

  // === BÚSQUEDA ===
  ANALISTA_SET_SEARCH_QUERY(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, searchQuery: payload }
    };
  },

  ANALISTA_SET_SEARCH_RESULTS(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, searchResults: payload }
    };
  },

  ANALISTA_SET_SHOW_SEARCH_RESULTS(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, showSearchResults: payload }
    };
  },

  ANALISTA_CLEAR_SEARCH(store) {
    return {
      ...store,
      analista: {
        ...store.analista,
        searchQuery: '',
        searchResults: [],
        showSearchResults: false
      }
    };
  },

  // === TEMA ===
  ANALISTA_TOGGLE_DARK_MODE(store) {
    const newDarkMode = !store.analista.isDarkMode;
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-theme', newDarkMode);
    }
    return {
      ...store,
      analista: { ...store.analista, isDarkMode: newDarkMode }
    };
  },

  ANALISTA_SET_DARK_MODE(store, payload) {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-theme', payload);
    }
    return {
      ...store,
      analista: { ...store.analista, isDarkMode: payload }
    };
  },

  // === FORMULARIO DE INFORMACIÓN ===
  ANALISTA_SET_INFO_DATA(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, infoData: payload }
    };
  },

  ANALISTA_UPDATE_INFO_FIELD(store, payload) {
    const { field, value } = payload;
    return {
      ...store,
      analista: {
        ...store.analista,
        infoData: { ...store.analista.infoData, [field]: value }
      }
    };
  },

  ANALISTA_RESET_PASSWORD_FIELDS(store) {
    return {
      ...store,
      analista: {
        ...store.analista,
        infoData: {
          ...store.analista.infoData,
          password: '',
          confirmPassword: ''
        }
      }
    };
  },

  // === TICKETS EXPANDIDOS ===
  ANALISTA_TOGGLE_EXPANDED_TICKET(store, payload) {
    const newExpandedTickets = new Set(store.analista.expandedTickets);
    if (newExpandedTickets.has(payload)) {
      newExpandedTickets.delete(payload);
    } else {
      newExpandedTickets.add(payload);
    }
    return {
      ...store,
      analista: { ...store.analista, expandedTickets: newExpandedTickets }
    };
  },

  ANALISTA_CLEAR_EXPANDED_TICKETS(store) {
    return {
      ...store,
      analista: { ...store.analista, expandedTickets: new Set() }
    };
  },

  // === SOLICITUDES DE REAPERTURA ===
  ANALISTA_ADD_SOLICITUD_REAPERTURA(store, payload) {
    const newSet = new Set(store.analista.ticketsSolicitudReapertura);
    newSet.add(payload);
    return {
      ...store,
      analista: { ...store.analista, ticketsSolicitudReapertura: newSet }
    };
  },

  ANALISTA_REMOVE_SOLICITUD_REAPERTURA(store, payload) {
    const newSet = new Set(store.analista.ticketsSolicitudReapertura);
    newSet.delete(payload);
    return {
      ...store,
      analista: { ...store.analista, ticketsSolicitudReapertura: newSet }
    };
  },

  ANALISTA_SET_SOLICITUDES_REAPERTURA(store, payload) {
    return {
      ...store,
      analista: { ...store.analista, ticketsSolicitudReapertura: new Set(payload) }
    };
  },

  ANALISTA_CLEAR_SOLICITUDES_REAPERTURA(store) {
    return {
      ...store,
      analista: { ...store.analista, ticketsSolicitudReapertura: new Set() }
    };
  },

  // === RESET ESTADO ===
  ANALISTA_RESET(store) {
    return {
      ...store,
      analista: { ...analistaInitialState }
    };
  }
};

export default analistaReducer;
