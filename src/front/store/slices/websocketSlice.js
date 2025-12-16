/**
 * WebSocket Slice - Reducer para WebSocket
 */

export const websocketReducer = {
  websocket_connecting: (store) => ({
    ...store,
    websocket: {
      ...store.websocket,
      connecting: true,
    },
  }),

  websocket_connected: (store, payload) => ({
    ...store,
    websocket: {
      ...store.websocket,
      socket: payload,
      connected: true,
      connecting: false,
    },
  }),

  websocket_disconnected: (store) => ({
    ...store,
    websocket: {
      ...store.websocket,
      socket: null,
      connected: false,
      connecting: false,
    },
  }),

  websocket_error: (store, payload) => ({
    ...store,
    websocket: {
      ...store.websocket,
      socket: null,
      connected: false,
      connecting: false,
      error: payload,
    },
  }),

  websocket_notification: (store, payload) => ({
    ...store,
    websocket: {
      ...store.websocket,
      notifications: [...store.websocket.notifications, payload],
    },
  }),
};
