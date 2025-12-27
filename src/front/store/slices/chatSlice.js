/**
 * Chat Slice - Estado y reducers para componentes de Chat
 * Arquitectura tiback-hello: useReducer + Context API exclusivamente
 * NO useState en ningún componente
 * 
 * Migrado desde:
 * - ChatAnalistaCliente.jsx (9 useState)
 * - ChatSupervisorAnalista.jsx (9 useState)
 * - ChatAnalistaClienteEmbedded.jsx (7 useState)
 * - ChatSupervisorAnalistaEmbedded.jsx (7 useState)
 */

// Estado inicial del chat
export const chatInitialState = {
  // === MENSAJES ===
  mensajes: [],
  nuevoMensaje: '',
  
  // === PARTICIPANTES ===
  nombresParticipantes: {
    analista: 'Analista',
    cliente: 'Cliente',
    supervisor: 'Supervisor'
  },
  
  // === ESTADOS DE CARGA ===
  loading: true,
  error: null,
  sincronizando: false,
  enviando: false,
  
  // === UI ===
  sidebarHidden: false,
  activeView: 'chat',
  
  // === CONTEXTO ===
  ticketId: null,
  chatType: null, // 'analista-cliente' | 'supervisor-analista'
  userData: null,
};

/**
 * Reducers para el estado del chat
 * Nomenclatura: CHAT_[ACCION]
 */
export const chatReducer = {
  // === MENSAJES ===
  CHAT_SET_MENSAJES(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, mensajes: payload }
    };
  },

  CHAT_ADD_MENSAJE(store, payload) {
    return {
      ...store,
      chat: {
        ...store.chat,
        mensajes: [...store.chat.mensajes, payload]
      }
    };
  },

  CHAT_SET_NUEVO_MENSAJE(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, nuevoMensaje: payload }
    };
  },

  CHAT_CLEAR_NUEVO_MENSAJE(store) {
    return {
      ...store,
      chat: { ...store.chat, nuevoMensaje: '' }
    };
  },

  // === PARTICIPANTES ===
  CHAT_SET_NOMBRES_PARTICIPANTES(store, payload) {
    return {
      ...store,
      chat: {
        ...store.chat,
        nombresParticipantes: { ...store.chat.nombresParticipantes, ...payload }
      }
    };
  },

  // === ESTADOS DE CARGA ===
  CHAT_SET_LOADING(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, loading: payload }
    };
  },

  CHAT_SET_ERROR(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, error: payload }
    };
  },

  CHAT_SET_SINCRONIZANDO(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, sincronizando: payload }
    };
  },

  CHAT_SET_ENVIANDO(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, enviando: payload }
    };
  },

  // === UI ===
  CHAT_TOGGLE_SIDEBAR(store) {
    return {
      ...store,
      chat: {
        ...store.chat,
        sidebarHidden: !store.chat.sidebarHidden
      }
    };
  },

  CHAT_SET_SIDEBAR_HIDDEN(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, sidebarHidden: payload }
    };
  },

  CHAT_SET_ACTIVE_VIEW(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, activeView: payload }
    };
  },

  // === CONTEXTO ===
  CHAT_SET_TICKET_ID(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, ticketId: payload }
    };
  },

  CHAT_SET_CHAT_TYPE(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, chatType: payload }
    };
  },

  CHAT_SET_USER_DATA(store, payload) {
    return {
      ...store,
      chat: { ...store.chat, userData: payload }
    };
  },

  // === RESET ===
  CHAT_RESET(store) {
    return {
      ...store,
      chat: { ...chatInitialState }
    };
  },

  CHAT_RESET_MENSAJES(store) {
    return {
      ...store,
      chat: {
        ...store.chat,
        mensajes: [],
        nuevoMensaje: '',
        error: null
      }
    };
  }
};

export default chatReducer;
