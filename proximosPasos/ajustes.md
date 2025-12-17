# 📋 PLAN DE AJUSTES - AUDITORÍA DEL PROYECTO TiBACK

> **Fecha:** 17 de Diciembre, 2024  
> **Rama:** `macroAjuste`  
> **Estado:** EN PROGRESO - PLANIFICANDO MODULARIZACIÓN

---

## 🚀 ESTADO ACTUAL (17/12/2024 - 17:55)

### ✅ INFRAESTRUCTURA CREADA

1. **Store Global Implementado:**
   - ✅ `store/slices/clienteSlice.js` - 60+ reducers listos
   - ✅ `store/actions/clienteActions.js` - 20+ acciones listas

2. **Componentes Extraídos (listos para usar):**
   - ✅ `components/ClienteDashboard.jsx` (251 líneas)
   - ✅ `components/ClienteTicketForm.jsx` (87 líneas)
   - ✅ `components/ClienteProfile.jsx` (151 líneas)
   - ✅ `components/ClienteTicketsList.jsx` (612 líneas)

### ⚠️ ClientePage.jsx - RESTAURADO A ORIGINAL
- **Estado actual:** 2934 líneas (original, sin cambios de arquitectura)
- **Motivo:** Los intentos de reemplazo masivo causaron errores sintácticos
- **Siguiente paso:** Crear plan de ataque detallado antes de modificar

### 📋 SIGUIENTE PASO
Ver plan detallado en: `proximosPasos/cirugia/clientePageModular.md`

---


## 🔍 RESUMEN DE AUDITORÍA

Se revisaron los 4 archivos de documentación:
- `corazon.md` - Historias de usuario y flujos
- `arquitectura.md` - Arquitectura tiback-hello
- `ATAQUE.md` - Plan de implementación
- `modular.md` - Regla de 500 líneas

### Reglas Principales Identificadas:
1. **❌ NO useState** - Solo useReducer + Context API
2. **❌ NO useNavigate** - Solo Link declarativo
3. **❌ NO llamadas API directas** - Solo crudActions centralizadas
4. **❌ NO archivos >500 líneas** - Modularidad obligatoria
5. **❌ NO formularios controlados** - Solo FormData + defaultValue
6. **✅ Bootstrap responsive** obligatorio
7. **✅ CSS modular** en styles/

---

## 🔴 VIOLACIONES CRÍTICAS ENCONTRADAS

### 1. Uso de `useState` (PROHIBIDO)

**Archivos que usan useState (TODOS deben migrar a useReducer):**
- [ ] `AuthForm.jsx`
- [ ] `AnalistasManager.jsx`
- [ ] `ChatAnalistaClienteEmbedded.jsx`
- [ ] `ClientesManager.jsx`
- [ ] `ComentariosManager.jsx`
- [ ] `ComentariosTicketEmbedded.jsx`
- [ ] `ImageUpload.jsx`
- [ ] `Ticket.jsx`
- [ ] `VerAdministrador.jsx`, `VerAnalista.jsx`, `VerAsignacion.jsx`
- [ ] `VerCliente.jsx`, `VerComentarios.jsx`, `VerGestion.jsx`, `VerTicket.jsx`
- [ ] `AdministradorPage.jsx`, `AnalistaPage.jsx`, `ClientePage.jsx`, `SupervisorPage.jsx`
- [ ] **Hooks creados también violan** (useClienteData, useSupervisorData, etc.)

**Impacto:** ~25+ archivos

---

### 2. Uso de `useNavigate` (PROHIBIDO)

**Archivos afectados:** ~20+ archivos deben migrar a Link declarativo

---

### 3. Archivos que exceden 500 líneas (PROHIBIDO)

| Archivo | Líneas | Exceso | Estado |
|---------|--------|--------|--------|
| `ClientePage.jsx` | **2,934** | +2,434 | 🔴 Crítico |
| `SupervisorPage.jsx` | ~2,900 | +2,400 | 🔴 Crítico |
| `AnalistaPage.jsx` | ~1,600 | +1,100 | 🔴 Crítico |
| `verTicketHDsupervisor.jsx` | ~700 | +200 | 🟡 Medio |
| `verTicketHDanalista.jsx` | ~600 | +100 | 🟡 Medio |
| `verTicketHDcliente.jsx` | ~500 | ~0 | 🟢 Límite |

---

## ✅ CUMPLIMIENTO CORRECTO

| Área | Estado | Detalle |
|------|--------|---------|
| CSS Modular | ✅ | `index.css` solo imports, `styles/` organizado |
| Store Modular | ✅ | `store.js` reducido, `store/` con slices |
| Backend Modular | ✅ | `routes/` con 15+ módulos separados |
| Hooks creados | ⚠️ | Existen pero no integrados y violan arquitectura |

---

## 📝 PLAN DE ACCIÓN

### FASE 1: Infraestructura Store [✅ COMPLETADO]

**Archivos creados para arquitectura tiback-hello:**

1. ✅ `store/slices/clienteSlice.js` - Estado y 60 reducers para ClientePage
2. ✅ `store/actions/clienteActions.js` - 20 acciones centralizadas (crudActions)
3. ✅ `store/slices/initialStore.js` - Actualizado con clientePage state
4. ✅ `store/index.js` - Integrado y exportando clienteReducer + clienteActions

---

### FASE 1.5: Refactorizar Pages [⏳ PENDIENTE]

**Objetivo:** Reducir Pages a <500 líneas usando el nuevo store

1. [ ] `ClientePage.jsx` (2934 líneas) → Usar store.clientePage + clienteActions
2. [ ] `SupervisorPage.jsx` (~2900 líneas) → Crear supervisorSlice + supervisorActions
3. [ ] `AnalistaPage.jsx` (~1600 líneas) → Crear analistaSlice + analistaActions
4. [ ] `AdministradorPage.jsx` → Crear adminSlice + adminActions

---

### FASE 2: Migración useState → useReducer [PENDIENTE]

**Nota:** La infraestructura creada permite migrar gradualmente

---

### FASE 3: Migración useNavigate → Link [PENDIENTE]

Reemplazar `navigate()` por `<Link to="/ruta">`

---

## 📊 MÉTRICAS

| Métrica | Estado |
|---------|--------|
| Regla 500 líneas | � 7 archivos exceden |
| Uso de useState | 🔴 ~25 archivos violan |
| Uso de useNavigate | 🔴 ~20 archivos violan |
| CSS Modular | ✅ Cumple |
| Store Modular | ✅ Cumple |
| Backend Modular | ✅ Cumple |

---

*Auditoría actualizada: 17/12/2024*  
*Arquitectura: tiback-hello ⚡*
