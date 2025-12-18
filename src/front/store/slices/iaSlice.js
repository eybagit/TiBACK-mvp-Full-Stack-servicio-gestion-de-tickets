/**
 * IA Slice - Estado y reducers para componentes de IA
 * Arquitectura tiback-hello: useReducer + Context API exclusivamente
 * NO useState en ningún componente
 * 
 * Migrado desde:
 * - IdentificarImagen.jsx (10 useState)
 * - IdentificarImagenEmbedded.jsx (8 useState)
 * - RecomendacionesSimilares.jsx (8 useState)
 * - RecomendacionesGuardadas.jsx (6 useState)
 */

// Estado inicial de IA
export const iaInitialState = {
  // === TICKETS Y DATOS ===
  ticket: null,
  ticketId: null,
  
  // === ANÁLISIS DE IMAGEN ===
  image: null,
  imagePreview: null,
  additionalDetails: '',
  analysisResult: null,
  
  // === RECOMENDACIONES ===
  recomendaciones: [],
  recomendacionesGuardadas: [],
  ticketsSimilares: [],
  
  // === ESTADOS DE CARGA ===
  loading: false,
  error: null,
  analyzing: false,
  saving: false,
  
  // === UI ===
  sidebarHidden: false,
  activeView: 'ia',
  userData: null,
};

/**
 * Reducers para el estado de IA
 * Nomenclatura: IA_[ACCION]
 */
export const iaReducer = {
  // === TICKETS Y DATOS ===
  IA_SET_TICKET(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, ticket: payload }
    };
  },

  IA_SET_TICKET_ID(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, ticketId: payload }
    };
  },

  // === ANÁLISIS DE IMAGEN ===
  IA_SET_IMAGE(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, image: payload }
    };
  },

  IA_SET_IMAGE_PREVIEW(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, imagePreview: payload }
    };
  },

  IA_SET_ADDITIONAL_DETAILS(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, additionalDetails: payload }
    };
  },

  IA_SET_ANALYSIS_RESULT(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, analysisResult: payload }
    };
  },

  IA_CLEAR_ANALYSIS(store) {
    return {
      ...store,
      ia: {
        ...store.ia,
        image: null,
        imagePreview: null,
        additionalDetails: '',
        analysisResult: null,
        error: null
      }
    };
  },

  // === RECOMENDACIONES ===
  IA_SET_RECOMENDACIONES(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, recomendaciones: payload }
    };
  },

  IA_SET_RECOMENDACIONES_GUARDADAS(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, recomendacionesGuardadas: payload }
    };
  },

  IA_ADD_RECOMENDACION_GUARDADA(store, payload) {
    return {
      ...store,
      ia: {
        ...store.ia,
        recomendacionesGuardadas: [...store.ia.recomendacionesGuardadas, payload]
      }
    };
  },

  IA_SET_TICKETS_SIMILARES(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, ticketsSimilares: payload }
    };
  },

  // === ESTADOS DE CARGA ===
  IA_SET_LOADING(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, loading: payload }
    };
  },

  IA_SET_ERROR(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, error: payload }
    };
  },

  IA_SET_ANALYZING(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, analyzing: payload }
    };
  },

  IA_SET_SAVING(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, saving: payload }
    };
  },

  // === UI ===
  IA_TOGGLE_SIDEBAR(store) {
    return {
      ...store,
      ia: {
        ...store.ia,
        sidebarHidden: !store.ia.sidebarHidden
      }
    };
  },

  IA_SET_SIDEBAR_HIDDEN(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, sidebarHidden: payload }
    };
  },

  IA_SET_ACTIVE_VIEW(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, activeView: payload }
    };
  },

  IA_SET_USER_DATA(store, payload) {
    return {
      ...store,
      ia: { ...store.ia, userData: payload }
    };
  },

  // === RESET ===
  IA_RESET(store) {
    return {
      ...store,
      ia: { ...iaInitialState }
    };
  }
};

export default iaReducer;
