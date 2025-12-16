/**
 * Entity Slices - Reducers para entidades CRUD
 * Clientes, Analistas, Supervisores, Administradores, Tickets, etc.
 */

// Helper para crear reducers CRUD genéricos
const createEntityReducers = (entityName, singularName, listKey = null) => {
  const plural = listKey || entityName;
  const detail = `${singularName}Detail`;

  return {
    [`${entityName}_add`]: (store, payload) => ({
      ...store,
      [plural]: [...store[plural], payload],
      api: { loading: false, error: null },
    }),

    [`${entityName}_upsert`]: (store, payload) => {
      const item = payload;
      if (!item || !item.id) {
        console.warn(`${entityName}_upsert: payload inválido`, item);
        return store;
      }
      const exists = store[plural].some((x) => x && x.id === item.id);
      return {
        ...store,
        [plural]: exists
          ? store[plural].map((x) => (x && x.id === item.id ? item : x))
          : [...store[plural], item],
        api: { loading: false, error: null },
      };
    },

    [`${entityName}_remove`]: (store, payload) => ({
      ...store,
      [plural]: store[plural].filter((x) => x.id !== payload),
      api: { loading: false, error: null },
    }),

    [`${entityName}_set_list`]: (store, payload) => ({
      ...store,
      [plural]: payload,
      api: { loading: false, error: null },
    }),

    [`${singularName}_set_detail`]: (store, payload) => ({
      ...store,
      [detail]: payload,
      api: { loading: false, error: null },
    }),

    [`${singularName}_clear_detail`]: (store) => ({
      ...store,
      [detail]: null,
      api: { loading: false, error: null },
    }),
  };
};

// Reducers para Clientes
export const clientesReducer = createEntityReducers('clientes', 'cliente');

// Reducers para Analistas (con validación especial)
export const analistasReducer = {
  analistas_add: (store, payload) => {
    const analista = payload;
    if (!analista || !analista.id) {
      console.warn("analistas_add: payload inválido", analista);
      return store;
    }
    const exists = store.analistas.some((a) => a && a.id === analista.id);
    if (exists) {
      console.log("analistas_add: analista ya existe, ignorando duplicado", analista);
      return store;
    }
    return {
      ...store,
      analistas: [...store.analistas, analista],
      api: { loading: false, error: null },
    };
  },
  ...createEntityReducers('analistas', 'analista'),
};
// Sobrescribir el add generado
delete analistasReducer.analistas_add;
analistasReducer.analistas_add = (store, payload) => {
  const analista = payload;
  if (!analista || !analista.id) {
    console.warn("analistas_add: payload inválido", analista);
    return store;
  }
  const exists = store.analistas.some((a) => a && a.id === analista.id);
  if (exists) {
    return store;
  }
  return {
    ...store,
    analistas: [...store.analistas, analista],
    api: { loading: false, error: null },
  };
};

// Reducers para Supervisores
export const supervisoresReducer = createEntityReducers('supervisores', 'supervisor');

// Reducers para Administradores
export const administradoresReducer = createEntityReducers('administradores', 'administrador');

// Reducers para Comentarios
export const comentariosReducer = createEntityReducers('comentarios', 'comentario');

// Reducers para Asignaciones
export const asignacionesReducer = createEntityReducers('asignaciones', 'asignacion');

// Reducers para Gestiones
export const gestionesReducer = createEntityReducers('gestiones', 'gestion');

// Reducers para Tickets (con validación especial)
export const ticketsReducer = {
  tickets_add: (store, payload) => ({
    ...store,
    tickets: [...store.tickets, payload],
    api: { loading: false, error: null },
  }),

  tickets_upsert: (store, payload) => {
    const t = payload;
    if (!t || !t.id || typeof t.id !== "number") {
      console.warn("tickets_upsert: payload inválido", t);
      return store;
    }
    const exists = store.tickets.some((x) => x && x.id === t.id);
    return {
      ...store,
      tickets: exists
        ? store.tickets.map((x) => (x && x.id === t.id ? t : x))
        : [...store.tickets, t],
      api: { loading: false, error: null },
    };
  },

  tickets_remove: (store, payload) => ({
    ...store,
    tickets: store.tickets.filter((x) => x.id !== payload),
    api: { loading: false, error: null },
  }),

  tickets_set_list: (store, payload) => ({
    ...store,
    tickets: payload,
    api: { loading: false, error: null },
  }),

  ticket_set_detail: (store, payload) => ({
    ...store,
    ticketDetail: payload,
    api: { loading: false, error: null },
  }),

  ticket_clear_detail: (store) => ({
    ...store,
    ticketDetail: null,
    api: { loading: false, error: null },
  }),
};

// Reducers para Tickets Cerrados
export const ticketsCerradosReducer = {
  tickets_cerrados_add: (store, payload) => ({
    ...store,
    ticketsCerrados: [...store.ticketsCerrados, payload],
    api: { loading: false, error: null },
  }),

  tickets_cerrados_upsert: (store, payload) => {
    const t = payload;
    if (!t || !t.id || typeof t.id !== "number") {
      console.warn("tickets_cerrados_upsert: payload inválido", t);
      return store;
    }
    const exists = store.ticketsCerrados.some((x) => x && x.id === t.id);
    return {
      ...store,
      ticketsCerrados: exists
        ? store.ticketsCerrados.map((x) => (x && x.id === t.id ? t : x))
        : [...store.ticketsCerrados, t],
      api: { loading: false, error: null },
    };
  },

  tickets_cerrados_set_list: (store, payload) => ({
    ...store,
    ticketsCerrados: payload,
    api: { loading: false, error: null },
  }),
};

// API helpers
export const apiReducer = {
  api_loading: (store, payload) => ({ 
    ...store, 
    api: { ...store.api, loading: payload } 
  }),
  
  api_error: (store, payload) => ({ 
    ...store, 
    api: { loading: false, error: payload } 
  }),
};

// Misc reducers
export const miscReducer = {
  set_hello: (store, payload) => ({
    ...store,
    message: payload,
  }),

  add_task: (store, payload) => {
    const { id, color } = payload;
    return {
      ...store,
      todos: store.todos.map((todo) =>
        todo.id === id ? { ...todo, background: color } : todo
      ),
    };
  },
};
