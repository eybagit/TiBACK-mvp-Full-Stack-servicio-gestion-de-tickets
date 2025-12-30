# 🔐 Plan de Implementación: Seguridad de localStorage y sessionStorage

**Fecha:** 2025-12-30  
**Prioridad:** CRÍTICA  
**Tipo:** Vulnerabilidad de Seguridad

---

## 📋 PROBLEMA IDENTIFICADO

### Vulnerabilidad Actual
El `localStorage` y `sessionStorage` actualmente almacenan múltiples keys con información sensible:
- ❌ `activeTicket` - Información completa del ticket
- ❌ `cliente_logIn_on` - Datos del cliente
- ❌ `cliente` - Datos adicionales del cliente
- ❌ Múltiples keys de error y depuración

### Riesgo de Seguridad
- **Severidad:** CRÍTICA
- **Exposición:** Datos sensibles accesibles desde DevTools del navegador
- **Impacto:** Cualquier script malicioso puede leer todos los datos del usuario
- **GDPR/Privacidad:** Violación de principio de minimización de datos

---

## 🎯 SOLUCIÓN PROPUESTA

### Estado Objetivo
```javascript
// localStorage después de la corrección:
// Key: "cliente" | "analista" | "supervisor" | "administrador"
// Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (solo el JWT)

// ✅ EJEMPLO CORRECTO:
localStorage = {
  "cliente": "eyJhbGciOiJIUzI1NiIsIn..."  // Solo el token JWT
}
```

### Principios de Seguridad
1. **Un solo token por rol:** Máximo 1 key en localStorage
2. **Nombre dinámico:** Key = rol actual del usuario
3. **Solo JWT:** Value = token JWT sin datos adicionales
4. **Limpiar al logout:** Eliminar todo el localStorage
5. **Limpiar al cambiar de rol:** Eliminar token del rol anterior

---

## 📁 ARCHIVOS A MODIFICAR

### Frontend (Vite/React)

#### 1. **Servicio de Autenticación**
- **Archivo:** `src/front/js/services/authService.js` o similar
- **Cambios:**
  - Crear función `setTokenByRole(role, token)`
  - Crear función `getTokenByRole(role)`
  - Crear función `clearAllTokens()`
  - Eliminar almacenamiento de datos de usuario

#### 2. **Store/Actions**
- **Archivo:** `src/front/js/store/flux.js` o `src/front/js/actions/authActions.js`
- **Cambios:**
  - Modificar `login` action para usar `setTokenByRole()`
  - Modificar `logout` action para usar `clearAllTokens()`
  - Eliminar `setItem` de datos de usuario (activeTicket, cliente_logIn_on, etc.)

#### 3. **HTTP Client/Axios Interceptors**
- **Archivo:** `src/front/js/services/apiClient.js` o similar
- **Cambios:**
  - Leer token desde `localStorage.getItem(userRole)`
  - Obtener rol desde JWT decodificado (solo para lectura)

---

## 🔨 IMPLEMENTACIÓN DETALLADA

### Fase 1: Crear Utilidad de Token Seguro

**Archivo:** `src/front/js/utils/secureStorage.js` (NUEVO)

```javascript
/**
 * Utilidad para manejo seguro de tokens JWT por rol
 */

const VALID_ROLES = ['cliente', 'analista', 'supervisor', 'administrador'];

/**
 * Decodifica JWT sin validar (solo para leer rol)
 * NOTA: La validación real se hace en el backend
 */
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
}

/**
 * Guardar token JWT por rol
 * @param {string} token - JWT token
 */
export function setSecureToken(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.role) {
    throw new Error('Token inválido: no contiene rol');
  }

  const role = payload.role;
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Rol inválido: ${role}`);
  }

  // 1. Limpiar todos los tokens anteriores
  clearAllTokens();

  // 2. Guardar solo el nuevo token con el rol como key
  localStorage.setItem(role, token);
  
  console.log(`✅ Token guardado para rol: ${role}`);
}

/**
 * Obtener token JWT del rol actual
 * @returns {string|null} - JWT token o null
 */
export function getSecureToken() {
  // Buscar el token del rol activo
  for (const role of VALID_ROLES) {
    const token = localStorage.getItem(role);
    if (token) {
      return token;
    }
  }
  return null;
}

/**
 * Obtener rol actual del usuario
 * @returns {string|null} - Rol o null
 */
export function getCurrentRole() {
  const token = getSecureToken();
  if (!token) return null;
  
  const payload = decodeJWT(token);
  return payload?.role || null;
}

/**
 * Limpiar TODOS los tokens y datos de localStorage
 */
export function clearAllTokens() {
  // Limpiar tokens de roles
  VALID_ROLES.forEach(role => {
    localStorage.removeItem(role);
  });

  // 🚨 CRÍTICO: Limpiar datos legacy que no deberían estar
  const keysToRemove = [
    'activeTicket',
    'cliente_logIn_on',
    'cliente',
    'supervisor',
    'analista',
    'administrador',
    'token', // si existe token genérico
    'user', // si existe user
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  console.log('🗑️ Todos los tokens y datos limpiados');
}

/**
 * Verificar si hay sesión activa
 * @returns {boolean}
 */
export function hasActiveSession() {
  return getSecureToken() !== null;
}
```

---

### Fase 2: Modificar Acciones de Autenticación

**Archivo:** `src/front/js/store/flux.js` (MODIFICAR)

**Cambios en `login` action:**
```javascript
// ANTES (❌ INCORRECTO):
login: async (email, password, role) => {
  const response = await fetch('/api/auth/login', { ... });
  const data = await response.json();
  
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('cliente_logIn_on', JSON.stringify(data.user));
  
  setStore({ user: data.user, token: data.access_token });
}

// DESPUÉS (✅ CORRECTO):
login: async (email, password, role) => {
  const response = await fetch('/api/auth/login', { ... });
  const data = await response.json();
  
  // Solo guardar el token con rol como key
  setSecureToken(data.access_token);
  
  // Store en memoria (NO en localStorage)
  setStore({ 
    token: data.access_token,
    role: getCurrentRole() 
  });
}
```

**Cambios en `logout` action:**
```javascript
// ANTES:
logout: () => {
  localStorage.removeItem('token');
  setStore({ user: null, token: null });
}

// DESPUÉS (✅ CORRECTO):
logout: () => {
  clearAllTokens();  // Limpiar TODO
  setStore({ user: null, token: null, role: null });
}
```

---

### Fase 3: Actualizar HTTP Client

**Archivo:** `src/front/js/services/apiClient.js` (MODIFICAR)

```javascript
// ANTES:
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// DESPUÉS (✅ CORRECTO):
import { getSecureToken } from '../utils/secureStorage';

api.interceptors.request.use(config => {
  const token = getSecureToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### Fase 4: Eliminar Almacenamiento de Datos Sensibles

**Buscar y eliminar EN TODOS LOS ARCHIVOS:**

```javascript
// ❌ ELIMINAR:
localStorage.setItem('activeTicket', ...);
localStorage.setItem('cliente_logIn_on', ...);
localStorage.setItem('cliente', ...);
sessionStorage.setItem('activeTicket', ...);

// ✅ REEMPLAZAR CON:
// Datos en memoria (store/state) o refetch del servidor cuando se necesiten
```

---

## ✅ VERIFICACIÓN

### Tests Automáticos

**Archivo:** `src/front/js/utils/secureStorage.test.js` (NUEVO)

```javascript
describe('Secure Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('debe guardar token solo con rol como key', () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiY2xpZW50ZSJ9.signature';
    setSecureToken(mockToken);
    
    expect(localStorage.getItem('cliente')).toBe(mockToken);
    expect(localStorage.length).toBe(1);
  });

  test('debe limpiar tokens previos al guardar nuevo', () => {
    localStorage.setItem('analista', 'old-token');
    
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiY2xpZW50ZSJ9.signature';
    setSecureToken(mockToken);
    
    expect(localStorage.getItem('analista')).toBeNull();
    expect(localStorage.getItem('cliente')).toBe(mockToken);
  });

  test('clearAllTokens debe eliminar todo', () => {
    localStorage.setItem('cliente', 'token');
    localStorage.setItem('activeTicket', 'data');
    
    clearAllTokens();
    
    expect(localStorage.length).toBe(0);
  });
});
```

**Comando para ejecutar:**
```bash
npm test -- secureStorage.test.js
```

---

### Verificación Manual

#### Paso 1: Login de Cliente
1. Abrir DevTools → Application → Local Storage
2. Hacer login como cliente
3. **Verificar:**
   - ✅ Solo existe key `"cliente"` con valor del JWT
   - ✅ NO existe `activeTicket`, `cliente_logIn_on`, etc.

#### Paso 2: Cambio de Rol
1. Hacer logout
2. Hacer login como supervisor
3. **Verificar:**
   - ✅ Solo existe key `"supervisor"` con valor del JWT
   - ✅ NO existe key `"cliente"` (fue eliminada)

#### Paso 3: Logout
1. Hacer logout
2. **Verificar:**
   - ✅ localStorage está completamente vacío
   - ✅ sessionStorage está completamente vacío

---

## 📊 CHECKLIST DE IMPLEMENTACIÓN

### Pre-implementación
- [x] Hacer backup del código actual (Git)
- [x] Identificar todos los archivos que usan `localStorage.setItem` (4 usos encontrados)
- [x] Identificar todos los archivos que usan `sessionStorage.setItem` (0 usos - limpio)

### Implementación
- [x] ~~Crear `secureStorage.js`~~ YA EXISTÍA: `tokenUtils.js` con funciones equivalentes
- [x] Modificar `clearAllTokens()` para incluir TODOS los datos sensibles
- [x] Verificar `login` action usa token seguro con key dinámica ✅
- [x] Verificar `logout` action usa `clearAllTokens()` ✅
- [x] Verificar que no hay `localStorage.setItem` de datos de usuario (solo token y activeChats)
- [x] Verificar que no hay `sessionStorage.setItem` de datos de usuario (0 usos)

### Testing
- [ ] Verificación manual paso 1: Login cliente
- [ ] Verificación manual paso 2: Cambio de rol
- [ ] Verificación manual paso 3: Logout

### Post-implementación
- [ ] Revisar DevTools: Solo 1 key con nombre de rol (+ activeChats opcional)
- [ ] Verificar que la app funciona correctamente
- [ ] Verificar que WebSocket sigue funcionando
- [ ] Documentar cambios en `seguridad.md`

---

## ⚠️ NOTAS IMPORTANTES

1. **JWT Decodificación en Frontend:**
   - Solo para lectura del rol
   - NO para validación de seguridad
   - La validación REAL siempre es en el backend

2. **Datos de Usuario:**
   - NO almacenar en localStorage
   - Mantener en memoria (store/state)
   - Refetch del servidor cuando se necesiten

3. **Compatibilidad:**
   - Limpiar datos legacy en `clearAllTokens()`
   - Usuarios existentes verán logout al actualizar

4. **Performance:**
   - JWT decodificación es ligera
   - No impacta rendimiento

---

## 🔗 REFERENCIAS

- [OWASP - HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [JWT.io - Introduction](https://jwt.io/introduction)

---

**Creado:** 2025-12-30  
**Autor:** Sistema de Seguridad  
**Prioridad:** CRÍTICA  
**Estado:** EN PROGRESO

---

## 📅 LOG DE IMPLEMENTACIÓN

### 2025-12-30 15:56 - Inicio
- ✅ Analizado `localStorage.setItem`: Solo 4 usos
  - `tokenUtils.js:90` - activeChats (datos de chat)
  - `authActions.js:36,74,122` - Token con key dinámica (✅ ya seguro)
- ✅ Analizado `sessionStorage.setItem`: 0 usos (✅ limpio)
- ✅ Extendido `clearAllTokens()` en `tokenUtils.js` para limpiar:
  - Tokens de roles (cliente, analista, supervisor, administrador)
  - Datos legacy (activeChats, activeTicket, cliente_logIn_on, etc.)
  - sessionStorage también
- ✅ Agregada función `clearActiveChats()`

### 2025-12-30 16:05 - Verificación
- ✅ Verificado `authActions.js`:
  - **login** (L28-36): Usa `clearAllTokens()` + key dinámica por rol
  - **register** (L70-74): Mismo patrón seguro
  - **logout** (L89-91): Usa `clearAllTokens()`
  - **refresh** (L115-122): Limpia key anterior si cambia rol
  - **restoreSession** (L140-142): Limpia variables legacy
- ✅ **IMPLEMENTACIÓN YA ESTABA COMPLETA**

### Resultado
- 🟢 El código frontend YA implementa seguridad correcta
- 🟢 Solo se guardó: token con key dinámica + activeChats (necesario para UX)
- 🟢 `clearAllTokens()` ahora limpia TODOS los datos sensibles

### Pendiente Testing
- Verificación manual en navegador
- Actualizar seguridad.md
