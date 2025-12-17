/**
 * Cliente Slice - Estado y reducers para ClientePage
 * Arquitectura tiback-hello: useReducer + Context API exclusivamente
 * NO useState en ningún componente
 */

// Estado inicial del cliente (todo lo que estaba en useState de ClientePage)
export const clienteInitialState = {
  // Datos principales
  tickets: [],
  userData: null,
  
  // Estados de UI
  loading: true,
  error: '',
  showInfoForm: false,
  updatingInfo: false,
  showTicketForm: false,
  
  // Solicitudes y recomendaciones
  solicitudesReapertura: [], // Set convertido a array para el reducer
  ticketsConRecomendaciones: [], // Set convertido a array
  expandedTickets: [],
  
  // Formulario de información
  infoData: {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    lat: null,
    lng: null,
    password: '',
    confirmPassword: ''
  },
  
  // Imágenes
  ticketImageUrl: '',
  clienteImageUrl: '',
  newTicketImages: [],
  uploading: false,
  
  // Diseño Hyper (sidebar y vistas)
  sidebarCollapsed: false,
  sidebarHidden: false,
  activeView: 'dashboard',
  showUserDropdown: false,
  selectedTicketId: null,
  
  // Búsqueda
  searchQuery: '',
  searchResults: [],
  showSearchResults: false,
  
  // Tema
  isDarkMode: false,
  
  // Filtros
  showFilterDropdown: false,
  filterEstado: '',
  filterAsignado: '',
  filterPrioridad: '',
  
  // Modal de imágenes
  selectedTicketImages: null,
  selectedImageIndex: 0,
};

/**
 * Reducers para el estado del cliente
 * Nomenclatura: CLIENTE_[ACCION]
 */
export const clienteReducer = {
  // === TICKETS ===
  CLIENTE_SET_TICKETS: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      tickets: payload,
    }
  }),
  
  CLIENTE_ADD_TICKET: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      tickets: [...store.clientePage.tickets, payload],
    }
  }),
  
  CLIENTE_UPDATE_TICKET: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      tickets: store.clientePage.tickets.map(t => 
        t.id === payload.id ? { ...t, ...payload } : t
      ),
    }
  }),
  
  CLIENTE_REMOVE_TICKET: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      tickets: store.clientePage.tickets.filter(t => t.id !== payload),
    }
  }),
  
  // === DATOS DE USUARIO ===
  CLIENTE_SET_USER_DATA: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      userData: payload,
    }
  }),
  
  // === ESTADOS DE CARGA Y ERROR ===
  CLIENTE_SET_LOADING: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      loading: payload,
    }
  }),
  
  CLIENTE_SET_ERROR: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      error: payload,
    }
  }),
  
  CLIENTE_SET_UPLOADING: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      uploading: payload,
    }
  }),
  
  CLIENTE_SET_UPDATING_INFO: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      updatingInfo: payload,
    }
  }),
  
  // === FORMULARIOS Y UI ===
  CLIENTE_TOGGLE_INFO_FORM: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      showInfoForm: !store.clientePage.showInfoForm,
    }
  }),
  
  CLIENTE_SET_SHOW_INFO_FORM: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      showInfoForm: payload,
    }
  }),
  
  CLIENTE_TOGGLE_TICKET_FORM: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      showTicketForm: !store.clientePage.showTicketForm,
      // Limpiar imagen cuando se cierra
      ticketImageUrl: store.clientePage.showTicketForm ? '' : store.clientePage.ticketImageUrl,
    }
  }),
  
  CLIENTE_SET_SHOW_TICKET_FORM: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      showTicketForm: payload,
    }
  }),
  
  // === INFO DATA (FORMULARIO) ===
  CLIENTE_SET_INFO_DATA: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      infoData: { ...store.clientePage.infoData, ...payload },
    }
  }),
  
  CLIENTE_UPDATE_INFO_FIELD: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      infoData: {
        ...store.clientePage.infoData,
        [payload.name]: payload.value,
      },
    }
  }),
  
  CLIENTE_RESET_PASSWORD_FIELDS: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      infoData: {
        ...store.clientePage.infoData,
        password: '',
        confirmPassword: '',
      },
    }
  }),
  
  // === IMÁGENES ===
  CLIENTE_SET_TICKET_IMAGE_URL: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      ticketImageUrl: payload,
    }
  }),
  
  CLIENTE_SET_CLIENTE_IMAGE_URL: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      clienteImageUrl: payload,
      // También actualizar userData si existe
      userData: store.clientePage.userData 
        ? { ...store.clientePage.userData, url_imagen: payload || null }
        : null,
    }
  }),
  
  CLIENTE_SET_NEW_TICKET_IMAGES: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      newTicketImages: payload,
    }
  }),
  
  CLIENTE_ADD_NEW_TICKET_IMAGE: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      newTicketImages: [...store.clientePage.newTicketImages, payload],
    }
  }),
  
  // === MODAL DE IMÁGENES ===
  CLIENTE_SET_SELECTED_TICKET_IMAGES: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      selectedTicketImages: payload,
    }
  }),
  
  CLIENTE_SET_SELECTED_IMAGE_INDEX: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      selectedImageIndex: payload,
    }
  }),
  
  // === SOLICITUDES DE REAPERTURA ===
  CLIENTE_ADD_SOLICITUD_REAPERTURA: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      solicitudesReapertura: store.clientePage.solicitudesReapertura.includes(payload)
        ? store.clientePage.solicitudesReapertura
        : [...store.clientePage.solicitudesReapertura, payload],
    }
  }),
  
  CLIENTE_REMOVE_SOLICITUD_REAPERTURA: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      solicitudesReapertura: store.clientePage.solicitudesReapertura.filter(id => id !== payload),
    }
  }),
  
  CLIENTE_CLEAR_SOLICITUDES_REAPERTURA: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      solicitudesReapertura: [],
    }
  }),
  
  // === RECOMENDACIONES ===
  CLIENTE_SET_TICKETS_CON_RECOMENDACIONES: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      ticketsConRecomendaciones: payload,
    }
  }),
  
  // === TICKETS EXPANDIDOS ===
  CLIENTE_TOGGLE_EXPANDED_TICKET: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      expandedTickets: store.clientePage.expandedTickets.includes(payload)
        ? store.clientePage.expandedTickets.filter(id => id !== payload)
        : [...store.clientePage.expandedTickets, payload],
    }
  }),
  
  // === SIDEBAR Y NAVEGACIÓN ===
  CLIENTE_TOGGLE_SIDEBAR: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      sidebarHidden: !store.clientePage.sidebarHidden,
    }
  }),
  
  CLIENTE_SET_SIDEBAR_COLLAPSED: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      sidebarCollapsed: payload,
    }
  }),
  
  CLIENTE_SET_SIDEBAR_HIDDEN: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      sidebarHidden: payload,
    }
  }),
  
  CLIENTE_SET_ACTIVE_VIEW: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      activeView: payload,
      // Manejar selectedTicketId basado en la vista
      selectedTicketId: payload.match(/^(ticket-|comentarios-|chat-|recomendacion-|identificar-)(\d+)$/)
        ? parseInt(payload.replace(/^(ticket-|comentarios-|chat-|recomendacion-|identificar-)/, ''))
        : null,
    }
  }),
  
  CLIENTE_SET_SELECTED_TICKET_ID: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      selectedTicketId: payload,
    }
  }),
  
  // === DROPDOWN Y FILTROS ===
  CLIENTE_TOGGLE_USER_DROPDOWN: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      showUserDropdown: !store.clientePage.showUserDropdown,
    }
  }),
  
  CLIENTE_SET_SHOW_USER_DROPDOWN: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      showUserDropdown: payload,
    }
  }),
  
  CLIENTE_TOGGLE_FILTER_DROPDOWN: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      showFilterDropdown: !store.clientePage.showFilterDropdown,
    }
  }),
  
  CLIENTE_SET_FILTER_ESTADO: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      filterEstado: payload,
    }
  }),
  
  CLIENTE_SET_FILTER_ASIGNADO: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      filterAsignado: payload,
    }
  }),
  
  CLIENTE_SET_FILTER_PRIORIDAD: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      filterPrioridad: payload,
    }
  }),
  
  CLIENTE_CLEAR_FILTERS: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      filterEstado: '',
      filterAsignado: '',
      filterPrioridad: '',
      showFilterDropdown: false,
    }
  }),
  
  // === BÚSQUEDA ===
  CLIENTE_SET_SEARCH_QUERY: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      searchQuery: payload,
    }
  }),
  
  CLIENTE_SET_SEARCH_RESULTS: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      searchResults: payload,
      showSearchResults: payload.length > 0,
    }
  }),
  
  CLIENTE_CLOSE_SEARCH_RESULTS: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      searchResults: [],
      showSearchResults: false,
    }
  }),
  
  CLIENTE_SELECT_TICKET_FROM_SEARCH: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      searchQuery: '',
      searchResults: [],
      showSearchResults: false,
      activeView: `ticket-${payload}`,
      selectedTicketId: payload,
    }
  }),
  
  // === TEMA ===
  CLIENTE_TOGGLE_THEME: (store) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      isDarkMode: !store.clientePage.isDarkMode,
    }
  }),
  
  CLIENTE_SET_DARK_MODE: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      isDarkMode: payload,
    }
  }),
  
  // === RESET ===
  CLIENTE_RESET_STATE: (store) => ({
    ...store,
    clientePage: { ...clienteInitialState },
  }),
  
  // === UBICACIÓN ===
  CLIENTE_SET_LOCATION: (store, payload) => ({
    ...store,
    clientePage: {
      ...store.clientePage,
      infoData: {
        ...store.clientePage.infoData,
        direccion: payload.address || payload.direccion,
        lat: payload.lat,
        lng: payload.lng,
      },
    }
  }),
};
