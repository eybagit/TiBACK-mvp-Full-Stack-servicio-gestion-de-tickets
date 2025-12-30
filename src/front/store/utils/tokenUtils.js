/**
 * Token Utilities - Utilidades de token seguras
 * SOLO TOKEN COMO FUENTE DE VERDAD
 */

export const tokenUtils = {
  // Decodifica el token JWT
  decodeToken: (token) => {
    try {
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch (error) {
      return null;
    }
  },

  // Obtiene el rol del token
  getRole: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.role : null;
  },

  // Obtiene el ID del usuario del token
  getUserId: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.user_id : null;
  },

  // Obtiene el email del usuario del token
  getEmail: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.email : null;
  },

  // Verifica si el token es válido
  isValid: (token) => {
    const payload = tokenUtils.decodeToken(token);
    if (!payload || !payload.exp) return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  },

  // Genera hash transaccional dinámico basado en rol
  generateTransactionHash: (token) => {
    const role = tokenUtils.getRole(token);
    if (!role) return null;
    return btoa(token + role + Date.now());
  },

  // Obtiene nombre de variable transaccional dinámico
  getTransactionVariableName: (token) => {
    const role = tokenUtils.getRole(token);
    return role || "usuario";
  },
};

// Función global para manejar chats activos en localStorage
export const updateActiveChat = (
  ticketId,
  ticketTitle,
  userId,
  commentsCount = 0,
  messagesCount = 0
) => {
  try {
    const chatsData = localStorage.getItem("activeChats");
    let activeChats = chatsData ? JSON.parse(chatsData) : [];

    // Buscar si ya existe un chat para este ticket y usuario
    const existingChatIndex = activeChats.findIndex(
      (chat) => chat.ticketId === ticketId && chat.userId === userId
    );

    const chatData = {
      ticketId,
      ticketTitle,
      userId,
      commentsCount,
      messagesCount,
      lastActivity: new Date().toISOString(),
    };

    if (existingChatIndex !== -1) {
      activeChats[existingChatIndex] = chatData;
    } else {
      activeChats.push(chatData);
    }

    localStorage.setItem("activeChats", JSON.stringify(activeChats));
    window.dispatchEvent(new CustomEvent("activeChatsUpdated"));
    console.log("Chat activo actualizado:", chatData);
  } catch (error) {
    console.error("Error al actualizar chat activo:", error);
  }
};

// Función para buscar token en localStorage
export const findToken = () => {
  const possibleKeys = [
    "token",
    "cliente",
    "analista",
    "supervisor",
    "administrador",
    "usuario",
  ];
  
  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);
    if (value && tokenUtils.isValid(value)) {
      return { token: value, key };
    }
  }
  return { token: null, key: null };
};

// Función para limpiar tokens y TODOS los datos sensibles
export const clearAllTokens = () => {
  // 1. Limpiar tokens de roles
  const tokenKeys = [
    "token",
    "cliente",
    "analista",
    "supervisor",
    "administrador",
    "usuario",
  ];
  tokenKeys.forEach(key => localStorage.removeItem(key));

  // 2. 🚨 CRÍTICO: Limpiar datos legacy/sensibles que NO deben estar
  const legacyKeys = [
    "role",
    "user",
    "activeChats",       // Datos de chats activos
    "activeTicket",      // Información del ticket activo
    "cliente_logIn_on",  // Datos de login legacy
    "carrito_expira_en", // Datos de carrito (si existe)
    "session_data",      // Datos de sesión genéricos
  ];
  legacyKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('🔒 Todos los tokens y datos sensibles limpiados');
};

// Función para limpiar solo activeChats (sin cerrar sesión)
export const clearActiveChats = () => {
  localStorage.removeItem("activeChats");
  console.log('🗑️ Active chats limpiados');
};
