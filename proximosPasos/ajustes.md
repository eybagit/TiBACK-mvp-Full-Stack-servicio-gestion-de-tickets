# 📋 AJUSTES PENDIENTES - TiBACK

> **Última actualización:** 18 de Diciembre, 2024  
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

### Estilos Inline - Archivos Refactorizados (24+ archivos) ✅
| Categoría | Archivos |
|-----------|----------|
| Cliente | TicketRow, ClienteImageModal, ClienteHeader, ClienteDashboard, VerTicketCliente, ClienteTicketsList, ClienteChat |
| Supervisor | SupervisorHeader, SupervisorDashboard, VerTicketSupervisor, InfoFormModal, TicketRow |
| Analista | AnalistaTicketsList, AnalistaHeader, AnalistaDashboard, VerTicketAnalista |
| Pages | VerTicket, Ticket, Clientes, Comentarios |
| Chat | ChatAnalistaCliente, ChatSupervisorAnalista |

---

## 🟡 EN PROGRESO - ESTILOS INLINE

**Estado actual:** ~99 instancias restantes (antes ~140) - **~30% eliminado**

### Clases CSS en `helpers.css` (~310 líneas)
```css
/* Status dots */
.status-dot, .dot-ct-info

/* Imágenes */
.img-thumb-xs/sm/md/lg, .img-preview-md/lg

/* Botones */
.btn-action-min, .btn-sync, .btn-pill-hover, .btn-expand-toggle, .btn-send

/* Chat */
.chat-header-primary/warning, .chat-participant-icon, .chat-avatar
.chat-body, .chat-message-container, .chat-message-bubble
.chat-message-bubble-sent/received, .chat-message-text, .chat-message-meta

/* Modales */
.modal-show-transparent, .modal-backdrop-dark/light, .carousel-dot

/* Layout */
.container-sm/md, .th-expand, .card-gradient-purple, .text-truncate-cell

/* Utilidades */
.link-plain, .z-index-10/1000, .cursor-pointer
```

### Archivos Pendientes
- Componentes embedded de chat
- Componentes de IA (IdentificarImagen, RecomendacionesSimilares)
- Otros componentes menores

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
| NO estilos inline | 🟡 | ~30% (24+ archivos, ~99 restantes) |
| NO useState | 🔴 | 0% |
| NO useNavigate | 🔴 | 0% |
| FormData | 🔴 | 15% |

---

*Documento de seguimiento - TiBACK | 18/12/2024*
