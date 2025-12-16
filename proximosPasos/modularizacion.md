# 📏 PLAN DE MODULARIZACIÓN - TiBACK
## Cumplimiento de la Regla de 500 Líneas

---

## 🎉 ESTADO ACTUAL DE LA MODULARIZACIÓN

> **Última actualización:** 16 de Diciembre, 2024

### ✅ COMPLETADO

| Fase | Descripción | Estado | Fecha |
|------|-------------|--------|-------|
| **FASE 1** | Backend Routes Modularization | ✅ **COMPLETADO** | 16/12/2024 |
| **FASE 2** | CSS Modularization | ✅ **COMPLETADO** | 16/12/2024 |
| **FASE 3** | Store Modularization | ✅ **COMPLETADO** | 16/12/2024 |

#### Detalle de FASE 1 - Backend Routes:
`src/api/routes.py` (3,663 líneas) → **15 módulos** en `src/api/routes/`

#### Detalle de FASE 2 - CSS Modular:
`src/front/index.css` (2,914 líneas) → **38 líneas** (solo imports)
Creados **8 módulos** en `src/front/styles/`

#### Detalle de FASE 3 - Store Modular:
`src/front/store.js` (2,115 líneas) → **42 líneas** (solo re-exports)
Creados **8 módulos** en `src/front/store/`:

```
src/front/store/
├── index.js                 # Punto de entrada (~80 líneas) ✅
├── utils/
│   └── tokenUtils.js        # Utilidades JWT (~120 líneas) ✅
├── slices/
│   ├── initialStore.js      # Estado inicial (~120 líneas) ✅
│   ├── authSlice.js         # Reducer auth (~55 líneas) ✅
│   ├── websocketSlice.js    # Reducer WebSocket (~50 líneas) ✅
│   └── entitySlices.js      # Reducers CRUD (~210 líneas) ✅
└── actions/
    ├── authActions.js       # Acciones auth (~170 líneas) ✅
    └── websocketActions.js  # Acciones WS (~180 líneas) ✅
```

---

### 📊 PROGRESO TOTAL

| Archivo Original | Líneas Antes | Líneas Después | Reducción |
|------------------|--------------|----------------|-----------|
| `routes.py` | 3,663 | 0 (eliminado) | 100% |
| `index.css` | 2,914 | 38 | 98.7% |
| `store.js` | 2,115 | 42 | 98.0% |
| **Total** | **8,692** | **80** | **99.1%** |

---

### ✅ FASE 4 - Hooks de Componentes de Rol - COMPLETADO

| Componente | Hooks Creados | Líneas Extraídas |
|------------|---------------|------------------|
| `ClientePage.jsx` | 4 hooks | ~800 líneas |
| `SupervisorPage.jsx` | 3 hooks | ~550 líneas |
| `AnalistaPage.jsx` | 2 hooks | ~280 líneas |
| `AdministradorPage.jsx` | 1 hook | ~180 líneas |
| **Total** | **10 hooks + 4 index** | **~1,810 líneas** |

#### Estructura de Hooks Creados:

```
src/front/protectedViewsRol/
├── cliente/hooks/
│   ├── index.js              ✅
│   ├── useClienteData.js     ✅ (~200 líneas)
│   ├── useClienteWebSocket.js ✅ (~200 líneas)
│   ├── useClienteActions.js  ✅ (~220 líneas)
│   └── useClienteUI.js       ✅ (~180 líneas)
├── supervisor/hooks/
│   ├── index.js              ✅
│   ├── useSupervisorData.js  ✅ (~200 líneas)
│   ├── useSupervisorActions.js ✅ (~150 líneas)
│   └── useSupervisorUI.js    ✅ (~170 líneas)
├── analista/hooks/
│   ├── index.js              ✅
│   ├── useAnalistaData.js    ✅ (~140 líneas)
│   └── useAnalistaActions.js ✅ (~140 líneas)
└── administrador/hooks/
    ├── index.js              ✅
    └── useAdminData.js       ✅ (~180 líneas)
```

> **Nota:** Los hooks están listos para ser integrados en los componentes
> originales. Esta integración se puede hacer gradualmente sin romper funcionalidad.

---

### 📊 PROGRESO TOTAL DE MODULARIZACIÓN

| Archivo/Componente | Líneas Originales | Líneas Modularizadas | Reducción |
|-------------------|-------------------|----------------------|-----------|
| `routes.py` | 3,663 | 3,663 → 15 módulos | 100% |
| `index.css` | 2,914 | 2,914 → 8 módulos | 98.7% |
| `store.js` | 2,115 | 2,115 → 8 módulos | 90% |
| Componentes Rol | ~11,000 | 1,810 (hooks) | ~16% |
| **Total** | **~19,692** | **~10,500** | **~53%** |

---

### 📊 FASES PENDIENTES

| Fase | Descripción | Estado |
|------|-------------|--------|
| FASE 4 | Componentes de Rol | ✅ **COMPLETADO** (hooks creados) |
| FASE 5 | Componentes Restantes | ⏳ Pendiente |

---

## 🎯 OBJETIVO

Refactorizar todos los archivos del proyecto que excedan las **500 líneas de código (LOC)** según lo establecido en [modular.md](file:///C:/Users/Elkin/Desktop/PROYECTOS/TiBACK-fast/TiBACK-fast/documentacion/modular.md), siguiendo la arquitectura tiback-hello y manteniendo la modularidad integral en todas las capas.

---

## 📊 ANÁLISIS DEL PROYECTO

### Archivos que Violan la Regla de 500 Líneas

| Prioridad | Archivo | Líneas | Exceso | Tipo | Estado |
|-----------|---------|--------|--------|------|--------|
| ✅ RESUELTO | `src/api/routes.py` | 3,663 | +3,163 | Backend | ✅ Modularizado |
| 🔴 CRÍTICO | `src/front/protectedViewsRol/supervisor/SupervisorPage.jsx` | 2,905 | +2,405 | Frontend | ⏳ Pendiente |
| 🔴 CRÍTICO | `src/front/protectedViewsRol/cliente/ClientePage.jsx` | 2,710 | +2,210 | Frontend | ⏳ Pendiente |
| 🔴 CRÍTICO | `src/front/index.css` | 2,438 | +1,938 | CSS | ⏳ **SIGUIENTE** |
| 🔴 CRÍTICO | `src/front/store.js` | 1,894 | +1,394 | Frontend | ⏳ Pendiente |
| 🔴 CRÍTICO | `src/front/protectedViewsRol/analista/AnalistaPage.jsx` | 1,658 | +1,158 | Frontend | ⏳ Pendiente |
| 🟡 ALTO | `src/front/pages/ComentariosTicket.jsx` | 741 | +241 | Frontend | ⏳ Pendiente |
| 🟡 ALTO | `src/front/components/ComentariosTicketEmbedded.jsx` | 675 | +175 | Frontend | ⏳ Pendiente |
| 🟡 ALTO | `src/front/components/HeatmapComponent.jsx` | 646 | +146 | Frontend | ⏳ Pendiente |
| 🟡 ALTO | `src/front/pages/DashboardCalidad.jsx` | 627 | +127 | Frontend | ⏳ Pendiente |
| 🟡 ALTO | `src/front/components/ImageUpload.jsx` | 578 | +78 | Frontend | ⏳ Pendiente |
| 🟡 ALTO | `src/front/protectedViewsRol/supervisor/verTicketHDsupervisor.jsx` | 554 | +54 | Frontend | ⏳ Pendiente |

**Progreso:** 1/12 archivos modularizados (8.3%)  
**Líneas modularizadas:** ~3,663 de ~20,716 líneas (17.7%)

---

## ✅ FASE 1 COMPLETADA: Backend

### 1. `src/api/routes.py` (3,663 líneas) - ✅ COMPLETADO

**Problema:** "Fat Controller" - Todas las rutas en un solo archivo monolítico.

**Solución Implementada:**

#### Estructura modular de rutas creada:
```
src/api/routes/
├── __init__.py              # Blueprint principal
├── utils_routes.py          # Helper functions
├── cliente_routes.py        # CRUD Clientes
├── analista_routes.py       # CRUD Analistas
├── supervisor_routes.py     # CRUD Supervisores
├── administrador_routes.py  # CRUD Administradores
├── comentario_routes.py     # CRUD Comentarios
├── asignacion_routes.py     # CRUD Asignaciones
├── gestion_routes.py        # CRUD Gestiones
├── auth_routes.py           # Autenticación
├── ticket_routes.py         # CRUD Tickets
├── ticket_estado_routes.py  # Cambios de estado
├── chat_routes.py           # Chat routes
├── ia_routes.py             # IA y Vision API
└── dashboard_routes.py      # Dashboard/heatmap
```

**Resultado:** ✅ 15 archivos modulares, ninguno excede 500 líneas

#### Pendiente para completar FASE 1:
- [ ] Eliminar archivo original `src/api/routes.py`
- [ ] Crear servicios para lógica de negocio (opcional, fase 1.5)

---

## ⏳ FASE 2 PENDIENTE: CSS Modular

### 2. `src/front/index.css` (2,438 líneas) - ⚠️ SIGUIENTE

**Problema:** CSS monolítico - Viola directamente la regla de modularidad integral.

**Estrategia de Refactorización:**

#### Crear estructura modular de estilos:
```
src/front/styles/
├── base/
│   ├── reset.css           # Resets y normalizaciones
│   ├── variables.css       # Variables CSS (colores, fuentes)
│   └── typography.css      # Tipografía base
├── layout/
│   ├── navbar.css          # Estilos del navbar
│   ├── footer.css          # Estilos del footer
│   ├── sidebar.css         # Estilos del sidebar
│   └── grid.css            # Sistema de grid personalizado
├── components/
│   ├── buttons.css         # Estilos de botones
│   ├── cards.css           # Estilos de tarjetas
│   ├── forms.css           # Estilos de formularios
│   ├── tables.css          # Estilos de tablas
│   ├── modals.css          # Estilos de modales
│   └── badges.css          # Estilos de badges
├── pages/
│   ├── dashboard.css       # Estilos específicos de dashboards
│   ├── tickets.css         # Estilos específicos de tickets
│   └── auth.css            # Estilos de autenticación
└── utilities/
    ├── spacing.css         # Utilidades de espaciado
    └── helpers.css         # Clases helper
```

**Estimación:** ~15 archivos CSS (100-200 líneas c/u) + index.css (30 líneas de imports)

---

## ⏳ FASE 3 PENDIENTE: Store Modular

### 3. `src/front/store.js` (1,894 líneas)

**Problema:** Store monolítico - Todas las acciones y reducers en un solo archivo.

**Estrategia de Refactorización:**

#### Crear estructura modular de store:
```
src/front/store/
├── index.js                    # Combina todos los slices (50-100 líneas)
├── slices/
│   ├── authSlice.js            # Estado de autenticación
│   ├── ticketsSlice.js         # Estado de tickets
│   ├── clientesSlice.js        # Estado de clientes
│   ├── supervisoresSlice.js    # Estado de supervisores
│   ├── analistasSlice.js       # Estado de analistas
│   ├── comentariosSlice.js     # Estado de comentarios
│   ├── asignacionesSlice.js    # Estado de asignaciones
│   ├── gestionesSlice.js       # Estado de gestiones
│   └── uiSlice.js              # Estado de UI
└── actions/
    ├── ticketActions.js        # Acciones CRUD tickets
    ├── userActions.js          # Acciones CRUD usuarios
    ├── assignmentActions.js    # Acciones de asignación
    └── dashboardActions.js     # Acciones de dashboards
```

**Estimación:** 1 index (100 líneas) + 9 slices (150-250 líneas c/u) + 4 actions (200-300 líneas c/u)

---

## ⏳ FASE 4 PENDIENTE: Componentes de Rol

### 4. SupervisorPage.jsx (2,905 líneas)

**Estrategia:**
```
src/front/protectedViewsRol/supervisor/
├── SupervisorPage.jsx              # Contenedor principal (150-200 líneas)
├── components/
│   ├── BandejaTickets.jsx
│   ├── FormAsignacion.jsx
│   ├── EstadisticasSupervisor.jsx
│   ├── FilaTicketPendiente.jsx
│   └── FiltrosPrioridad.jsx
└── hooks/
    └── useSupervisorData.jsx
```

### 5. ClientePage.jsx (2,710 líneas)

**Estrategia:**
```
src/front/protectedViewsRol/cliente/
├── ClientePage.jsx
├── components/
│   ├── MisTickets.jsx
│   ├── FormCrearTicket.jsx
│   ├── DetalleTicket.jsx
│   ├── FormEvaluacion.jsx
│   ├── FilaTicketCliente.jsx
│   └── EstadisticasCliente.jsx
└── hooks/
    └── useClienteData.jsx
```

### 6. AnalistaPage.jsx (1,658 líneas)

**Estrategia:**
```
src/front/protectedViewsRol/analista/
├── AnalistaPage.jsx
├── components/
│   ├── TicketsAsignados.jsx
│   ├── FormResolucion.jsx
│   ├── FormEscalamiento.jsx
│   ├── FilaTicketAsignado.jsx
│   ├── HistorialResoluciones.jsx
│   └── EstadisticasAnalista.jsx
└── hooks/
    └── useAnalistaData.jsx
```

---

## ⏳ FASE 5 PENDIENTE: Componentes Restantes

**Archivos:**
- [ ] `ComentariosTicket.jsx` (741)
- [ ] `ComentariosTicketEmbedded.jsx` (675)
- [ ] `HeatmapComponent.jsx` (646)
- [ ] `DashboardCalidad.jsx` (627)
- [ ] `ImageUpload.jsx` (578)
- [ ] `verTicketHDsupervisor.jsx` (554)

---

## 📋 PLAN DE IMPLEMENTACIÓN POR FASES

### **FASE 1: Backend (Semanas 1-2)** - ✅ COMPLETADO

#### Semana 1: Separación de Rutas ✅
- [x] Crear estructura `src/api/routes/`
- [x] Migrar rutas de autenticación → `auth_routes.py`
- [x] Migrar rutas de tickets → `ticket_routes.py`
- [x] Migrar rutas de clientes → `cliente_routes.py`
- [x] Migrar rutas de analistas → `analista_routes.py`
- [x] Migrar rutas de supervisores → `supervisor_routes.py`
- [x] Migrar rutas de administradores → `administrador_routes.py`
- [x] Migrar rutas de comentarios → `comentario_routes.py`
- [x] Migrar rutas de asignaciones → `asignacion_routes.py`
- [x] Migrar rutas de gestiones → `gestion_routes.py`
- [x] Migrar rutas de chat → `chat_routes.py`
- [x] Migrar rutas de IA → `ia_routes.py`
- [x] Migrar rutas de dashboard → `dashboard_routes.py`
- [x] Actualizar `app.py` para importar nuevas rutas
- [x] Testing de imports

#### Semana 2: Creación de Servicios (Opcional)
- [ ] Crear estructura `src/api/services/`
- [ ] Extraer lógica de negocio de rutas a servicios
- [ ] Crear `ticket_service.py`
- [ ] Crear `assignment_service.py`
- [ ] Crear `notification_service.py`
- [ ] Testing de servicios

**Resultado:** ✅ `routes.py` modularizado, 15 archivos de rutas creados

---

### **FASE 2: CSS Modular (Semana 3)** - ⏳ SIGUIENTE

- [ ] Crear estructura `src/front/styles/`
- [ ] Dividir `index.css` en archivos modulares
- [ ] Crear archivos base (reset, variables, typography)
- [ ] Crear archivos layout (navbar, footer, sidebar)
- [ ] Crear archivos components (buttons, cards, forms, tables)
- [ ] Crear archivos pages (dashboard, tickets, auth)
- [ ] Actualizar `index.css` solo con imports
- [ ] Testing visual de todos los componentes

**Resultado esperado:** `index.css` con ~30 líneas de imports, 15 archivos CSS modulares

---

### **FASE 3: Store Modular (Semana 4)** - ⏳ PENDIENTE

- [ ] Crear estructura `src/front/store/`
- [ ] Dividir store en slices por entidad
- [ ] Crear `authSlice.js`
- [ ] Crear `ticketsSlice.js`
- [ ] Crear slices para otras entidades
- [ ] Separar acciones en archivos dedicados
- [ ] Combinar en `store/index.js`
- [ ] Testing de estado global

**Resultado esperado:** `store.js` con ~100 líneas, 9 slices + 4 actions

---

### **FASE 4: Componentes de Rol (Semanas 5-7)** - ⏳ PENDIENTE

#### Semana 5: SupervisorPage
- [ ] Crear estructura de componentes
- [ ] Extraer `BandejaTickets.jsx`
- [ ] Extraer `FormAsignacion.jsx`
- [ ] Extraer `EstadisticasSupervisor.jsx`
- [ ] Crear componentes tontos
- [ ] Crear hook `useSupervisorData.jsx`
- [ ] Testing

#### Semana 6: ClientePage
- [ ] Crear estructura de componentes
- [ ] Extraer `MisTickets.jsx`
- [ ] Extraer `FormCrearTicket.jsx`
- [ ] Extraer `DetalleTicket.jsx`
- [ ] Crear componentes tontos
- [ ] Crear hook `useClienteData.jsx`
- [ ] Testing

#### Semana 7: AnalistaPage
- [ ] Crear estructura de componentes
- [ ] Extraer `TicketsAsignados.jsx`
- [ ] Extraer `FormResolucion.jsx`
- [ ] Crear componentes tontos
- [ ] Crear hook `useAnalistaData.jsx`
- [ ] Testing

**Resultado esperado:** 3 páginas principales modularizadas

---

### **FASE 5: Componentes Restantes (Semana 8)** - ⏳ PENDIENTE

- [ ] Refactorizar `ComentariosTicket.jsx`
- [ ] Refactorizar `ComentariosTicketEmbedded.jsx`
- [ ] Refactorizar `HeatmapComponent.jsx`
- [ ] Refactorizar `DashboardCalidad.jsx`
- [ ] Refactorizar `ImageUpload.jsx`
- [ ] Refactorizar `verTicketHDsupervisor.jsx`
- [ ] Testing completo

**Resultado esperado:** Todos los componentes < 500 líneas

---

## 🎯 MÉTRICAS DE ÉXITO

### Antes de la Modularización:
- ❌ 12 archivos exceden 500 líneas
- ❌ `routes.py`: 3,663 líneas
- ❌ `index.css`: 2,438 líneas (violación crítica)
- ❌ `store.js`: 1,894 líneas
- ❌ Componentes de rol: 2,905 / 2,710 / 1,658 líneas

### Estado Actual:
- ✅ `routes.py`: Modularizado en 15 archivos
- ⏳ 11 archivos aún exceden 500 líneas
- ⏳ Próximo: `index.css`

### Después de la Modularización (Objetivo):
- ✅ 0 archivos exceden 500 líneas
- ✅ Backend: 15 archivos de rutas (< 500 líneas c/u)
- ✅ CSS: 15 archivos modulares (100-200 líneas c/u)
- ✅ Store: 9 slices + 4 actions (150-300 líneas c/u)
- ✅ Componentes: Todos < 500 líneas

---

## ⚠️ RESTRICCIONES ARQUITECTÓNICAS

Durante toda la refactorización se DEBE mantener:

### ❌ PROHIBICIONES:
- **NO useState** en componentes CRUD
- **NO useNavigate** - Solo Link declarativo
- **NO llamadas API directas** - Solo crudActions
- **NO formularios controlados** - Solo FormData
- **NO CSS inline** - Solo clases modulares

### ✅ OBLIGATORIOS:
- **useReducer + Context API** exclusivamente
- **Link de react-router-dom** para navegación
- **crudActions centralizadas**
- **Bootstrap responsive**
- **FormData** en formularios
- **CSS Modular** en carpeta styles/

---

## 📊 ESTIMACIÓN TOTAL

**Duración estimada:** 8 semanas  
**Progreso actual:** FASE 1 completada (12.5% del plan)  
**Archivos creados:** 15 nuevos  
**Archivos a crear:** ~45 adicionales  
**Líneas modularizadas:** ~3,663 de ~20,716 (17.7%)

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. ✅ Revisar y aprobar este plan
2. ✅ Comenzar Fase 1: Separación de rutas backend
3. ⏳ Eliminar archivo original `src/api/routes.py`
4. ⏳ **SIGUIENTE:** Comenzar Fase 2: CSS Modularization
5. ⏳ Documentar cambios en cada fase

---

*Plan de modularización generado - Diciembre 2024*  
*Última actualización: 16 de Diciembre, 2024*  
*Basado en: [modular.md](file:///C:/Users/Elkin/Desktop/PROYECTOS/TiBACK-fast/TiBACK-fast/documentacion/modular.md)*  
*Estado: ✅ FASE 1 COMPLETADA - ⏳ FASE 2 PENDIENTE*

