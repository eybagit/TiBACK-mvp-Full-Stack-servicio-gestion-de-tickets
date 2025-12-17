/**
 * TiBACK Store - Main Entry Point
 * Archivo principal que combina todos los slices y exporta el reducer
 */

// Re-exportar utilidades
export { tokenUtils, updateActiveChat, findToken, clearAllTokens } from './utils/tokenUtils.js';

// Re-exportar estado inicial
export { initialStore } from './slices/initialStore.js';

// Re-exportar acciones
export { authActions } from './actions/authActions.js';
export { websocketActions } from './actions/websocketActions.js';
export { clienteActions } from './actions/clienteActions.js';

// Importar slices para combinar
import { authReducer } from './slices/authSlice.js';
import { websocketReducer } from './slices/websocketSlice.js';
import {
  clientesReducer,
  analistasReducer,
  supervisoresReducer,
  administradoresReducer,
  comentariosReducer,
  asignacionesReducer,
  gestionesReducer,
  ticketsReducer,
  ticketsCerradosReducer,
  apiReducer,
  miscReducer,
} from './slices/entitySlices.js';

// Importar slice de ClientePage (arquitectura tiback-hello)
import { clienteReducer } from './slices/clienteSlice.js';

// Combinar todos los reducers en un mapa
const allReducers = {
  ...authReducer,
  ...websocketReducer,
  ...clientesReducer,
  ...analistasReducer,
  ...supervisoresReducer,
  ...administradoresReducer,
  ...comentariosReducer,
  ...asignacionesReducer,
  ...gestionesReducer,
  ...ticketsReducer,
  ...ticketsCerradosReducer,
  ...apiReducer,
  ...miscReducer,
  // Reducer de ClientePage
  ...clienteReducer,
};

/**
 * Store Reducer Principal
 * Combina todos los slices en un único reducer
 */
export default function storeReducer(store, action = {}) {
  const { type, payload } = action;

  // Buscar el reducer correspondiente al tipo de acción
  const reducer = allReducers[type];

  if (reducer) {
    return reducer(store, payload);
  }

  // Si no se encuentra el reducer, devolver el estado sin cambios
  return store;
}

/*
 * =====================================
 * IMPORTANTE: Archivo modularizado
 * =====================================
 * Este archivo antes era store.js (~2,115 líneas)
 * Ahora es el punto de entrada modular (~70 líneas)
 * 
 * Estructura modular:
 * - store/utils/tokenUtils.js     → Utilidades de token
 * - store/slices/initialStore.js  → Estado inicial
 * - store/slices/authSlice.js     → Reducer auth
 * - store/slices/websocketSlice.js→ Reducer WebSocket
 * - store/slices/entitySlices.js  → Reducers CRUD
 * - store/actions/authActions.js  → Acciones auth
 * - store/actions/websocketActions.js → Acciones WS
 * =====================================
 */
