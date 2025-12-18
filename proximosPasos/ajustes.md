# 🎯 PLAN DE AJUSTES - TiBACK
## Cumplimiento 100% de Restricciones Arquitectónicas

> **Fecha:** 18 de Diciembre, 2024  
> **Documentos de referencia:**
> - `documentacion/arquitectura.md`
> - `documentacion/modular.md`
> - `documentacion/corazon.md`
> - `documentacion/ATAQUE.md`

---

## 📊 RESUMEN DE AUDITORÍA

| Restricción | Estado | Archivos Afectados |
|-------------|--------|-------------------|
| **Límite 500 líneas** | 🟡 97% | 1 archivo excede |
| **NO useState** | 🔴 0% | ~80+ archivos |
| **NO useNavigate** | 🔴 0% | 55 archivos |
| **CSS Modular** | ✅ 100% | Cumple |
| **Rutas separadas** | ✅ 100% | Cumple |
| **useGlobalReducer único** | ✅ 100% | Cumple |
| **Servicios backend** | 🔴 0% | No existe carpeta |
| **Fat Controllers** | 🟡 50% | 3 rutas grandes |

---

## 🔴 VIOLACIONES CRÍTICAS

### 1. USO DE useState (PROHIBIDO)
**Restricción:** "NO useState - Eliminado completamente de todos los componentes"

**Estado actual:** ~80+ archivos usan useState

**Archivos más críticos (por cantidad de useState):**
| Archivo | Usos de useState |
|---------|-----------------|
| `useHeatmap.js` | 9 |
| `ChatSupervisorAnalista.jsx` | 9 |
| `ChatAnalistaCliente.jsx` | 9 |
| `useComentariosData.js` | 8 |
| `useClienteTickets.js` | 8 |
| `RecomendacionesSimilares.jsx` | 8 |
| `IdentificarImagenEmbedded.jsx` | 8 |
| `useAnalistaPage.js` | 7 |
| `useAdminData.js` | 7 |
| `ChatSupervisorAnalistaEmbedded.jsx` | 7 |
| `ChatAnalistaClienteEmbedded.jsx` | 7 |

**Solución según arquitectura.md:**
- Migrar TODOS los useState a useReducer + Context API
- Centralizar estados en store global
- Usar crudActions para lógica de negocio

---

### 2. USO DE useNavigate (PROHIBIDO)
**Restricción:** "NO useNavigate - Reemplazado por Link declarativo"

**Estado actual:** 55 archivos usan useNavigate

**Archivos afectados:**
```
AuthForm.jsx, FeatureAppsPage.jsx, FeatureDesignPage.jsx,
LandNavbar.jsx, AnalistasManager.jsx, ClientesManager.jsx,
ComentariosManager.jsx, ManagerAdministrador.jsx, 
ManagerAsignacion.jsx, RecomendacionVista.jsx, SemaforoTickets.jsx,
ActualizarAdministrador.jsx, ActualizarAnalista.jsx, 
ActualizarAsignacion.jsx, ActualizarCliente.jsx, 
ActualizarComentarios.jsx, ActualizarGestion.jsx,
ActualizarSupervisor.jsx, ActualizarTicket.jsx, Administrador.jsx,
AgregarAdministrador.jsx, AgregarAnalista.jsx, AgregarAsignacion.jsx,
AgregarCliente.jsx, AgregarComentarios.jsx, AgregarGestion.jsx,
AgregarSupervisor.jsx, AgregarTicket.jsx, Analistas.jsx,
Asignacion.jsx, ChatAnalistaCliente.jsx, ChatSupervisorAnalista.jsx,
Clientes.jsx, Comentarios.jsx, ComentariosTicket.jsx, Gestion.jsx,
IdentificarImagen.jsx, RecomendacionesGuardadas.jsx,
RecomendacionesSimilares.jsx, Supervisor.jsx, Ticket.jsx,
VerAdministrador.jsx, VerAnalista.jsx, VerAsignacion.jsx,
VerCliente.jsx, VerComentarios.jsx, VerGestion.jsx, VerTicket.jsx,
AdministradorPage.jsx, useAnalistaPage.js, RankingAnalista.jsx,
VerTicketAnalista.jsx, useClientePage.js, VerTicketCliente.jsx,
useSupervisorPage.js
```

**Solución según arquitectura.md:**
- Reemplazar `navigate('/ruta')` por `<Link to="/ruta">`
- Para navegación programática, usar estado global + renderizado condicional

---

### 3. ARCHIVO QUE EXCEDE 500 LÍNEAS
**Restricción:** "Ningún archivo de código fuente debe superar las 500 líneas"

**Estado actual:** 1 archivo excede

| Archivo | Líneas | Exceso |
|---------|--------|--------|
| `components/ImageUpload.jsx` | 578 | +78 |

**Solución según modular.md:**
- Extraer lógica a hooks: `useImageUpload.js`, `useImagePreview.js`
- Separar componentes: `ImagePreview.jsx`, `ImageDropzone.jsx`

---

### 4. NO EXISTE CAPA DE SERVICIOS BACKEND
**Restricción:** "Lógica de negocio en servicios, no en rutas"

**Estado actual:** No existe carpeta `src/api/services/`

**Rutas con lógica de negocio (Fat Controllers):**
| Archivo | Líneas | Código Real |
|---------|--------|-------------|
| `ticket_routes.py` | 487 | 465 |
| `ia_routes.py` | 424 | 375 |
| `ticket_estado_routes.py` | 409 | 374 |

**Solución según modular.md:**
- Crear `src/api/services/`
- Mover lógica de negocio a servicios:
  - `ticket_service.py`
  - `ia_service.py`
  - `ticket_estado_service.py`
- Las rutas solo deben recibir request y devolver response

---

## 🟡 ARCHIVOS EN ZONA DE RIESGO (400-500 líneas)

### Frontend - Store (CRÍTICO)
| Archivo | Líneas | Margen |
|---------|--------|--------|
| `store/slices/clienteSlice.js` | 498 | 2 ⚠️ |
| `store/actions/clienteActions.js` | 421 | 79 |

### Frontend - Pages
| Archivo | Líneas | Margen |
|---------|--------|--------|
| `pages/ChatAnalistaCliente.jsx` | 482 | 18 |
| `pages/ChatSupervisorAnalista.jsx` | 482 | 18 |
| `pages/RecomendacionesSimilares.jsx` | 470 | 30 |
| `pages/IdentificarImagen.jsx` | 460 | 40 |
| `pages/RecomendacionesGuardadas.jsx` | 416 | 84 |

### Frontend - Components
| Archivo | Líneas | Margen |
|---------|--------|--------|
| `components/Footer.jsx` | 477 | 23 |
| `components/ChatAnalistaClienteEmbedded.jsx` | 406 | 94 |
| `components/ChatSupervisorAnalistaEmbedded.jsx` | 406 | 94 |
| `components/IdentificarImagenEmbedded.jsx` | 403 | 97 |

### Frontend - Protected Views
| Archivo | Líneas | Margen |
|---------|--------|--------|
| `administrador/AdministradorPage.jsx` | 474 | 26 |
| `cliente/components/TicketRow.jsx` | 431 | 69 |
| `analista/verTicketHDanalista.jsx` | 415 | 85 |

### Backend - Routes
| Archivo | Líneas | Margen |
|---------|--------|--------|
| `routes/ticket_routes.py` | 487 | 13 |
| `routes/ia_routes.py` | 424 | 76 |
| `routes/ticket_estado_routes.py` | 409 | 91 |

---

## ✅ RESTRICCIONES CUMPLIDAS

### 1. CSS Modular ✅
**Restricción:** "CSS debe ser completamente modularizado en carpeta styles"

**Estado actual:** CUMPLE
```
src/front/styles/
├── base/variables.css (57 líneas)
├── components/
│   ├── buttons.css (128 líneas)
│   ├── cards.css (80 líneas)
│   ├── status-dots.css (177 líneas)
│   └── timeline.css (65 líneas)
├── layout/hyper-layout.css (199 líneas)
├── themes/dark-theme.css (190 líneas)
└── utilities/helpers.css (68 líneas)

index.css: Solo imports (~40 líneas) ✅
```

### 2. Rutas Backend Separadas ✅
**Restricción:** "Un archivo de ruta por entidad"

**Estado actual:** CUMPLE
```
src/api/routes/
├── auth_routes.py
├── ticket_routes.py
├── cliente_routes.py
├── supervisor_routes.py
├── analista_routes.py
├── administrador_routes.py
├── comentario_routes.py
├── asignacion_routes.py
├── gestion_routes.py
├── ia_routes.py
├── chat_routes.py
├── dashboard_routes.py
├── ticket_estado_routes.py
└── utils_routes.py
```

### 3. useGlobalReducer Único ✅
**Restricción:** "useGlobalReducer es el ÚNICO hook de gestión de estado permitido"

**Estado actual:** CUMPLE
- `src/front/hooks/useGlobalReducer.jsx` (70 líneas)
- Es el único hook de gestión de estado global

### 4. Modelos de BD ✅
**Restricción:** "No modificar modelos de base de datos"

**Estado actual:** CUMPLE
- `src/api/models.py` (234 líneas) - Dentro del límite

---

## 🎯 PLAN DE ACCIÓN POR PRIORIDAD

### FASE 1: CRÍTICO (Inmediato)
**Objetivo:** Eliminar violaciones absolutas

#### 1.1 Modularizar ImageUpload.jsx
- [ ] Crear `hooks/useImageUpload.js`
- [ ] Crear `hooks/useImagePreview.js`
- [ ] Crear `components/ImagePreview.jsx`
- [ ] Crear `components/ImageDropzone.jsx`
- [ ] Reducir ImageUpload.jsx a <500 líneas

#### 1.2 Crear Capa de Servicios Backend
- [ ] Crear carpeta `src/api/services/`
- [ ] Crear `ticket_service.py` (extraer de ticket_routes.py)
- [ ] Crear `ia_service.py` (extraer de ia_routes.py)
- [ ] Crear `ticket_estado_service.py` (extraer de ticket_estado_routes.py)
- [ ] Refactorizar rutas para usar servicios

### FASE 2: ALTA PRIORIDAD (1-2 semanas)
**Objetivo:** Migrar useState a useReducer

#### 2.1 Migrar Hooks Principales
- [ ] `useAnalistaPage.js` - Migrar 7 useState
- [ ] `useClientePage.js` - Migrar useState
- [ ] `useSupervisorPage.js` - Migrar useState
- [ ] `useAdminData.js` - Migrar 7 useState

#### 2.2 Migrar Componentes de Chat
- [ ] `ChatAnalistaCliente.jsx` - Migrar 9 useState
- [ ] `ChatSupervisorAnalista.jsx` - Migrar 9 useState
- [ ] `ChatAnalistaClienteEmbedded.jsx` - Migrar 7 useState
- [ ] `ChatSupervisorAnalistaEmbedded.jsx` - Migrar 7 useState

### FASE 3: MEDIA PRIORIDAD (2-4 semanas)
**Objetivo:** Eliminar useNavigate

#### 3.1 Reemplazar useNavigate por Link
- [ ] Componentes de autenticación (AuthForm, etc.)
- [ ] Componentes de gestión (Managers)
- [ ] Componentes de actualización (Actualizar*)
- [ ] Componentes de agregar (Agregar*)
- [ ] Componentes de visualización (Ver*)

#### 3.2 Implementar Navegación Declarativa
- [ ] Crear sistema de navegación basado en estado
- [ ] Usar renderizado condicional para vistas

### FASE 4: PREVENTIVA (Continuo)
**Objetivo:** Mantener archivos bajo 500 líneas

#### 4.1 Monitorear Zona de Riesgo
- [ ] `clienteSlice.js` (498 líneas) - Dividir si crece
- [ ] `ticket_routes.py` (487 líneas) - Mover a servicio
- [ ] Chat components (482 líneas) - Extraer lógica

---

## 📋 CHECKLIST DE CUMPLIMIENTO

### Restricciones de arquitectura.md
- [ ] NO useState en componentes CRUD
- [ ] NO useNavigate - Solo Link declarativo
- [ ] NO llamadas API directas en componentes
- [ ] NO estados locales - Solo useReducer + Context
- [ ] NO formularios controlados - Solo FormData
- [ ] NO monolitos CSS
- [x] useReducer + Context API exclusivamente
- [x] Link de react-router-dom para navegación
- [x] crudActions centralizadas
- [x] Bootstrap responsive
- [x] FormData en formularios
- [x] defaultValue para pre-carga
- [x] Modularidad Integral

### Restricciones de modular.md
- [ ] Ningún archivo >500 líneas (1 pendiente)
- [x] Componentes UI en features/[feature]/components/
- [x] Lógica Frontend en store/slices/
- [ ] Lógica Backend en api/services/ (no existe)
- [x] Endpoints en api/routes/
- [x] Modelos en api/models.py

### Restricciones de ATAQUE.md
- [x] Modelo de BD sin cambios
- [x] Store centralizado con useReducer
- [ ] NO useState (violado)
- [ ] NO useNavigate (violado)
- [x] CSS Modular

---

## 📊 MÉTRICAS DE PROGRESO

| Métrica | Actual | Meta | % Cumplimiento |
|---------|--------|------|----------------|
| Archivos >500 líneas | 1 | 0 | 97% |
| Archivos con useState | ~80 | 0 | 0% |
| Archivos con useNavigate | 55 | 0 | 0% |
| Servicios backend | 0 | 3+ | 0% |
| CSS modular | ✅ | ✅ | 100% |
| Rutas separadas | ✅ | ✅ | 100% |

---

## ⚠️ NOTAS IMPORTANTES

### Sobre useState
La arquitectura tiback-hello prohíbe useState, pero el proyecto actual lo usa extensivamente. La migración completa requiere:
1. Definir nuevos slices en el store para cada dominio
2. Crear reducers para cada tipo de estado
3. Migrar componente por componente

### Sobre useNavigate
La navegación programática con useNavigate debe reemplazarse por:
1. Componentes `<Link>` para navegación declarativa
2. Estado global + renderizado condicional para navegación dinámica

### Sobre Servicios Backend
Las rutas actuales contienen lógica de negocio (Fat Controllers). Según modular.md:
- Las rutas solo deben recibir request y devolver response
- La lógica debe estar en servicios especializados

---

*Plan generado: 18/12/2024*  
*Arquitectura: tiback-hello ⚡*  
*Estado: PLAN DE ACCIÓN DEFINIDO*
