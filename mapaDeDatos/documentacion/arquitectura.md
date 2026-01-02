# 🎯 ARQUITECTURA TIBACK-HELLO
## TiBACK - Sistema de Tickets - Guía Técnica Definitiva

---

## 📋 ESPECIFICACIONES TÉCNICAS

### 🎯 OBJETIVO ARQUITECTÓNICO
**Implementar una arquitectura robusta basada en tiback-hello con gestión de estado centralizada, eliminando useState y utilizando exclusivamente useReducer + Context API para máxima escalabilidad. El proyecto debe seguir una MODULARIDAD INTEGRAL en todas sus capas (Backend, Frontend, Base de Datos, CSS). Siempre usamos la mayor cantidad de Bootstrap posible en cada archivo, si existen cosas que son especificas de Css no hacemos estilos inline (prohibido), el css debe ser completamente modularizado en la carpeta "styles" (base, layout, components), quedando terminantemente prohibido centralizar todo en un solo archivo gigante "index.css"; este último solo debe contener imports. Nota: recordar que para despliegue solo usaremos el Pipfile este debe tener todo lo necesario del proyecto, requeriments.txt desaparece para despliegue., no tocar el .env**


### 🛠️ STACK TECNOLÓGICO

#### BACKEND:
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para base de datos
- **Flask-Admin** - Panel administrativo
- **JWT-Extended** - Autenticación JWT
- **Socket.IO** - WebSockets tiempo real
- **Cloudinary** - Gestión de imágenes

#### FRONTEND:
- **React 18** - Framework UI
- **Vite** - Build tool y dev server
- **React Router DOM** - Navegación SPA
- **Bootstrap 5** - Framework CSS responsive
- **Socket.IO Client** - WebSockets cliente
- **Chart.js** - Gráficos y visualizaciones

#### ARQUITECTURA:
- **useReducer + Context API** - Gestión de estado
- **crudActions centralizadas** - Lógica de negocio
- **FormData** - Manejo de formularios
- **Link declarativo** - Navegación sin useNavigate
- **Modularidad Integral** - Estructura desacoplada en Frontend (Componentes, Estilos) y Backend (Rutas, Modelos)

---

## 🏗️ ARQUITECTURA TIBACK-HELLO

### 🔥 RESTRICCIONES CRÍTICAS OBLIGATORIAS

#### ❌ PROHIBICIONES ABSOLUTAS:
- **NO useState** - Eliminado completamente de todos los componentes
- **NO useNavigate** - Reemplazado por Link declarativo
- **NO llamadas API directas** en componentes - Solo crudActions centralizadas
- **NO estados locales** - Solo useReducer + Context API
- **NO formularios controlados** - Solo FormData y defaultValue
- **NO Monolitos** - Prohibido código centralizado excesivo (CSS gigante, componentes "Dios", rutas sin separar)

#### ✅ OBLIGATORIOS:
- **useReducer + Context API** exclusivamente para estado
- **Link de react-router-dom** para navegación
- **crudActions centralizadas** en store.js
- **Bootstrap responsive** (col-6 col-md-4 col-lg-2)
- **FormData** en todos los formularios
- **defaultValue** para pre-carga de datos
- **Modularidad Integral** en todo el proyecto (src/front/styles, src/api/routes, src/front/components)

---

## 🔧 PATRONES DE IMPLEMENTACIÓN

### 🎯 PATRÓN ARQUITECTÓNICO ESTABLECIDO

#### 1. ESTRUCTURA DE COMPONENTE CRUD:
```javascript
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { crudActions } from "../store";

export const [Entidad] = () => {
  const { store, dispatch } = useGlobalReducer();
  
  // Funciones usando acciones centralizadas
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    // ... lógica con crudActions
  };
  
  useEffect(() => {
    crudActions.get[Entidades](dispatch);
  }, []);
  
  // JSX con Bootstrap responsive
};
```

#### 2. ESTRUCTURA DE FORMULARIO:
```javascript
<form onSubmit={handleSubmit}>
  <input 
    name="campo" 
    defaultValue={editingItem?.campo || ''} 
    required 
  />
  <button disabled={store.api.loading}>
    {store.api.loading ? 'Guardando...' : 'Guardar'}
  </button>
</form>
```

#### 3. NAVEGACIÓN DECLARATIVA:
```javascript
<Link to="/" className="btn btn-secondary">
  <i className="fas fa-home"></i> Volver al Home
</Link>
```

### 🎨 BOOTSTRAP RESPONSIVE OBLIGATORIO:
```html
<!-- Panel Home -->
<div className="col-6 col-md-4 col-lg-2">

<!-- Headers -->
<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">

<!-- Containers -->
<div className="container-fluid py-4">

<!-- Tables -->
<div className="table-responsive">
```

---

## 🎯 RESTRICCIONES DE CONTINUIDAD

### 🔒 REGLAS INQUEBRANTABLES PARA FUTURAS IMPLEMENTACIONES:

#### 1. GESTIÓN DE ESTADO:
- **JAMÁS usar useState** en componentes CRUD
- **SIEMPRE useReducer + Context API** exclusivamente
- **CENTRALIZAR** toda lógica en crudActions
- **ESTADOS UI** manejados por reducer global

#### 2. NAVEGACIÓN:
- **JAMÁS useNavigate** - Solo Link declarativo
- **SIEMPRE** navegación con componentes Link
- **RUTAS** declaradas en routes.jsx

#### 3. FORMULARIOS:
- **JAMÁS** formularios controlados con useState
- **SIEMPRE FormData** para captura de datos
- **defaultValue** para pre-carga en edición
- **Validación** HTML5 + backend

#### 4. API CALLS:
- **JAMÁS** fetch directo en componentes
- **SIEMPRE** crudActions centralizadas
- **Estados** de loading/error en store global
- **Manejo** de errores unificado

#### 5. MODULARIDAD INTEGRAL (OBLIGATORIA EN TODO EL PROYECTO):
- **Frontend (Estilos):**
  - **ESTRICTAMENTE MODULAR:**
    - `styles/base.css` (resets)
    - `styles/layout/` (navbar, footer)
    - `styles/components/` (cards, buttons)
    - `index.css` SOLO contiene imports
- **Frontend (Componentes):**
  - **Separación de Responsabilidades:** Vistas (Pages), Componentes Inteligentes (Containers) y Tontos (Presentational).
  - **Reutilización:** Componentes genéricos en `components/` compartidos.
- **Backend (API):**
  - **Rutas Separadas:** Un archivo de ruta por entidad (ej. `event_routes.py`, `auth_routes.py`).
- **PROHIBIDO** cualquier tipo de archivo monolítico (CSS gigante, app.py con todas las rutas, etc.)

---

## 🎯 COMANDOS TÁCTICOS

### 🚀 DESARROLLO:
```bash
# Backend
cd src/
python app.py

# Frontend  
npm run dev
```

### 🔧 ENTORNO DE DESARROLLO:
```bash
# URLs principales
Frontend: http://localhost:3000
Backend API: http://localhost:3001/api
Admin Panel: http://localhost:3001/admin
```

---

## 🏁 GUÍA DE IMPLEMENTACIÓN

**ARQUITECTURA TIBACK-HELLO PARA TROZOS DE PAN**

Esta guía define la arquitectura técnica obligatoria para el desarrollo de la aplicación Trozos de Pan. Todos los componentes deben seguir estrictamente estos patrones para garantizar:

✅ **Escalabilidad** - Store centralizado con useReducer  
✅ **Mantenibilidad** - Código consistente y predecible  
✅ **Performance** - Estados optimizados sin re-renders innecesarios  
✅ **Robustez** - Manejo centralizado de errores y loading  

**Fases de desarrollo recomendadas:**
1. **CRUDs básicos** siguiendo esta arquitectura
2. **Autenticación JWT** con roles
3. **WebSockets** para tiempo real
4. **Optimizaciones** avanzadas

## 🎭 ARQUITECTURA DE COMPONENTES COMPARTIDOS POR MÚLTIPLES ROLES

Este manifiesto define la estrategia para la construcción de vistas y componentes que son accedidos por más de un rol de usuario con diferentes niveles de permiso. El objetivo es maximizar la reutilización de código, minimizar la duplicación y crear una base de código mantenible y escalable.

### 🎯 1. PRINCIPIO FUNDAMENTAL: UNA VISTA, MÚLTIPLES CARAS

No se crearán páginas duplicadas para una misma entidad (ej. `TicketsAdmin.jsx`, `TicketsSupervisor.jsx`). En su lugar, se construirá una única página de gestión compartida (ej. `GestionTicketsPage.jsx`) que adaptará su interfaz y funcionalidades dinámicamente.

### 🧠 2. EL PATRÓN "INTELIGENTE/TONTO" (CONTAINER/PRESENTATIONAL)

Esta es la táctica principal de implementación.

#### **Componente Contenedor ("Inteligente"):**
- **Responsabilidad:** Lógica de negocio y manejo de datos
- **Ubicación:** `src/front/components/`
- **Tareas Clave:**
  - **Obtener Datos:** Es el único punto de contacto con la API para esa entidad
  - **Conocer el Contexto:** Identifica el rol y los permisos del usuario actual a través del estado global
  - **Gestionar el Estado:** Maneja los estados de carga, error y los datos obtenidos
  - **Delegar la Presentación:** Mapea los datos y los pasa como props a los componentes de presentación
  - **Renderizar Acciones Globales:** Muestra/oculta elementos de la interfaz a nivel de página (ej. botón "Crear Nuevo") basándose en el rol

#### **Componente de Presentación ("Tonto"):**
- **Responsabilidad:** Renderizar la UI y mostrar/ocultar acciones a nivel de ítem
- **Ubicación:** `src/front/components/`
- **Tareas Clave:**
  - **Recibir Datos:** Acepta datos y el rol del usuario exclusivamente a través de props
  - **Ser Predecible:** No tiene estado propio complejo ni llama a la API. Dado el mismo conjunto de props, siempre renderizará el mismo resultado
  - **Contener la Lógica Condicional de UI:** Es el guardián de los botones y acciones. Contiene las condiciones (`if rol === 'Supervisor' && estado === 'pendiente'`) que deciden qué controles son visibles
  - **Emitir Eventos:** No ejecuta la lógica de negocio directamente. Llama a funciones (que también recibe vía props desde el contenedor) para notificar que una acción debe ocurrir (ej. `onAssignClick()`)

### 📂 3. ESTRUCTURA DE ARCHIVOS Y ENRUTAMIENTO

- **Vistas Compartidas:** Cualquier página diseñada para ser utilizada por más de un rol (ej. `GestionTicketsPage.jsx`, `ReportesPage.jsx`) debe residir en la carpeta genérica `src/front/components/`. Esto comunica su naturaleza compartida.
- **Vistas Específicas de Rol:** La carpeta `src/front/protectedViewsRol/` está reservada exclusivamente para vistas que son 100% únicas para un solo rol y no serán reutilizadas (ej. el Dashboard principal del Administrador, la bandeja de asignaciones del Supervisor).
- **Enrutador (Router):** Las rutas protegidas para vistas compartidas (ej. `/admin/tickets`) apuntarán directamente al componente "Inteligente" en la carpeta components.

### ⚡ 4. FLUJO DE EJECUCIÓN (EL PLAN DE BATALLA EN ACCIÓN)

1. El usuario navega a una ruta de gestión (ej. `/supervisor/tickets`)
2. El enrutador carga el componente Contenedor "Inteligente" (`GestionTicketsPage.jsx`)
3. El Contenedor obtiene el rol del usuario y llama a la API para traer los datos
4. Una vez con los datos, el Contenedor mapea la lista y renderiza un componente de Presentación "Tonto" (`FilaTicket.jsx`) por cada ítem
5. A cada componente "Tonto" se le inyectan los datos del ítem, el rol del usuario y las funciones para manejar las acciones
6. Cada componente "Tonto" evalúa las props recibidas y decide internamente qué botones de acción (Asignar, Resolver, Cerrar) mostrar
7. El resultado es una interfaz cohesiva y dinámica, construida a partir de una única fuente de verdad, con responsabilidades claramente separadas

### 💡 INSTRUCCIÓN MAESTRA PARA COMPONENTES COMPARTIDOS

> **"Crea componentes 'tontos' de presentación y pásales el 'cerebro' (el rol del usuario) desde un único componente 'inteligente' contenedor, dejando que la lógica condicional revele las acciones permitidas."**




---

*Guía técnica actualizada - Noviembre 2025*  
*Arquitectura: tiback-hello ⚡*
