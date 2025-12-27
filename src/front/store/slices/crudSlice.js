/**
 * CRUD Slice - Estado y reducers para páginas CRUD genéricas
 * Arquitectura tiback-hello: useReducer + Context API exclusivamente
 * NO useState en ningún componente
 * 
 * Este slice maneja estados comunes para:
 * - Pages Ver* (VerTicket, VerCliente, VerAnalista, etc.)
 * - Pages Agregar* (AgregarTicket, AgregarCliente, etc.)
 * - Pages de listado (Tickets, Clientes, Analistas, etc.)
 */

// Estado inicial de CRUD
export const crudInitialState = {
  // === UI MODAL ===
  showModal: false,
  selectedImageIndex: 0,
  
  // === PAGINACIÓN ===
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  
  // === BÚSQUEDA Y FILTROS ===
  searchQuery: '',
  filters: {},
  sortBy: 'fecha_creacion',
  sortOrder: 'desc',
  
  // === FORMULARIOS ===
  formErrors: {},
  formSubmitting: false,
  formSuccess: false,
  
  // === ESTADOS DE CARGA ===
  loading: false,
  error: null,
  
  // === SELECCIÓN ===
  selectedItems: [],
  selectAll: false,
  
  // === CONFIRMACIÓN ===
  showConfirmDialog: false,
  confirmAction: null,
  confirmData: null,
};

/**
 * Reducers para el estado CRUD
 * Nomenclatura: CRUD_[ACCION]
 */
export const crudReducer = {
  // === UI MODAL ===
  CRUD_SET_SHOW_MODAL(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, showModal: payload }
    };
  },

  CRUD_SET_SELECTED_IMAGE_INDEX(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, selectedImageIndex: payload }
    };
  },

  CRUD_OPEN_IMAGE_MODAL(store, payload) {
    return {
      ...store,
      crud: {
        ...store.crud,
        showModal: true,
        selectedImageIndex: payload
      }
    };
  },

  CRUD_CLOSE_MODAL(store) {
    return {
      ...store,
      crud: { ...store.crud, showModal: false }
    };
  },

  // === PAGINACIÓN ===
  CRUD_SET_CURRENT_PAGE(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, currentPage: payload }
    };
  },

  CRUD_SET_ITEMS_PER_PAGE(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, itemsPerPage: payload, currentPage: 1 }
    };
  },

  CRUD_SET_TOTAL_ITEMS(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, totalItems: payload }
    };
  },

  // === BÚSQUEDA Y FILTROS ===
  CRUD_SET_SEARCH_QUERY(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, searchQuery: payload, currentPage: 1 }
    };
  },

  CRUD_SET_FILTERS(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, filters: { ...store.crud.filters, ...payload }, currentPage: 1 }
    };
  },

  CRUD_CLEAR_FILTERS(store) {
    return {
      ...store,
      crud: { ...store.crud, filters: {}, searchQuery: '', currentPage: 1 }
    };
  },

  CRUD_SET_SORT(store, payload) {
    return {
      ...store,
      crud: {
        ...store.crud,
        sortBy: payload.field,
        sortOrder: payload.order
      }
    };
  },

  // === FORMULARIOS ===
  CRUD_SET_FORM_ERRORS(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, formErrors: payload }
    };
  },

  CRUD_ADD_FORM_ERROR(store, payload) {
    return {
      ...store,
      crud: {
        ...store.crud,
        formErrors: { ...store.crud.formErrors, [payload.field]: payload.message }
      }
    };
  },

  CRUD_CLEAR_FORM_ERRORS(store) {
    return {
      ...store,
      crud: { ...store.crud, formErrors: {} }
    };
  },

  CRUD_SET_FORM_SUBMITTING(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, formSubmitting: payload }
    };
  },

  CRUD_SET_FORM_SUCCESS(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, formSuccess: payload }
    };
  },

  // === ESTADOS DE CARGA ===
  CRUD_SET_LOADING(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, loading: payload }
    };
  },

  CRUD_SET_ERROR(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, error: payload }
    };
  },

  // === SELECCIÓN ===
  CRUD_TOGGLE_SELECT_ITEM(store, payload) {
    const selected = store.crud.selectedItems.includes(payload)
      ? store.crud.selectedItems.filter(id => id !== payload)
      : [...store.crud.selectedItems, payload];
    return {
      ...store,
      crud: { ...store.crud, selectedItems: selected }
    };
  },

  CRUD_SET_SELECTED_ITEMS(store, payload) {
    return {
      ...store,
      crud: { ...store.crud, selectedItems: payload }
    };
  },

  CRUD_SELECT_ALL(store, payload) {
    return {
      ...store,
      crud: {
        ...store.crud,
        selectAll: true,
        selectedItems: payload
      }
    };
  },

  CRUD_DESELECT_ALL(store) {
    return {
      ...store,
      crud: { ...store.crud, selectAll: false, selectedItems: [] }
    };
  },

  // === CONFIRMACIÓN ===
  CRUD_SHOW_CONFIRM(store, payload) {
    return {
      ...store,
      crud: {
        ...store.crud,
        showConfirmDialog: true,
        confirmAction: payload.action,
        confirmData: payload.data
      }
    };
  },

  CRUD_HIDE_CONFIRM(store) {
    return {
      ...store,
      crud: {
        ...store.crud,
        showConfirmDialog: false,
        confirmAction: null,
        confirmData: null
      }
    };
  },

  // === RESET ===
  CRUD_RESET(store) {
    return {
      ...store,
      crud: { ...crudInitialState }
    };
  },

  CRUD_RESET_FORM(store) {
    return {
      ...store,
      crud: {
        ...store.crud,
        formErrors: {},
        formSubmitting: false,
        formSuccess: false,
        error: null
      }
    };
  }
};

export default crudReducer;
