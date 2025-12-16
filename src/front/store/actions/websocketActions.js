/**
 * WebSocket Actions - Acciones de WebSocket y sincronización
 */

import { io } from "socket.io-client";

export const websocketActions = {
  // Conectar WebSocket
  connectWebSocket: (dispatch, token) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) return null;

      // Verificar si ya hay una conexión en progreso
      if (window.websocketConnecting) {
        console.log("🔄 WebSocket ya está conectando, esperando...");
        return null;
      }

      // Verificar rate limiting
      const lastRetry = window.lastWebSocketRetry || 0;
      const now = Date.now();
      if (now - lastRetry < 5000) {
        console.log("⏳ Esperando antes del siguiente intento de conexión...");
        return null;
      }
      window.lastWebSocketRetry = now;
      window.websocketConnecting = true;

      dispatch({ type: "websocket_connecting" });

      const socket = io(backendUrl, {
        transports: ["polling"],
        auth: { token },
        forceNew: true,
      });

      socket.on("connect", () => {
        window.websocketConnecting = false;
        console.log("🔌 WebSocket conectado exitosamente");
        dispatch({ type: "websocket_connected", payload: socket });
      });

      socket.on("disconnect", (reason) => {
        window.websocketConnecting = false;
        if (reason !== "io client disconnect") {
          console.warn("WebSocket desconectado:", reason);
        }
        dispatch({ type: "websocket_disconnected" });
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

      // Eventos de tickets
      socket.on("nuevo_ticket", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        if (data.ticket) {
          dispatch({ type: "tickets_upsert", payload: data.ticket });
        }
      });

      socket.on("ticket_actualizado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        if (data.ticket) {
          dispatch({ type: "tickets_upsert", payload: data.ticket });
        }
      });

      socket.on("ticket_asignado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        if (data.ticket) {
          dispatch({ type: "tickets_upsert", payload: data.ticket });
        }
      });

      socket.on("nuevo_comentario", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        if (data.comentario) {
          dispatch({ type: "comentarios_add", payload: data.comentario });
        }
      });

      socket.on("ticket_eliminado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        dispatch({ type: "tickets_remove", payload: data.ticket_id });
      });

      socket.on("analista_creado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        dispatch({ type: "analistas_add", payload: data.analista });
      });

      socket.on("analista_eliminado", (data) => {
        dispatch({ type: "websocket_notification", payload: data });
        dispatch({ type: "analistas_remove", payload: data.analista_id });
      });

      return socket;
    } catch (error) {
      console.error("Error conectando WebSocket:", error);
      window.websocketConnecting = false;
      dispatch({ type: "websocket_disconnected" });
      return null;
    }
  },

  // Desconectar WebSocket
  disconnectWebSocket: (dispatch, socket) => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      dispatch({ type: "websocket_disconnected" });
    }
  },

  // Unirse a room de ticket
  joinTicketRoom: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_ticket", { ticket_id: ticketId });
    }
  },

  // Salir de room de ticket
  leaveTicketRoom: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_ticket", { ticket_id: ticketId });
    }
  },

  // Unirse a room de rol
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

  // Chat supervisor-analista
  joinChatSupervisorAnalista: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_chat_supervisor_analista", { ticket_id: ticketId });
    }
  },

  leaveChatSupervisorAnalista: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_chat_supervisor_analista", { ticket_id: ticketId });
    }
  },

  // Chat analista-cliente
  joinChatAnalistaCliente: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("join_chat_analista_cliente", { ticket_id: ticketId });
    }
  },

  leaveChatAnalistaCliente: (socket, ticketId) => {
    if (socket && ticketId) {
      socket.emit("leave_chat_analista_cliente", { ticket_id: ticketId });
    }
  },
};
