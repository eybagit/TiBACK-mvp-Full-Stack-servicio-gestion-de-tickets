# 📋 AJUSTES PENDIENTES - TiBACK

> **Última actualización:** 18 de Diciembre, 2025 (Sesión 3)  
> **Referencia:** `documentacion/` (arquitectura.md, modular.md, corazon.md, ATAQUE.md)

---

## ✅ COMPLETADO (18/12/2024)

### Capa de Servicios Backend - 100% ✅
| Servicio | Líneas | Responsabilidad |
|----------|--------|-----------------|
| `ticket_service.py` | ~200 | CRUD y asignación de tickets |
| `image_service.py` | ~75 | Upload y gestión de imágenes |
| `ia_service.py` | ~250 | Similitud semántica, OpenAI, Cloud Vision |
| `ticket_estado_service.py` | ~200 | Transiciones de estado por rol |

### Refactorización de Rutas - 100% ✅
| Ruta | Antes | Después | Reducción |
|------|-------|---------|-----------|
| `ia_routes.py` | 424 | 166 | -61% |
| `ticket_estado_routes.py` | 409 | 160 | -61% |
| `ticket_routes.py` | 487 | 248 | -49% |
| **TOTAL** | **1,320** | **574** | **-57%** |

### Estilos Inline - Archivos Refactorizados (45+ archivos) ✅
| Categoría | Archivos |
|-----------|----------|
| Cliente | TicketRow, ClienteImageModal, ClienteHeader, ClienteDashboard, VerTicketCliente, ClienteTicketsList, ClienteChat, ClientePage |
| Supervisor | SupervisorHeader, SupervisorDashboard, VerTicketSupervisor, InfoFormModal, TicketRow |
| Analista | AnalistaTicketsList, AnalistaHeader, AnalistaDashboard, VerTicketAnalista |
| Pages | VerTicket, Ticket, Clientes, Comentarios, IdentificarImagen, RecomendacionesSimilares, RecomendacionesGuardadas, AgregarTicket, Administrador, DashboardCalidad |
| Chat | ChatAnalistaCliente, ChatSupervisorAnalista, ChatAnalistaClienteEmbedded, ChatSupervisorAnalistaEmbedded |
| Components | SideBarCentral, RecomendacionModal, ProtectedRoute, IdentificarImagenEmbedded, ComentariosList, ComentarioForm, SemaforoTickets, ComentariosManager, ManagerAdministrador, GoogleMapsLocation, HeatmapComponent, CalidadCharts |

---

## 🟡 EN PROGRESO - ESTILOS INLINE

**Estado actual:** ~50 instancias restantes (antes ~140) - **~65% eliminado**

### Clases CSS en `helpers.css` (~400 líneas)
```css
/* Status dots */
.status-dot, .dot-ct-info

/* Imágenes */
.img-thumb-xs/sm/md/lg, .img-preview-sm/md/lg

/* Botones */
.btn-action-min, .btn-action-sm, .btn-sync, .btn-pill-hover, .btn-expand-toggle, .btn-send

/* Chat */
.chat-header-primary/warning, .chat-participant-icon, .chat-avatar
.chat-body, .chat-message-container, .chat-message-bubble
.chat-message-bubble-sent/received, .chat-message-text, .chat-message-meta

/* Modales */
.modal-show-transparent, .modal-backdrop-dark/light, .carousel-dot

/* Layout */
.container-sm/md, .th-expand, .card-gradient-purple, .text-truncate-cell

/* Sidebar */
.sidebar-user-avatar, .sidebar-user-name, .sidebar-user-role

/* Comentarios */
.comentarios-scroll, .avatar-comment, .whitespace-pre-wrap

/* Loading */
.loading-full-height, .loading-half-height

/* Maps */
.map-container-md/lg, .map-inner

/* Charts */
.chart-container-md, .chart-bar-column, .progress-thin

/* Utilidades */
.link-plain, .z-index-10/1000, .cursor-pointer, .select-min-width
```

### Archivos Pendientes (~50 instancias)
- Navbar.jsx (estilos de gradiente/colores)
- LandingComponent/* (Price, FeatureDesignPage, FeatureAppsPage, CardCreadores)
- Demo.jsx, HeatmapComponent, CalidadCharts (estilos dinámicos)

---

## 🔴 PENDIENTE - PRIORIDAD ALTA

### 1. Eliminar useState (~80 archivos)
### 2. Eliminar useNavigate (55 archivos)
### 3. Migrar Formularios a FormData (3 de ~20)

---

## 📊 RESUMEN DE CUMPLIMIENTO

| Restricción | Estado | Progreso |
|-------------|--------|----------|
| Límite 500 líneas | ✅ | 100% |
| Servicios backend | ✅ | 100% |
| CSS modular | ✅ | 100% |
| NO estilos inline | 🟡 | ~65% (45+ archivos, ~50 restantes) |
| NO useState | 🔴 | 0% |
| NO useNavigate | 🔴 | 0% |
| FormData | 🔴 | 15% |

---

---

## 📈 RESUMEN SESIÓN 2 (18/12/2025)

### Archivos Refactorizados Hoy
- ClienteChat, ClientePage, DashboardCalidad
- CalidadCharts, ComentarioForm, SemaforoTickets
- ComentariosManager, ManagerAdministrador
- GoogleMapsLocation, HeatmapComponent

### Clases CSS Nuevas
- `.map-container-md/lg`, `.map-inner`
- `.chart-container-md`, `.chart-bar-column`
- `.progress-thin`, `.select-min-width`

---

## 📈 RESUMEN SESIÓN 3 (18/12/2025)

### Estado Actual
- **Estilos inline:** ~50 instancias restantes (~65% completado)
- **Servicios backend:** 100% completado (4/4)
- **Rutas refactorizadas:** 100% completado (3/3)

### Próximos Pasos Inmediatos
1. Refactorizar `Navbar.jsx` (múltiples estilos de gradiente/colores)
2. Refactorizar `LandingComponent/*` (Price, FeatureDesignPage, FeatureAppsPage, CardCreadores)
3. Completar estilos inline restantes

### Próximas Fases
- **FASE 2:** Migrar useState (~80 archivos) → useReducer + Context API
- **FASE 3:** Eliminar useNavigate (55 archivos) → Link declarativo
- **FASE 4:** Migrar formularios a FormData (~20 formularios)

---

*Documento de seguimiento - TiBACK | 18/12/2025 (Sesión 3)*
