/**
 * TiBACK Store - Re-export from modular structure
 * 
 * =====================================
 * IMPORTANTE: Este archivo ha sido modularizado
 * =====================================
 * 
 * Estructura modular en src/front/store/:
 * - utils/tokenUtils.js     → Utilidades de token JWT
 * - slices/                 → Reducers por entidad
 * - actions/                → Acciones auth y websocket
 * - index.js                → Punto de entrada
 * =====================================
 */

// Re-exportar todo desde la estructura modular
export {
  tokenUtils,
  updateActiveChat,
  findToken,
  clearAllTokens,
  initialStore,
  clienteActions,
  supervisorActions,
  analistaActions,
  adminActions,
  chatActions,
  iaActions,
} from './store/index.js';

// Importar acciones base
import { authActions as baseAuthActions } from './store/actions/authActions.js';
import { websocketActions } from './store/actions/websocketActions.js';

// Servicio de polling integrado
const pollingService = {
  intervals: new Map(),
  isActive: false,
  retryCounts: new Map(),
  lastCallbacks: new Map(),

  startPolling(type, callback, interval = 30000, options = {}) {
    if (this.intervals.has(type)) return;
    console.log(`🔄 Iniciando polling para ${type} cada ${interval}ms`);

    const pollFunction = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const token = localStorage.getItem("token");
        const response = await fetch(`${backendUrl}${this.getEndpoint(type)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        callback(data);
        this.retryCounts.set(type, 0);
      } catch (error) {
        console.error(`❌ Error en polling ${type}:`, error);
      }
    };

    pollFunction();
    const intervalId = setInterval(pollFunction, interval);
    this.intervals.set(type, intervalId);
    this.lastCallbacks.set(type, callback);
    this.isActive = true;
    return intervalId;
  },

  stopPolling(type) {
    const intervalId = this.intervals.get(type);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(type);
      this.lastCallbacks.delete(type);
    }
    if (this.intervals.size === 0) this.isActive = false;
  },

  stopAllPolling() {
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
    this.intervals.clear();
    this.lastCallbacks.clear();
    this.isActive = false;
  },

  getEndpoint(type) {
    const endpoints = {
      tickets: "/api/tickets",
      comentarios: "/api/comentarios",
      asignaciones: "/api/asignaciones",
      clientes: "/api/clientes",
      analistas: "/api/analistas",
      supervisores: "/api/supervisores",
      administradores: "/api/administradores",
      gestion: "/api/gestion",
    };
    return endpoints[type] || "/api/tickets";
  },

  getStats() {
    return {
      isActive: this.isActive,
      activePolling: Array.from(this.intervals.keys()),
      totalIntervals: this.intervals.size,
    };
  },
};

// Combinar authActions con websocketActions y funciones adicionales
export const authActions = {
  ...baseAuthActions,
  ...websocketActions,
  pollingService,

  // Funciones de sincronización
  requestSync: (socket, syncType = "all", userData = null) => {
    if (socket && socket.connected) {
      socket.emit("request_sync", { type: syncType });
    }
  },

  emitCriticalTicketAction: (socket, ticketId, action, userData = null) => {
    if (socket && socket.connected) {
      socket.emit("critical_ticket_action", { ticket_id: ticketId, action });
    }
  },

  joinCriticalRooms: (socket, ticketIds = [], userData = null) => {
    if (socket && socket.connected) {
      socket.emit("join_critical_rooms", { ticket_ids: ticketIds });
    }
  },

  joinAllCriticalRooms: (socket, userData) => {
    if (!socket || !userData) return;
    const { role, id } = userData;
    socket.emit("join_role_room", { role, user_id: id });
    socket.emit("join_critical_rooms", {
      role,
      user_id: id,
      critical_rooms: ["global_tickets", "global_chats", "critical_updates"],
    });
  },

  startRealtimeSync: (dispatch, config = {}, store = null) => {
    const triggerSync = (type = "manual") => {
      if (store?.websocket?.connected && store?.websocket?.socket) {
        authActions.requestSync(store.websocket.socket, type);
      }
    };
    return {
      triggerSync,
      startPolling: () => {},
      stopPolling: () => pollingService.stopAllPolling(),
      pollingStats: pollingService.getStats(),
    };
  },

  getRealtimeStatus: (store) => {
    const isConnected = store?.websocket?.connected || false;
    const isPolling = pollingService.isActive;

    return {
      isConnected,
      isPolling,
      lastSync: 0,
      statusColor: isConnected ? "text-green-500" : isPolling ? "text-yellow-500" : "text-red-500",
      statusText: isConnected ? "Conectado" : isPolling ? "Polling" : "Desconectado",
      statusIcon: isConnected ? "🟢" : isPolling ? "🟡" : "🔴",
      lastSyncFormatted: "Nunca",
      pollingStats: pollingService.getStats(),
      notifications: store?.websocket?.notifications?.length || 0,
    };
  },

  // Funciones de WebSocket rooms
  joinRoom: (socket, role, userId) => {
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
};

// Re-exportar el reducer principal como default
export { default } from './store/index.js';

// Compatibilidad: Exponer updateActiveChat globalmente
import { updateActiveChat } from './store/index.js';
if (typeof window !== 'undefined') {
  window.updateActiveChat = updateActiveChat;
}
