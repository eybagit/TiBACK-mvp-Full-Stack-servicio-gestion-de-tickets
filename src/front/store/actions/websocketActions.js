/**
 * @fileoverview WebSocket Actions - Acciones de WebSocket y sincronización
 * 
 * IMPORTANTE: Este archivo solo maneja conexión/desconexión y rooms.
 * Los handlers de eventos van en los hooks de cada rol:
 * - Supervisor: useWebSocketSync.js
 * - Analista: useAnalistaWebSocket.js
 * - Cliente: useClienteWebSocket.js
 * 
 * @module store/actions/websocketActions
 */

import { io } from "socket.io-client";
import { ReconnectionManager } from '../../utils/websocket-reconnect';
import { wsDebugger } from '../../utils/websocket-debug';

/**
 * @typedef {Object} Socket
 * @property {boolean} connected - Estado de conexión
 * @property {Function} emit - Emitir evento
 * @property {Function} on - Escuchar evento
 * @property {Function} off - Dejar de escuchar evento
 * @property {Function} disconnect - Desconectar
 * @property {Function} removeAllListeners - Remover todos los listeners
 */

/**
 * @typedef {Function} Dispatch
 * @param {Object} action - Acción a dispatch
 * @param {string} action.type - Tipo de acción
 * @param {*} [action.payload] - Payload opcional
 */

/**
 * @typedef {'supervisor' | 'analista' | 'cliente' | 'administrador'} UserRole
 */

/**
 * Acciones de WebSocket para el sistema TiBack
 * @namespace websocketActions
 */
// Gestor de reconexión (singleton)
let reconnectionManager = null;

export const websocketActions = {
  /**
   * Conectar WebSocket al servidor
   * @param {Dispatch} dispatch - Función dispatch del reducer
   * @param {string} token - Token JWT de autenticación
   * @returns {Socket|null} Socket conectado o null si falla
   */
  connectWebSocket: (dispatch, token) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) return null;

      // Inicializar gestor de reconexión si no existe
      if (!reconnectionManager) {
        reconnectionManager = new ReconnectionManager(10);
      }

      // Verificar si ya hay una conexión en progreso
      if (window.websocketConnecting) {
        console.log("🔄 WebSocket ya está conectando, esperando...");
        return null;
      }

      window.websocketConnecting = true;
      dispatch({ type: "websocket_connecting" });

      // Debug: Log inicio de conexión
      wsDebugger.logConnection(backendUrl);

      const socket = io(backendUrl, {
        transports: ["polling"],
        auth: { token },
        forceNew: true,
      });

      socket.on("connect", () => {
        window.websocketConnecting = false;
        
        // Debug: Log conexión exitosa
        wsDebugger.logConnected();
        
        // Reset reconexión al conectar exitosamente
        if (reconnectionManager) {
          const wasReconnecting = reconnectionManager.getStatus().isReconnecting;
          reconnectionManager.reset();
          
          if (wasReconnecting) {
            wsDebugger.logReconnected(reconnectionManager.currentAttempt || 1);
          }
        }
        
        dispatch({ type: "websocket_connected", payload: socket });
      });

      socket.on("disconnect", (reason) => {
        window.websocketConnecting = false;
        
        // Debug: Log desconexión
        wsDebugger.logDisconnect(reason);
        
        dispatch({ type: "websocket_disconnected" });
        
        // Reconexión automática (excepto si fue desconexión manual)
        if (reason !== "io client disconnect") {
          const reconnected = reconnectionManager.scheduleReconnect(
            () => websocketActions.connectWebSocket(dispatch, token),
            (attempt, delay) => {
              wsDebugger.logReconnectAttempt(attempt, delay);
              dispatch({ 
                type: "websocket_reconnecting", 
                payload: { attempt, delay } 
              });
            }
          );
          
          if (!reconnected) {
            wsDebugger.logReconnectFailed();
          }
        }
      });

      socket.on("connect_error", (error) => {
        window.websocketConnecting = false;
        const errorMessage = error.message || error.toString();
        const isFrameHeaderError =
          errorMessage.includes("Invalid frame header") ||
          errorMessage.includes("WebSocket connection failed");

        if (!isFrameHeaderError) {
          console.warn("Error de conexión WebSocket:", errorMessage);
          dispatch({ type: "websocket_error", payload: errorMessage });
        }
      });

      // Debug: Log todos los eventos (solo dev)
      if (import.meta.env.DEV) {
        socket.onAny((eventName, ...args) => {
          wsDebugger.logEvent(eventName, args[0]);
        });
      }

      // NOTA: Los handlers de eventos van en los hooks de cada rol
      // NO agregar handlers aquí para evitar duplicación

      return socket;
    } catch (error) {
      console.error("Error conectando WebSocket:", error);
      window.websocketConnecting = false;
      dispatch({ type: "websocket_disconnected" });
      return null;
    }
  },

  /**
   * Desconectar WebSocket del servidor
   * @param {Dispatch} dispatch - Función dispatch del reducer
   * @param {Socket} socket - Socket a desconectar
   */
  disconnectWebSocket: (dispatch, socket) => {
    if (socket) {
      // Cancelar reconexión automática al desconectar manualmente
      if (reconnectionManager) {
        reconnectionManager.cancel();
      }
      
      socket.removeAllListeners();
      socket.disconnect();
      dispatch({ type: "websocket_disconnected" });
    }
  },

  /**
   * Unirse a room específica de un ticket
   * @param {Socket} socket - Socket conectado
   * @param {number} ticketId - ID del ticket
   */
  joinTicketRoom: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_ticket", { ticket_id: ticketId });
    }
  },

  /**
   * Salir de room específica de un ticket
   * @param {Socket} socket - Socket conectado
   * @param {number} ticketId - ID del ticket
   */
  leaveTicketRoom: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_ticket", { ticket_id: ticketId });
    }
  },

  /**
   * Unirse a rooms según el rol del usuario
   * @param {Socket} socket - Socket conectado
   * @param {UserRole} role - Rol del usuario
   * @param {number} userId - ID del usuario
   */
  joinRoleRoom: (socket, role, userId) => {
    if (socket) {
      if (role === "supervisor") {
        socket.emit("join_room", "supervisores");
      } else if (role === "administrador") {
        socket.emit("join_room", "supervisores");
        socket.emit("join_room", "administradores");
      } else if (role === "analista") {
        socket.emit("join_room", "analistas");
        socket.emit("join_room", `analista_${userId}`);
      } else if (role === "cliente") {
        socket.emit("join_room", "clientes");
      }
    }
  },

  /**
   * Unirse al chat supervisor-analista de un ticket
   * @param {Socket} socket - Socket conectado
   * @param {number} ticketId - ID del ticket
   */
  joinChatSupervisorAnalista: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_chat_supervisor_analista", { ticket_id: ticketId });
    }
  },

  /**
   * Salir del chat supervisor-analista de un ticket
   * @param {Socket} socket - Socket conectado
   * @param {number} ticketId - ID del ticket
   */
  leaveChatSupervisorAnalista: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_chat_supervisor_analista", { ticket_id: ticketId });
    }
  },

  /**
   * Unirse al chat analista-cliente de un ticket
   * @param {Socket} socket - Socket conectado
   * @param {number} ticketId - ID del ticket
   */
  joinChatAnalistaCliente: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_chat_analista_cliente", { ticket_id: ticketId });
    }
  },

  /**
   * Salir del chat analista-cliente de un ticket
   * @param {Socket} socket - Socket conectado
   * @param {number} ticketId - ID del ticket
   */
  leaveChatAnalistaCliente: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_chat_analista_cliente", { ticket_id: ticketId });
    }
  },
};
