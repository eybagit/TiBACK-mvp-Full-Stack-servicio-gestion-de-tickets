# 📋 PLAN DE AJUSTES - AUDITORÍA DEL PROYECTO TiBACK

> **Fecha:** 16 de Diciembre, 2024  
> **Rama:** `macroAjuste`  
> **Estado:** PENDIENTE

---

## 🔍 RESUMEN DE AUDITORÍA

Se revisaron los 4 archivos de documentación:
- `corazon.md` - Historias de usuario y flujos
- `arquitectura.md` - Arquitectura tiback-hello
- `ATAQUE.md` - Plan de implementación
- `modular.md` - Regla de 500 líneas

---

## 🔴 VIOLACIONES CRÍTICAS ENCONTRADAS

### 1. Uso de `useState` (PROHIBIDO según arquitectura.md línea 44)

**Regla violada:** "❌ NO useState - Eliminado completamente de todos los componentes"

**Archivos que usan useState (TODOS deben migrar a useReducer):**
- [ ] `AuthForm.jsx`
- [ ] `AnalistasManager.jsx`
- [ ] `ChatAnalistaClienteEmbedded.jsx`
- [ ] `ClientesManager.jsx`
- [ ] `ComentariosManager.jsx`
- [ ] `ComentariosTicketEmbedded.jsx`
- [ ] `ImageUpload.jsx`
- [ ] `Ticket.jsx`
- [ ] `VerAdministrador.jsx`
- [ ] `VerAnalista.jsx`
- [ ] `VerAsignacion.jsx`
- [ ] `VerCliente.jsx`
- [ ] `VerComentarios.jsx`
- [ ] `VerGestion.jsx`
- [ ] `VerTicket.jsx`
- [ ] `AdministradorPage.jsx`
- [ ] `AnalistaPage.jsx`
- [ ] `ClientePage.jsx`
- [ ] `SupervisorPage.jsx`
- [ ] Y más...

**Impacto:** ~25+ archivos violan esta regla

---

### 2. Uso de `useNavigate` (PROHIBIDO según arquitectura.md línea 45)

**Regla violada:** "❌ NO useNavigate - Reemplazado por Link declarativo"

**Archivos que usan useNavigate (TODOS deben migrar a Link):**
- [ ] `AuthForm.jsx`
- [ ] `AnalistasManager.jsx`
- [ ] `ClientesManager.jsx`
- [ ] `ComentariosManager.jsx`
- [ ] `ComentariosTicketEmbedded.jsx`
- [ ] `Ticket.jsx`
- [ ] `VerAdministrador.jsx`
- [ ] `VerAnalista.jsx`
- [ ] `VerAsignacion.jsx`
- [ ] Y más...

**Impacto:** ~20+ archivos violan esta regla

---

### 3. Archivos que exceden 500 líneas (PROHIBIDO según modular.md)

**Regla violada:** "Límite Mandatorio: Ningún archivo debe superar las 500 líneas"

| Archivo | Líneas | Exceso | Hooks Creados |
|---------|--------|--------|---------------|
| `SupervisorPage.jsx` | 2,905 | +2,405 | ✅ 3 hooks |
| `ClientePage.jsx` | 2,710 | +2,210 | ✅ 4 hooks |
| `AnalistaPage.jsx` | 1,658 | +1,158 | ✅ 2 hooks |
| `ComentariosTicket.jsx` | 741 | +241 | ✅ Hook compartido |
| `ComentariosTicketEmbedded.jsx` | 675 | +175 | ✅ Reutiliza hook |
| `HeatmapComponent.jsx` | 646 | +146 | ✅ Hook compartido |
| `verTicketHDsupervisor.jsx` | 554 | +54 | ⏳ Pendiente |

> **Nota:** Ya se crearon hooks para extraer lógica, pero los componentes originales AÚN NO los usan.

---

## 🟡 OBSERVACIONES IMPORTANTES

### ✅ Cumplimiento Correcto

1. **CSS Modularizado** - `index.css` tiene solo 38 líneas (imports)
2. **Store Modularizado** - `store.js` reducido, lógica en módulos
3. **Backend Modularizado** - `routes/` con 15 módulos separados
4. **Hooks creados** - Lógica extraída para reutilización

### ⚠️ Deuda Técnica Significativa

La arquitectura tiback-hello especifica:
- **NO useState** → Usar `useReducer + Context API`
- **NO useNavigate** → Usar `Link` declarativo
- **Formularios no controlados** → Usar `FormData` + `defaultValue`

**El proyecto actualmente NO cumple estas reglas fundamentales.**

---

## 📝 PLAN DE ACCIÓN RECOMENDADO

### FASE 1: Prioridad ALTA - Componentes Grandes (Estimado: 4-6 horas)

1. **Integrar hooks existentes** en componentes de rol:
   - [ ] `ClientePage.jsx` → usar `useClienteData`, `useClienteUI`, etc.
   - [ ] `SupervisorPage.jsx` → usar `useSupervisorData`, etc.
   - [ ] `AnalistaPage.jsx` → usar `useAnalistaData`, etc.
   - [ ] `AdministradorPage.jsx` → usar `useAdminData`

2. **Reducir archivos grandes** a <500 líneas

---

### FASE 2: Prioridad MEDIA - Migración de useState (Estimado: 8-12 horas)

La migración completa de useState a useReducer es una tarea **MASIVA** que afecta:
- ~25+ componentes
- Toda la lógica de estado local
- Formularios controlados

**Recomendación:** Esta migración requiere una sesión dedicada y planificación detallada.

---

### FASE 3: Prioridad BAJA - Migración de useNavigate (Estimado: 2-3 horas)

Reemplazar `useNavigate` por `Link` es más sencillo:
- Identificar cada `navigate('/ruta')`
- Convertir a `<Link to="/ruta">`

---

## ❓ DECISIÓN REQUERIDA

Antes de proceder, necesito tu decisión:

1. **¿Ejecutar FASE 1?** - Integrar hooks existentes (bajo riesgo)
2. **¿Ejecutar FASE 2?** - Migrar useState (alto impacto, requiere tiempo)
3. **¿Ejecutar FASE 3?** - Migrar useNavigate (impacto medio)
4. **¿Priorizar algo diferente?**

> **Nota:** La migración completa a arquitectura tiback-hello pura es un esfuerzo significativo que podría impactar funcionalidad existente.

---

## 📊 MÉTRICAS ACTUALES

| Métrica | Estado |
|---------|--------|
| Regla 500 líneas | 🟡 Parcial (hooks creados, no integrados) |
| Uso de useState | 🔴 Violación masiva (~25 archivos) |
| Uso de useNavigate | 🔴 Violación masiva (~20 archivos) |
| CSS Modular | ✅ Cumple |
| Store Modular | ✅ Cumple |
| Backend Modular | ✅ Cumple |

---

*Auditoría realizada: 16/12/2024*  
*Arquitectura esperada: tiback-hello*
