/**
 * Auth Actions - Acciones de autenticación
 */

import { tokenUtils, findToken, clearAllTokens } from '../utils/tokenUtils.js';

export const authActions = {
  // Login
  login: async (email, password, role, dispatch) => {
    try {
      dispatch({ type: "auth_loading", payload: true });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en el login");
      }

      // SEGURIDAD: Guardar token con nombre dinámico según rol
      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || "usuario";

      // Limpiar tokens anteriores
      clearAllTokens();

      // Guardar con nombre dinámico del rol
      localStorage.setItem(dynamicKey, data.token);

      dispatch({
        type: "auth_login_success",
        payload: { token: data.token },
      });

      return { success: true, role: secureRole };
    } catch (error) {
      dispatch({ type: "auth_loading", payload: false });
      return { success: false, error: error.message };
    }
  },

  // Registro
  register: async (userData, dispatch) => {
    try {
      dispatch({ type: "auth_loading", payload: true });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en el registro");
      }

      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || "usuario";

      clearAllTokens();
      localStorage.setItem(dynamicKey, data.token);

      dispatch({
        type: "auth_login_success",
        payload: { token: data.token },
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: "auth_loading", payload: false });
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: (dispatch) => {
    clearAllTokens();
    dispatch({ type: "auth_logout" });
  },

  // Refresh token
  refresh: async (dispatch) => {
    try {
      const { token, key: currentKey } = findToken();
      if (!token) return false;

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error refreshing token");
      }

      const secureRole = tokenUtils.getRole(data.token);
      const dynamicKey = secureRole || "usuario";

      if (currentKey && currentKey !== dynamicKey) {
        localStorage.removeItem(currentKey);
      }

      localStorage.setItem(dynamicKey, data.token);

      dispatch({
        type: "auth_refresh_token",
        payload: { token: data.token },
      });

      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      authActions.logout(dispatch);
      return false;
    }
  },

  // Restore session
  restoreSession: (dispatch) => {
    try {
      // Limpiar variables vulnerables
      localStorage.removeItem("role");
      localStorage.removeItem("user");

      const { token } = findToken();

      if (token) {
        dispatch({
          type: "auth_restore_session",
          payload: { token },
        });
      } else {
        dispatch({ type: "auth_loading", payload: false });
      }
    } catch (error) {
      console.error("Error restoring session:", error);
      dispatch({ type: "auth_loading", payload: false });
    }
  },

  isTokenExpiringSoon: () => {
    try {
      const { token } = findToken();
      if (!token) return true;

      const payload = tokenUtils.decodeToken(token);
      if (!payload || !payload.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      return timeUntilExpiry < 3600; // 1 hour
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  },

  // Verificar roles
  hasRole: (token, allowedRoles) => {
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }
    const userRole = tokenUtils.getRole(token);
    return allowedRoles.includes(userRole);
  },
};
