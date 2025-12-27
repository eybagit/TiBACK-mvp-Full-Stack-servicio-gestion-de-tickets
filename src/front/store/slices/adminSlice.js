/**
 * Admin Slice - Estado y reducers para AdministradorPage
 * Arquitectura tiback-hello: useReducer + Context API exclusivamente
 * NO useState en ningún componente
 * 
 * Migrado desde:
 * - useAdminData.js (7 useState)
 * - AdministradorPage.jsx (4 useState)
 */

// Estado inicial del administrador
export const adminInitialState = {
  // === DATOS PRINCIPALES ===
  tickets: [],
  clientes: [],
  analistas: [],
  supervisores: [],
  userData: null,
  
  // === ESTADÍSTICAS ===
  stats: {
    totalTickets: 0,
    ticketsCreados: 0,
    ticketsEnProceso: 0,
    ticketsSolucionados: 0,
    ticketsCerrados: 0,
    totalClientes: 0,
    totalAnalistas: 0,
    totalSupervisores: 0
  },
  
  // === ESTADOS DE CARGA ===
  loading: true,
  error: '',
  
  // === UI ===
  showMapaDistribucion: false,
  darkMode: false,
};

/**
 * Reducers para el estado del administrador
 * Nomenclatura: ADMIN_[ACCION]
 */
export const adminReducer = {
  // === DATOS ===
  ADMIN_SET_TICKETS(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, tickets: payload }
    };
  },

  ADMIN_SET_CLIENTES(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, clientes: payload }
    };
  },

  ADMIN_SET_ANALISTAS(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, analistas: payload }
    };
  },

  ADMIN_SET_SUPERVISORES(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, supervisores: payload }
    };
  },

  ADMIN_SET_USER_DATA(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, userData: payload }
    };
  },

  // === ESTADÍSTICAS ===
  ADMIN_SET_STATS(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, stats: { ...store.admin.stats, ...payload } }
    };
  },

  ADMIN_UPDATE_STATS(store, payload) {
    return {
      ...store,
      admin: {
        ...store.admin,
        stats: { ...store.admin.stats, ...payload }
      }
    };
  },

  // === ESTADOS DE CARGA ===
  ADMIN_SET_LOADING(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, loading: payload }
    };
  },

  ADMIN_SET_ERROR(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, error: payload }
    };
  },

  // === UI ===
  ADMIN_TOGGLE_MAPA_DISTRIBUCION(store) {
    return {
      ...store,
      admin: {
        ...store.admin,
        showMapaDistribucion: !store.admin.showMapaDistribucion
      }
    };
  },

  ADMIN_SET_SHOW_MAPA_DISTRIBUCION(store, payload) {
    return {
      ...store,
      admin: { ...store.admin, showMapaDistribucion: payload }
    };
  },

  ADMIN_TOGGLE_DARK_MODE(store) {
    const newDarkMode = !store.admin.darkMode;
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-theme', newDarkMode);
    }
    return {
      ...store,
      admin: { ...store.admin, darkMode: newDarkMode }
    };
  },

  ADMIN_SET_DARK_MODE(store, payload) {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark-theme', payload);
    }
    return {
      ...store,
      admin: { ...store.admin, darkMode: payload }
    };
  },

  // === RESET ESTADO ===
  ADMIN_RESET(store) {
    return {
      ...store,
      admin: { ...adminInitialState }
    };
  }
};

export default adminReducer;
