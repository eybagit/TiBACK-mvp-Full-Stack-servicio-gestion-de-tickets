# 🔬 PLAN DE CIRUGÍA QUIRÚRGICA - ClientePage.jsx

**ESTRATEGIA: PRIMERO modularizar (Estrictamente primero modularizamos y luego aplicamos buenas prácticas) (separar en componentes <500 líneas), DESPUÉS aplicar buenas prácticas**

> **Archivo:** `src/front/protectedViewsRol/cliente/ClientePage.jsx`  
> **Líneas originales:** 2934  
> **Líneas actuales:** 2098 ✅  
> **Meta:** < 500 líneas  
> **Fecha inicio:** 17 Diciembre 2024  

---

## 🛡️ ENFOQUE: CHECKPOINTS INCREMENTALES

### ¿Qué es?
Un sistema de **respaldo progresivo** que guarda el estado funcional del archivo después de cada extracción exitosa. Esto permite:

1. **Recuperación ante errores**: Si una edición rompe el código, puedes restaurar al último checkpoint funcional en segundos.
2. **Avance seguro**: Cada checkpoint representa un build exitoso verificado.
3. **No perder trabajo**: Nunca se restaura al archivo original de 2934 líneas, solo al último estado funcional.

### ¿Cómo funciona?

```
┌─────────────────────────────────────────────────────────────────────┐
│  CICLO DE TRABAJO CON CHECKPOINTS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. EXTRAER COMPONENTE                                             │
│      └── Crear ComponenteX.jsx con el bloque JSX                    │
│      └── Modificar ClientePage.jsx (reemplazar bloque → componente) │
│                                                                     │
│   2. VERIFICAR BUILD                                                │
│      └── npm run build                                              │
│      └── Si FALLA → Restaurar último checkpoint                     │
│      └── Si PASA → Continuar                                        │
│                                                                     │
│   3. GUARDAR CHECKPOINT                                             │
│      └── Copy-Item ClientePage.jsx → backups/checkpoint_N_XXXX.jsx  │
│                                                                     │
│   4. REPETIR hasta meta (<500 líneas)                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Comandos Útiles

```powershell
# Ver checkpoints disponibles
Get-ChildItem "proximosPasos\cirugia\backups"

# Restaurar a un checkpoint específico
Copy-Item "proximosPasos\cirugia\backups\ClientePage_checkpoint2_2098.jsx" "src\front\protectedViewsRol\cliente\ClientePage.jsx"

# Crear nuevo checkpoint después de build exitoso
Copy-Item "src\front\protectedViewsRol\cliente\ClientePage.jsx" "proximosPasos\cirugia\backups\ClientePage_checkpointN_XXXX.jsx"
```

### Regla de Oro
> ⚠️ **NUNCA restaurar al archivo original completo.** Siempre restaurar al checkpoint más reciente con build exitoso.

---



## 📊 PROGRESO DE MODULARIZACIÓN - ✅ META ALCANZADA

| Checkpoint | Descripción | Líneas ClientePage | Build | Componente creado |
|------------|-------------|-------------------|-------|-------------------|
| Original | Archivo sin modificar | 2934 | ✅ | - |
| CP#1 ✅ | Dashboard extraído | 2645 | ✅ | ClienteDashboard.jsx (290) |
| CP#2 ✅ | Tickets extraído | 2098 | ✅ | ClienteTicketsList.jsx (580) |
| CP#3 ✅ | Create + Profile + Chat | 1763 | ✅ | ClienteTicketForm (80) + ClienteProfile (150) + ClienteChat (200) |
| CP#4 ✅ | Modal extraído | 1740 | ✅ | ClienteImageModal.jsx (46) |
| CP#5 ✅ | Header extraído | 1552 | ✅ | ClienteHeader.jsx (230) |
| CP#6 ✅ | Lógica → useClientePage | 269 | ✅ | useClientePage.js (1413) |
| **CP#7** ✅ | **Hook dividido en 4** | **269** | ✅ | **4 hooks especializados** |

### 🎉 REDUCCIÓN FINAL: **2934 → 269** = **-2665 líneas (-91%!)**

### Estructura de archivos final:
```
src/front/protectedViewsRol/cliente/
├── ClientePage.jsx (269 líneas) ← Solo presentación
├── hooks/
│   ├── useClientePage.js (250 líneas) ← Hook principal (orquestador)
│   ├── useClienteUI.js (155 líneas) ← Sidebar, tema, búsqueda, filtros
│   ├── useClienteTickets.js (280 líneas) ← CRUD tickets
│   ├── useClienteProfile.js (175 líneas) ← Perfil usuario
│   ├── useClienteWebSocket.js (222 líneas) ← WebSocket, sync
│   └── index.js (9 líneas) ← Exportaciones
└── components/
    ├── ClienteDashboard.jsx (290 líneas)
    ├── ClienteTicketsList.jsx (135 líneas)
    ├── ClienteTicketForm.jsx (80 líneas)
    ├── ClienteProfile.jsx (149 líneas)
    ├── ClienteChat.jsx (198 líneas)
    ├── ClienteHeader.jsx (220 líneas)
    ├── ClienteImageModal.jsx (47 líneas)
    ├── TicketFilters.jsx (105 líneas)
    └── TicketRow.jsx (438 líneas)
```

### ✅ TODOS LOS ARCHIVOS <500 LÍNEAS



---





## 📊 MAPEO EXACTO DE LÍNEAS

```
ClientePage.jsx (2934 líneas totales)
│
├─── IMPORTS (1-12) ──────────────────────────────── 12 líneas
│    ├── React, useState, useEffect (1)
│    ├── useNavigate (2) ⚠️ VIOLACIÓN
│    ├── useGlobalReducer (3)
│    └── Componentes externos (4-12)
│
├─── function ClientePage() (14-2931) ────────────── 2918 líneas
│    │
│    ├─ █ BLOQUE useState #1 (14-51) ────────────── 38 líneas ⚠️ VIOLACIÓN
│    │   ├── selectedTicketImages, selectedImageIndex (16-17)
│    │   ├── newTicketImages, uploading (19-20)
│    │   ├── navigate = useNavigate() (27) ⚠️ VIOLACIÓN
│    │   ├── store, dispatch, etc. (28) ✅ OK
│    │   ├── tickets, loading, error (29-31)
│    │   ├── showInfoForm, updatingInfo, showTicketForm (32-34)
│    │   ├── userData, solicitudesReapertura (35-36)
│    │   ├── infoData (objeto 9 props) (37-47)
│    │   ├── ticketImageUrl, ticketsConRecomendaciones (48-49)
│    │   └── expandedTickets, clienteImageUrl (50-51)
│    │
│    ├─ █ FUNCIONES HANDLERS (53-1106) ──────────── 1054 líneas
│    │   ├── handleImageUpload (54-56) → setTicketImageUrl
│    │   ├── handleImageRemove (58-60) → setTicketImageUrl
│    │   ├── handleClienteImageUpload (62-70) → setClienteImageUrl, setUserData
│    │   ├── handleClienteImageRemove (72-79) → setClienteImageUrl, setUserData
│    │   ├── toggleTicketForm (81-87) → setShowTicketForm, setTicketImageUrl
│    │   ├── actualizarTickets (89-133) → setTickets, setSolicitudesReapertura, setError
│    │   ├── useEffect WebSocket (136-164) 
│    │   ├── useEffect tickets rooms (167-178)
│    │   ├── useEffect sincronización crítica (181-409) → setSolicitudesReapertura
│    │   ├── useEffect manual sync (411-422)
│    │   ├── useEffect total sync (424-459)
│    │   ├── useEffect critical update (461-480)
│    │   ├── useEffect notifications (482-546) → setTickets, setSolicitudesReapertura
│    │   ├── useEffect cargar datos (548-621) → setLoading, setUserData, setInfoData, setClienteImageUrl, setTickets, setError
│    │   ├── useEffect verificar recomendaciones (623-633)
│    │   ├── verificarRecomendaciones (635-735) → setTicketsConRecomendaciones
│    │   ├── crearTicket (737-831) → setTicketImageUrl, setShowTicketForm, setError, setUploading
│    │   ├── getEstadoColor (833-843) ✅ puro
│    │   ├── getPrioridadColor (845-852) ✅ puro
│    │   ├── evaluarTicket (854-875) → setError
│    │   ├── solicitarReapertura (877-943) → setSolicitudesReapertura, setError
│    │   ├── reabrirTicket (946-949)
│    │   ├── updateInfo (951-1015) → setUpdatingInfo, setError, setUserData, setShowInfoForm, setClienteImageUrl, setInfoData
│    │   ├── handleInfoChange (1017-1024) → setInfoData
│    │   ├── cerrarTicket (1026-1062) → setError
│    │   ├── handleLocationChange (1064-1071) → setInfoData
│    │   ├── generarRecomendacion (1073-1077) → setSelectedTicketId
│    │   ├── tieneAnalistaAsignado (1079-1082) ✅ puro
│    │   ├── getAnalistaAsignado (1084-1091) ✅ puro
│    │   └── getFechaAsignacion (1093-1106) ✅ puro
│    │
│    ├─ █ BLOQUE useState #2 (1109-1122) ─────────── 14 líneas ⚠️ VIOLACIÓN (diseño Hyper)
│    │   ├── sidebarCollapsed, sidebarHidden (1110-1111)
│    │   ├── activeView = 'dashboard' (1112)
│    │   ├── showUserDropdown (1113)
│    │   ├── selectedTicketId (1114)
│    │   ├── searchQuery, searchResults, showSearchResults (1115-1117)
│    │   ├── isDarkMode (1118)
│    │   └── showFilterDropdown, filterEstado, filterAsignado, filterPrioridad (1119-1122)
│    │
│    ├─ █ FUNCIONES UI (1124-1332) ───────────────── 209 líneas
│    │   ├── toggleSidebar (1125-1129) → setSidebarHidden
│    │   ├── changeView (1131-1144) → setActiveView, setSelectedTicketId
│    │   ├── handleSearch (1146-1166) → setSearchQuery, setSearchResults, setShowSearchResults
│    │   ├── selectTicketFromSearch (1168-1174) → setSearchQuery, setSearchResults, setShowSearchResults
│    │   ├── closeSearchResults (1176-1179) → setShowSearchResults
│    │   ├── toggleTheme (1181-1187) → setIsDarkMode
│    │   ├── applyFilters (1189-1192) → setShowFilterDropdown
│    │   ├── clearFilters (1194-1200) → setFilterEstado, setFilterAsignado, setFilterPrioridad, setShowFilterDropdown
│    │   ├── toggleTicketExpansion (1202-1213) → setExpandedTickets
│    │   ├── getFilteredTickets (1215-1245) ✅ puro
│    │   ├── useEffect click outside (1247-1265) → setShowUserDropdown, setShowSearchResults, setShowFilterDropdown
│    │   ├── useEffect dark mode (1267-1274)
│    │   └── useEffect sync mejorado (1276-1332) → setSolicitudesReapertura
│    │
│    └─ █ JSX RETURN (1343-2930) ─────────────────── 1588 líneas
│        │
│        ├─ SideBarCentral (1346-1350) ────────────── 5 líneas ✅ YA COMPONENTE
│        │
│        ├─ HEADER (1354-1564) ────────────────────── 211 líneas ⚡ EXTRAER
│        │   ├── Toggle sidebar (1358-1364)
│        │   ├── Búsqueda con resultados (1366-1432)
│        │   ├── Botón sincronizar (1436-1470)
│        │   └── Dropdown usuario (1472-1561) → navigate('/') en 1531 ⚠️
│        │
│        ├─ CONTENIDO (1566-2926) ─────────────────── 1361 líneas
│        │   │
│        │   ├─ Error alert (1568-1572) ───────────── 5 líneas
│        │   │
│        │   ├─ DASHBOARD VIEW (1574-1871) ────────── 298 líneas ⚡ EXTRAER
│        │   │   │  activeView === 'dashboard'
│        │   │   ├── Título (1577)
│        │   │   ├── Tarjetas métricas (1579-1621) - 3 cards
│        │   │   ├── Estadísticas adicionales (1623-1671) - 2 cards
│        │   │   ├── Distribución por estado (1673-1730) - 4 mini cards
│        │   │   ├── Tickets recientes (1732-1829) - tabla
│        │   │   └── Botón Ver Todos (1831-1868)
│        │   │
│        │   ├─ TICKETS VIEW (1873-2450) ──────────── 578 líneas ⚡ EXTRAER (MÁS GRANDE)
│        │   │   │  activeView === 'tickets'
│        │   │   ├── Título (1876)
│        │   │   ├── Header con filtros (1878-1967)
│        │   │   │   ├── Dropdown filtros (1882-1965) → setShowFilterDropdown, setFilterEstado, setFilterAsignado, setFilterPrioridad
│        │   │   ├── Loading/Empty states (1970-2002)
│        │   │   └── Tabla tickets (2004-2446)
│        │   │       ├── thead (2006-2018)
│        │   │       ├── tbody map tickets (2019-2442)
│        │   │       │   ├── Fila principal (2024-2310)
│        │   │       │   │   ├── Columna ID + imagen (2028-2043)
│        │   │       │   │   ├── Columna Título + desc (2044-2064)
│        │   │       │   │   ├── Columna Estado (2065-2087) + solicitud badge
│        │   │       │   │   ├── Columna Prioridad (2088-2100)
│        │   │       │   │   ├── Columna Analista (2101-2131)
│        │   │       │   │   ├── Columna Fecha (2132-2153)
│        │   │       │   │   ├── Columna Calificación (2154-2189)
│        │   │       │   │   ├── Columna Acciones (2190-2292)
│        │   │       │   │   │   ├── Ver detalles (2194-2202)
│        │   │       │   │   │   ├── Comentarios (2203-2212) → setSelectedTicketId
│        │   │       │   │   │   ├── Chat (2213-2222) → setSelectedTicketId
│        │   │       │   │   │   ├── IA dropdown (2227-2260) → setSelectedTicketId
│        │   │       │   │   │   ├── Sugerencias (2261-2269) → navigate() ⚠️ VIOLACIÓN
│        │   │       │   │   │   └── Cerrar/Reabrir (2271-2289)
│        │   │       │   │   └── Columna Expandir (2293-2309)
│        │   │       │   └── Fila expandida (2312-2439)
│        │   │       │       ├── Botones grandes (2319-2434)
│        │   │       │       └── navigate() en 2265, 2395 ⚠️ VIOLACIÓN
│        │   │
│        │   ├─ CREATE TICKET VIEW (2452-2520) ────── 69 líneas ⚡ EXTRAER
│        │   │   │  activeView === 'create'
│        │   │   ├── Título (2455)
│        │   │   ├── Formulario (2462-2517)
│        │   │   │   ├── Título input (2465-2474)
│        │   │   │   ├── Prioridad select (2475-2483)
│        │   │   │   ├── Descripción textarea (2484-2494)
│        │   │   │   ├── ImageUpload (2495-2501)
│        │   │   │   └── Botones submit (2502-2515)
│        │   │
│        │   ├─ PROFILE VIEW (2522-2658) ──────────── 137 líneas ⚡ EXTRAER
│        │   │   │  activeView === 'profile'
│        │   │   ├── Título (2526)
│        │   │   ├── Formulario campos (2533-2628)
│        │   │   │   ├── Nombre, Apellido (2534-2559)
│        │   │   │   ├── Email, Teléfono (2560-2584)
│        │   │   │   ├── GoogleMapsLocation (2585-2593)
│        │   │   │   ├── ImageUpload perfil (2594-2601)
│        │   │   │   └── Password, ConfirmPassword (2602-2627)
│        │   │   └── Botones guardar/cancelar (2629-2655) → setShowInfoForm
│        │   │
│        │   ├─ CHAT VIEW (2660-2833) ─────────────── 174 líneas ⚡ EXTRAER
│        │   │   │  activeView === 'chat'
│        │   │   ├── Título (2663)
│        │   │   ├── Widget (2665-2831)
│        │   │   │   ├── Table tickets (2670-2828)
│        │   │   │   │   ├── setSelectedTicketImages, setSelectedImageIndex (2728) ⚠️
│        │   │   │   │   └── navigate() en 2791 ⚠️ VIOLACIÓN
│        │   │
│        │   ├─ VISTAS EMBEBIDAS (2836-2894) ──────── 59 líneas ✅ YA COMPONENTES
│        │   │   ├── VerTicketHDCliente (2837-2854)
│        │   │   ├── ComentariosTicketEmbedded (2856-2864)
│        │   │   ├── ChatAnalistaClienteEmbedded (2866-2874)
│        │   │   ├── RecomendacionVistaEmbedded (2876-2884)
│        │   │   └── IdentificarImagenEmbedded (2886-2894)
│        │   │
│        │   └─ MODAL IMÁGENES (2896-2926) ────────── 31 líneas ⚡ EXTRAER
│        │       └── setSelectedTicketImages, setSelectedImageIndex (2899, 2904, 2911, 2912, 2918, 2924) ⚠️
│
└─── export default ClientePage (2933) ────────────── 2 líneas
```

---

## 🚨 INVENTARIO COMPLETO DE VIOLACIONES

### A. IMPORTS ILEGALES
| Línea | Código | Reemplazo |
|-------|--------|-----------|
| 2 | `import { useNavigate } from 'react-router-dom'` | `import { Link } from 'react-router-dom'` |

### B. useState ILEGALES (30 total)

#### Bloque #1 (líneas 14-51) - 17 estados:
| Estado | Línea | Acción store |
|--------|-------|--------------|
| `selectedTicketImages` | 16 | `CLIENTE_SET_SELECTED_TICKET_IMAGES` |
| `selectedImageIndex` | 17 | `CLIENTE_SET_SELECTED_IMAGE_INDEX` |
| `newTicketImages` | 19 | `CLIENTE_SET_NEW_TICKET_IMAGES` |
| `uploading` | 20 | `CLIENTE_SET_UPLOADING` |
| `tickets` | 29 | `CLIENTE_SET_TICKETS` |
| `loading` | 30 | `CLIENTE_SET_LOADING` |
| `error` | 31 | `CLIENTE_SET_ERROR` |
| `showInfoForm` | 32 | `CLIENTE_SET_SHOW_INFO_FORM` |
| `updatingInfo` | 33 | `CLIENTE_SET_UPDATING_INFO` |
| `showTicketForm` | 34 | `CLIENTE_SET_SHOW_TICKET_FORM` |
| `userData` | 35 | `CLIENTE_SET_USER_DATA` |
| `solicitudesReapertura` | 36 | `CLIENTE_SET_SOLICITUDES_REAPERTURA` |
| `infoData` | 37-47 | `CLIENTE_SET_INFO_DATA` |
| `ticketImageUrl` | 48 | `CLIENTE_SET_TICKET_IMAGE_URL` |
| `ticketsConRecomendaciones` | 49 | `CLIENTE_SET_TICKETS_CON_RECOMENDACIONES` |
| `expandedTickets` | 50 | `CLIENTE_SET_EXPANDED_TICKETS` |
| `clienteImageUrl` | 51 | `CLIENTE_SET_CLIENTE_IMAGE_URL` |

#### Bloque #2 (líneas 1109-1122) - 13 estados (Hyper):
| Estado | Línea | Acción store |
|--------|-------|--------------|
| `sidebarCollapsed` | 1110 | `CLIENTE_SET_SIDEBAR_COLLAPSED` |
| `sidebarHidden` | 1111 | `CLIENTE_TOGGLE_SIDEBAR` |
| `activeView` | 1112 | `CLIENTE_SET_ACTIVE_VIEW` |
| `showUserDropdown` | 1113 | `CLIENTE_SET_SHOW_USER_DROPDOWN` |
| `selectedTicketId` | 1114 | `CLIENTE_SET_SELECTED_TICKET_ID` |
| `searchQuery` | 1115 | `CLIENTE_SET_SEARCH_QUERY` |
| `searchResults` | 1116 | `CLIENTE_SET_SEARCH_RESULTS` |
| `showSearchResults` | 1117 | `CLIENTE_SET_SHOW_SEARCH_RESULTS` |
| `isDarkMode` | 1118 | `CLIENTE_SET_IS_DARK_MODE` |
| `showFilterDropdown` | 1119 | `CLIENTE_TOGGLE_FILTER_DROPDOWN` |
| `filterEstado` | 1120 | `CLIENTE_SET_FILTER_ESTADO` |
| `filterAsignado` | 1121 | `CLIENTE_SET_FILTER_ASIGNADO` |
| `filterPrioridad` | 1122 | `CLIENTE_SET_FILTER_PRIORIDAD` |

### C. navigate() ILEGALES
| Línea | Contexto | Código actual | Reemplazo |
|-------|----------|---------------|-----------|
| 1531 | Dropdown → Home | `navigate('/')` | `window.location.href = '/'` |
| 2265 | Sugerencias tickets view | `navigate(\`/ticket/${ticket.id}/recomendaciones-similares\`)` | `window.location.href = \`...\`` |
| 2395 | Sugerencias expandida | `navigate(\`/ticket/${ticket.id}/recomendaciones-similares\`)` | `window.location.href = \`...\`` |
| 2791 | Chat view → Ver ticket | `navigate(\`/cliente/ver-ticket/${ticket.id}\`)` | `window.location.href = \`...\`` |

---

## 📋 PLAN DE ATAQUE EN 5 FASES (ORDEN CRÍTICO)

### FASE 1: LIMPIAR IMPORTS Y useNavigate (5 minutos)
```diff
- import React, { useState, useEffect } from 'react';
- import { useNavigate } from 'react-router-dom';
+ import React, { useEffect } from 'react';
+ import { Link } from 'react-router-dom';
```

### FASE 2: ELIMINAR useState Y DESESTRUCTURAR STORE (30 minutos)

#### 2.1 Reemplazar líneas 14-51 con:
```javascript
function ClientePage() {
    const { store, logout, dispatch, connectWebSocket, disconnectWebSocket, joinRoom, joinTicketRoom, startRealtimeSync, emitCriticalTicketAction, joinCriticalRooms, joinAllCriticalRooms } = useGlobalReducer();
    
    // Desestructurar desde store.clientePage
    const {
        // Modal imágenes
        selectedTicketImages,
        selectedImageIndex,
        newTicketImages = [],
        uploading,
        // Tickets
        tickets = [],
        loading,
        error,
        // Formularios
        showInfoForm,
        updatingInfo,
        showTicketForm,
        // Usuario
        userData,
        infoData,
        clienteImageUrl,
        ticketImageUrl,
        // Sets (como arrays en store)
        solicitudesReapertura: solicitudesReaperturaArray = [],
        ticketsConRecomendaciones: ticketsConRecomendacionesArray = [],
        expandedTickets: expandedTicketsArray = [],
        // UI Hyper
        sidebarCollapsed,
        sidebarHidden,
        activeView = 'dashboard',
        showUserDropdown,
        selectedTicketId,
        searchQuery = '',
        searchResults = [],
        showSearchResults,
        isDarkMode,
        showFilterDropdown,
        filterEstado = '',
        filterAsignado = '',
        filterPrioridad = ''
    } = store.clientePage || {};
    
    // Convertir arrays a Sets para compatibilidad
    const solicitudesReapertura = new Set(solicitudesReaperturaArray);
    const ticketsConRecomendaciones = new Set(ticketsConRecomendacionesArray);
    const expandedTickets = new Set(expandedTicketsArray);
```

#### 2.2 ELIMINAR líneas 1109-1122 completamente (bloque useState #2)

### FASE 3: REEMPLAZAR TODOS LOS setXXX → dispatch (1-2 horas)

Cada función que use `setXXX` debe convertirse. Ejemplo:

```diff
// handleImageUpload línea 54-56
const handleImageUpload = (imageUrl) => {
-   setTicketImageUrl(imageUrl);
+   dispatch({ type: 'CLIENTE_SET_TICKET_IMAGE_URL', payload: imageUrl });
};

// toggleSidebar línea 1125-1129
const toggleSidebar = () => {
-   setSidebarHidden(!sidebarHidden);
+   dispatch({ type: 'CLIENTE_TOGGLE_SIDEBAR' });
};

// changeView línea 1131-1144
const changeView = (view) => {
-   setActiveView(view);
+   dispatch({ type: 'CLIENTE_SET_ACTIVE_VIEW', payload: view });
    if (view.startsWith('ticket-') || ...) {
        const ticketId = ...;
-       setSelectedTicketId(parseInt(ticketId));
+       dispatch({ type: 'CLIENTE_SET_SELECTED_TICKET_ID', payload: parseInt(ticketId) });
    } else {
-       setSelectedTicketId(null);
+       dispatch({ type: 'CLIENTE_SET_SELECTED_TICKET_ID', payload: null });
    }
};
```

### FASE 4: REEMPLAZAR navigate() → window.location.href (10 minutos)

| Línea | Cambio |
|-------|--------|
| 1531 | `navigate('/');` → `window.location.href = '/';` |
| 2265 | `navigate(\`/ticket/${ticket.id}/recomendaciones-similares\`);` → `window.location.href = \`/ticket/${ticket.id}/recomendaciones-similares\`;` |
| 2395 | igual |
| 2791 | `navigate(\`/cliente/ver-ticket/${ticket.id}\`);` → `window.location.href = \`/cliente/ver-ticket/${ticket.id}\`;` |

### FASE 5: EXTRAER COMPONENTES JSX (2-3 horas)

Después de que la arquitectura esté limpia, extraer las vistas:

| Vista | Líneas | Nuevo archivo | Prioridad |
|-------|--------|---------------|-----------|
| Dashboard | 1574-1871 | `ClienteDashboard.jsx` | ✅ YA EXISTE |
| Tickets | 1873-2450 | `ClienteTicketsList.jsx` | ✅ YA EXISTE |
| Create | 2452-2520 | `ClienteTicketForm.jsx` | ✅ YA EXISTE |
| Profile | 2522-2658 | `ClienteProfile.jsx` | ✅ YA EXISTE |
| Chat | 2660-2833 | `ClienteChat.jsx` | ⏳ CREAR |
| Header | 1354-1564 | `ClienteHeader.jsx` | ⏳ CREAR |
| Modal | 2896-2926 | `ClienteImageModal.jsx` | ⏳ CREAR |

---

## 🎯 RESULTADO FINAL ESPERADO

```javascript
// ClientePage.jsx reducido (~400 líneas)
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import { tokenUtils } from '../../store';
// Componentes
import { SideBarCentral } from '../../components/SideBarCentral';
import ClienteHeader from './components/ClienteHeader';
import ClienteDashboard from './components/ClienteDashboard';
import ClienteTicketsList from './components/ClienteTicketsList';
import ClienteTicketForm from './components/ClienteTicketForm';
import ClienteProfile from './components/ClienteProfile';
import ClienteChat from './components/ClienteChat';
import ClienteImageModal from './components/ClienteImageModal';
// Vistas embebidas
import { VerTicketHDCliente } from './verTicketHDcliente';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatAnalistaClienteEmbedded from '../../components/ChatAnalistaClienteEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';

function ClientePage() {
    const { store, dispatch, ... } = useGlobalReducer();
    const { /* todos los estados desde store.clientePage */ } = store.clientePage || {};
    
    // Funciones handlers puras (solo dispatch, no setXXX)
    // ...
    
    // useEffects para WebSocket y sincronización
    // ...
    
    return (
        <div className="hyper-layout d-flex">
            <SideBarCentral ... />
            <div className="hyper-main-content ...">
                <ClienteHeader ... />
                <div className="p-4">
                    {error && <div className="alert alert-danger">{error}</div>}
                    {activeView === 'dashboard' && <ClienteDashboard ... />}
                    {activeView === 'tickets' && <ClienteTicketsList ... />}
                    {activeView === 'create' && <ClienteTicketForm ... />}
                    {activeView === 'profile' && <ClienteProfile ... />}
                    {activeView === 'chat' && <ClienteChat ... />}
                    {/* Vistas embebidas */}
                    {activeView.startsWith('ticket-') && selectedTicketId && <VerTicketHDCliente ... />}
                    {activeView.startsWith('comentarios-') && selectedTicketId && <ComentariosTicketEmbedded ... />}
                    {activeView.startsWith('chat-') && selectedTicketId && <ChatAnalistaClienteEmbedded ... />}
                    {activeView.startsWith('recomendacion-') && selectedTicketId && <RecomendacionVistaEmbedded ... />}
                    {activeView.startsWith('identificar-') && selectedTicketId && <IdentificarImagenEmbedded ... />}
                    {selectedTicketImages && <ClienteImageModal ... />}
                </div>
            </div>
        </div>
    );
}

export default ClientePage;
```

---

## 📊 MÉTRICAS OBJETIVO

| Métrica | Antes | Después |
|---------|-------|---------|
| **Líneas ClientePage.jsx** | 2934 | ~400 |
| **useState** | 30 | 0 |
| **setXXX calls** | ~60 | 0 |
| **useNavigate** | 1 | 0 |
| **navigate() calls** | 4 | 0 |
| **Componentes extraídos** | 4 existentes | 7+ |

---

## ⚠️ REGLAS DE EJECUCIÓN

1. **UN CAMBIO A LA VEZ** - No hacer múltiples reemplazos masivos
2. **VERIFICAR BUILD DESPUÉS DE CADA FASE** - `npm run build`
3. **GUARDAR BACKUP ANTES** - `copy ClientePage.jsx ClientePage.jsx.backup`
4. **LOS NÚMEROS DE LÍNEA CAMBIAN** - Después de cada edición, recalcular posiciones
5. **NO USAR replace_file_content EN BLOQUES > 200 LÍNEAS** - Usar multi_replace_file_content o ediciones pequeñas
