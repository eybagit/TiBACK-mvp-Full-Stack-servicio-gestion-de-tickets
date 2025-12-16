/**
 * Auth Slice - Reducer para autenticación
 */

export const authReducer = {
  auth_loading: (store, payload) => ({
    ...store,
    auth: { ...store.auth, isLoading: payload },
  }),

  auth_login_success: (store, payload) => ({
    ...store,
    auth: {
      ...store.auth,
      token: payload.token,
      isAuthenticated: true,
      isLoading: false,
    },
  }),

  auth_logout: (store) => ({
    ...store,
    auth: {
      token: null,
      isAuthenticated: false,
      isLoading: false,
    },
  }),

  auth_refresh_token: (store, payload) => ({
    ...store,
    auth: {
      ...store.auth,
      token: payload.token,
    },
  }),

  auth_restore_session: (store, payload) => ({
    ...store,
    auth: {
      ...store.auth,
      token: payload.token,
      isAuthenticated: !!payload.token,
      isLoading: false,
    },
  }),

  SET_USER: (store, payload) => ({
    ...store,
    auth: {
      ...store.auth,
      user: payload,
    },
  }),
};
