# 🏗️ ARQUITECTURA DEL SISTEMA
## Fundamentos Universales para Proyectos Escalables y Mantenibles

---

## 📋 FILOSOFÍA ARQUITECTÓNICA

### 🎯 OBJETIVO FUNDAMENTAL
**Construir sistemas robustos, escalables y mantenibles mediante principios arquitectónicos sólidos, gestión de estado centralizada, modularidad integral, y separación estricta de responsabilidades en todas las capas del proyecto.**

### 🌟 PRINCIPIOS RECTORES

1. **Centralización del Estado**: Un único punto de verdad para el estado global de la aplicación
2. **Modularidad Integral**: Código desacoplado en todas las capas (Frontend, Backend, Estilos, Base de Datos)
3. **Separación de Responsabilidades**: Cada componente tiene una única responsabilidad clara
4. **Reutilización de Código**: Componentes y funciones genéricas compartidas
5. **Predecibilidad**: Dado el mismo input, siempre el mismo output
6. **Escalabilidad**: Arquitectura preparada para crecimiento futuro
7. **Mantenibilidad**: Código consistente, legible y fácil de modificar

---

## 🔧 FUNDAMENTOS DE GESTIÓN DE ESTADO

### 🎯 PATRÓN CENTRALIZADO: useReducer + Context API

#### PRINCIPIO FUNDAMENTAL:
**Eliminar estados locales dispersos y centralizar toda la gestión de estado en un store global único y predecible.**

#### VENTAJAS CLAVE:
- ✅ **Único punto de verdad**: Todo el estado en un lugar
- ✅ **Predecibilidad**: Flujo de datos unidireccional
- ✅ **Depuración**: Fácil rastreo de cambios de estado
- ✅ **Escalabilidad**: Preparado para aplicaciones complejas
- ✅ **Testing**: Estado aislado y testeable
- ✅ **Performance**: Evita re-renders innecesarios

#### ESTRUCTURA DEL STORE CENTRALIZADO:

```javascript
const initialStore = {
  // === ENTIDADES DEL NEGOCIO ===
  entities: {
    // Todas las entidades principales del dominio
    items: [],
    users: [],
    // ... otras entidades
  },
  
  // === ESTADOS DE INTERFAZ DE USUARIO ===
  ui: {
    // Controles de visualización
    showModal: false,
    activeView: 'list',
    selectedItemId: null,
    editingItemId: null,
    
    // Estados por módulo/feature
    moduleA: {
      showForm: false,
      filterActive: null
    },
    moduleB: {
      showDetails: false,
      sorting: 'asc'
    }
  },
  
  // === ESTADOS DE API CENTRALIZADOS ===
  api: {
    loading: false,
    error: null,
    lastFetch: null,
    notifications: []
  },
  
  // === AUTENTICACIÓN Y PERMISOS ===
  auth: {
    user: null,
    role: null,
    token: null,
    permissions: [],
    isAuthenticated: false
  }
}
```

#### PATRÓN DE REDUCER:

```javascript
const reducer = (state, action) => {
  switch (action.type) {
    // === ENTIDADES ===
    case 'SET_ENTITIES':
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.entityName]: action.payload
        }
      };
    
    // === UI ===
    case 'TOGGLE_UI':
      return {
        ...state,
        ui: {
          ...state.ui,
          [action.key]: !state.ui[action.key]
        }
      };
    
    // === API ===
    case 'API_START':
      return {
        ...state,
        api: { ...state.api, loading: true, error: null }
      };
    
    case 'API_SUCCESS':
      return {
        ...state,
        api: { ...state.api, loading: false }
      };
    
    case 'API_ERROR':
      return {
        ...state,
        api: { ...state.api, loading: false, error: action.payload }
      };
    
    // === AUTH ===
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        auth: {
          user: action.payload.user,
          role: action.payload.role,
          token: action.payload.token,
          permissions: action.payload.permissions,
          isAuthenticated: true
        }
      };
    
    case 'LOGOUT':
      return {
        ...state,
        auth: {
          user: null,
          role: null,
          token: null,
          permissions: [],
          isAuthenticated: false
        }
      };
    
    default:
      return state;
  }
};
```

---

## 🎯 ACCIONES CENTRALIZADAS (crudActions)

### PRINCIPIO FUNDAMENTAL:
**Toda la lógica de negocio y llamadas a API deben estar centralizadas en acciones reutilizables, nunca directamente en componentes.**

### ESTRUCTURA DE ACCIONES:

```javascript
const crudActions = {
  // === AUTENTICACIÓN ===
  login: async (dispatch, credentials) => {
    dispatch({ type: 'API_START' });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const data = await response.json();
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      dispatch({ type: 'API_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'API_ERROR', payload: error.message });
    }
  },
  
  logout: (dispatch) => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('token');
  },
  
  // === CRUD GENÉRICO ===
  getAll: async (dispatch, entityName, endpoint) => {
    dispatch({ type: 'API_START' });
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Fetch failed');
      
      const data = await response.json();
      dispatch({ 
        type: 'SET_ENTITIES', 
        entityName, 
        payload: data 
      });
      dispatch({ type: 'API_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'API_ERROR', payload: error.message });
    }
  },
  
  create: async (dispatch, entityName, endpoint, formData) => {
    dispatch({ type: 'API_START' });
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Create failed');
      
      const newItem = await response.json();
      dispatch({ 
        type: 'ADD_ENTITY', 
        entityName, 
        payload: newItem 
      });
      dispatch({ type: 'API_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'API_ERROR', payload: error.message });
    }
  },
  
  update: async (dispatch, entityName, endpoint, id, formData) => {
    dispatch({ type: 'API_START' });
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      const updatedItem = await response.json();
      dispatch({ 
        type: 'UPDATE_ENTITY', 
        entityName, 
        payload: updatedItem 
      });
      dispatch({ type: 'API_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'API_ERROR', payload: error.message });
    }
  },
  
  delete: async (dispatch, entityName, endpoint, id) => {
    dispatch({ type: 'API_START' });
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      dispatch({ 
        type: 'DELETE_ENTITY', 
        entityName, 
        payload: id 
      });
      dispatch({ type: 'API_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'API_ERROR', payload: error.message });
    }
  }
};
```

---

## 🧩 ARQUITECTURA DE COMPONENTES

### 🎭 PATRÓN INTELIGENTE/TONTO (CONTAINER/PRESENTATIONAL)

#### PRINCIPIO FUNDAMENTAL:
**Separar la lógica de negocio (componentes inteligentes) de la presentación visual (componentes tontos) para máxima reutilización y mantenibilidad.**

#### COMPONENTE INTELIGENTE (CONTENEDOR):

**Responsabilidades:**
- ✅ Conectarse al store global
- ✅ Obtener datos mediante acciones centralizadas
- ✅ Conocer el contexto y permisos del usuario
- ✅ Gestionar estados de carga y error
- ✅ Delegar la presentación a componentes tontos
- ✅ Manejar lógica de negocio compleja

**Ejemplo:**

```javascript
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { crudActions } from "../store";
import ItemList from "../components/ItemList";

export const ItemsContainer = () => {
  const { store, dispatch } = useGlobalReducer();
  
  // Cargar datos al montar
  useEffect(() => {
    crudActions.getAll(dispatch, 'items', '/api/items');
  }, []);
  
  // Funciones de negocio
  const handleDelete = async (id) => {
    if (confirm('¿Está seguro?')) {
      await crudActions.delete(dispatch, 'items', '/api/items', id);
    }
  };
  
  const handleToggleForm = () => {
    dispatch({ type: 'TOGGLE_UI', key: 'showItemForm' });
  };
  
  // Renderizar componente tonto con datos e instrucciones
  return (
    <div className="container-fluid py-4">
      {/* Acciones globales según permisos */}
      {store.auth.permissions.includes('create_item') && (
        <button 
          className="btn btn-primary mb-3" 
          onClick={handleToggleForm}
        >
          Nuevo Item
        </button>
      )}
      
      {/* Componente de presentación */}
      {store.api.loading ? (
        <div className="spinner-border" role="status" />
      ) : store.api.error ? (
        <div className="alert alert-danger">{store.api.error}</div>
      ) : (
        <ItemList 
          items={store.entities.items} 
          userRole={store.auth.role}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
```

#### COMPONENTE TONTO (PRESENTACIONAL):

**Responsabilidades:**
- ✅ Recibir datos exclusivamente vía props
- ✅ Renderizar UI de forma predecible
- ✅ Contener lógica condicional de visualización
- ✅ Emitir eventos (no ejecutar lógica de negocio)
- ✅ Ser totalmente reutilizable

**Ejemplo:**

```javascript
import React from "react";

const ItemList = ({ items, userRole, onDelete }) => {
  return (
    <div className="row">
      {items.map(item => (
        <div key={item.id} className="col-12 col-md-6 col-lg-4 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{item.name}</h5>
              <p className="card-text">{item.description}</p>
              
              {/* Lógica condicional de UI basada en rol */}
              <div className="btn-group">
                {userRole === 'admin' || userRole === 'editor' ? (
                  <Link 
                    to={`/items/edit/${item.id}`} 
                    className="btn btn-sm btn-outline-primary"
                  >
                    Editar
                  </Link>
                ) : null}
                
                {userRole === 'admin' ? (
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onDelete(item.id)}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItemList;
```

---

## 📝 PATRÓN DE FORMULARIOS

### PRINCIPIO FUNDAMENTAL:
**Usar FormData para captura de datos y defaultValue para pre-carga, evitando formularios controlados con estado local.**

### VENTAJAS:
- ✅ No requiere estado local por campo
- ✅ Fácil captura de múltiples campos
- ✅ Soporte nativo para archivos
- ✅ Pre-carga simple con defaultValue
- ✅ Performance optimizado

### PATRÓN DE FORMULARIO:

```javascript
import React from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { crudActions } from "../store";

export const ItemForm = ({ editingItem = null }) => {
  const { store, dispatch } = useGlobalReducer();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Captura automática de todos los campos
    const formData = new FormData(e.target);
    
    if (editingItem) {
      // Actualizar
      await crudActions.update(
        dispatch, 
        'items', 
        '/api/items', 
        editingItem.id, 
        formData
      );
    } else {
      // Crear
      await crudActions.create(
        dispatch, 
        'items', 
        '/api/items', 
        formData
      );
    }
    
    // Resetear formulario
    e.target.reset();
  };
  
  return (
    <form onSubmit={handleSubmit} className="needs-validation">
      <div className="mb-3">
        <label htmlFor="name" className="form-label">Nombre</label>
        <input 
          type="text" 
          className="form-control" 
          id="name" 
          name="name"
          defaultValue={editingItem?.name || ''}
          required 
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="description" className="form-label">Descripción</label>
        <textarea 
          className="form-control" 
          id="description" 
          name="description"
          defaultValue={editingItem?.description || ''}
          rows="3"
          required
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="image" className="form-label">Imagen (opcional)</label>
        <input 
          type="file" 
          className="form-control" 
          id="image" 
          name="image"
          accept="image/*"
        />
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={store.api.loading}
      >
        {store.api.loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Guardando...
          </>
        ) : (
          editingItem ? 'Actualizar' : 'Crear'
        )}
      </button>
    </form>
  );
};
```

---

## 🗺️ NAVEGACIÓN DECLARATIVA

### PRINCIPIO FUNDAMENTAL:
**Usar componentes Link para navegación declarativa, evitando useNavigate y navegación imperativa.**

### VENTAJAS:
- ✅ Código más legible y declarativo
- ✅ Mejor SEO y accesibilidad
- ✅ Navegación predecible
- ✅ Fácil debugging

### PATRÓN DE NAVEGACIÓN:

```javascript
import { Link } from "react-router-dom";

// Navegación simple
<Link to="/" className="btn btn-secondary">
  Volver al inicio
</Link>

// Navegación con parámetros
<Link to={`/items/${item.id}`} className="btn btn-primary">
  Ver detalles
</Link>

// Navegación con estado
<Link 
  to="/items/new" 
  state={{ from: location.pathname }}
  className="btn btn-success"
>
  Crear nuevo
</Link>

// Navegación con estilo activo
<NavLink 
  to="/dashboard" 
  className={({ isActive }) => 
    isActive ? "nav-link active" : "nav-link"
  }
>
  Dashboard
</NavLink>
```

---

## 🛡️ RUTAS PROTEGIDAS Y PERMISOS

### PRINCIPIO FUNDAMENTAL:
**Implementar control de acceso basado en roles (RBAC) mediante rutas protegidas y componentes condicionales.**

### PATRÓN DE RUTAS PROTEGIDAS:

```javascript
import { Navigate, Outlet } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { store } = useGlobalReducer();
  
  if (!store.auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(store.auth.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
};

// Uso en Router
<Routes>
  {/* Rutas públicas */}
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  
  {/* Rutas protegidas generales */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<Profile />} />
  </Route>
  
  {/* Rutas protegidas por rol */}
  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
    <Route path="/admin/*" element={<AdminPanel />} />
  </Route>
  
  <Route element={<ProtectedRoute allowedRoles={['admin', 'editor']} />}>
    <Route path="/content/*" element={<ContentManagement />} />
  </Route>
</Routes>
```

---

## 📏 REGLA DE MANTENIBILIDAD: LÍMITE DE 500 LÍNEAS

### PRINCIPIO FUNDAMENTAL:
**Ningún archivo de código debe exceder las 500 líneas. Si un archivo alcanza o supera este límite, DEBE ser dividido inmediatamente en módulos más pequeños y cohesivos.**

### 🎯 JUSTIFICACIÓN:

- ✅ **Legibilidad**: Archivos pequeños son más fáciles de entender
- ✅ **Mantenibilidad**: Cambios localizados y sin efectos colaterales
- ✅ **Reutilización**: Módulos pequeños son más reutilizables
- ✅ **Testing**: Unidades pequeñas son más fáciles de testear
- ✅ **Colaboración**: Reduce conflictos en control de versiones
- ✅ **Performance**: Carga y compilación más rápida

---

## 📊 ESTRATEGIA DE DIVISIÓN POR TIPO DE ARCHIVO

### **FRONTEND - COMPONENTES (> 500 líneas)**

#### ❌ PROBLEMA: "Fat Component"
```
DetalleEvento.jsx - 800 líneas
├── Lógica de negocio
├── Manejo de formularios
├── Renderizado condicional complejo
└── Múltiples subcomponentes inline
```

#### ✅ SOLUCIÓN: Dividir en componentes más pequeños
```
pages/
└── DetalleEvento.jsx - 150 líneas (contenedor inteligente)

components/
├── EventoHeader.jsx - 80 líneas
├── EventoInfo.jsx - 100 líneas
├── EventoGaleria.jsx - 120 líneas
├── EventoFormulario.jsx - 150 líneas
└── EventoAcciones.jsx - 90 líneas
```

---

### **FRONTEND - CSS (> 500 líneas)**

#### ❌ PROBLEMA: "Monolito CSS"
```
index.css - 1200 líneas
├── Resets y variables
├── Layout (navbar, footer, sidebar)
├── Componentes (cards, buttons, forms)
└── Páginas específicas
```

#### ✅ SOLUCIÓN: CSS Modular Obligatorio
```
styles/
├── index.css - 30 líneas (SOLO IMPORTS)
├── base/
│   ├── reset.css - 50 líneas
│   ├── variables.css - 80 líneas
│   └── utilities.css - 100 líneas
├── layout/
│   ├── navbar.css - 120 líneas
│   ├── footer.css - 80 líneas
│   └── sidebar.css - 90 líneas
├── components/
│   ├── buttons.css - 100 líneas
│   ├── cards.css - 150 líneas
│   ├── forms.css - 180 líneas
│   └── modals.css - 120 líneas
└── pages/
    ├── home.css - 100 líneas
    └── dashboard.css - 150 líneas
```

**REGLA CRÍTICA:** `index.css` SOLO debe contener imports. Prohibido código CSS directo.

```css
/* ✅ CORRECTO: index.css */
@import './base/reset.css';
@import './base/variables.css';
@import './base/utilities.css';

@import './layout/navbar.css';
@import './layout/footer.css';

@import './components/buttons.css';
@import './components/cards.css';
@import './components/forms.css';

/* ❌ PROHIBIDO: Código CSS directo en index.css */
```

---

### **BACKEND - RUTAS (> 500 líneas)**

#### ❌ PROBLEMA: "God Routes File"
```
routes.py - 900 líneas
├── Rutas de autenticación
├── Rutas de usuarios
├── Rutas de productos
├── Rutas de órdenes
└── Rutas de reportes
```

#### ✅ SOLUCIÓN: Rutas separadas por dominio
```
api/routes/
├── __init__.py - 50 líneas (registro de blueprints)
├── auth_routes.py - 150 líneas
├── user_routes.py - 180 líneas
├── product_routes.py - 200 líneas
├── order_routes.py - 220 líneas
└── report_routes.py - 160 líneas
```

```python
# __init__.py - Registro centralizado
from flask import Blueprint
from .auth_routes import auth_bp
from .user_routes import user_bp
from .product_routes import product_bp

def register_routes(app):
    """Registrar todos los blueprints"""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(product_bp, url_prefix='/api/products')
```

---

### **BACKEND - MODELOS (> 500 líneas)**

#### ❌ PROBLEMA: "Monolith Models"
```
models.py - 1000 líneas
├── User
├── Product
├── Order
├── Payment
├── Inventory
└── Report
```

#### ✅ SOLUCIÓN: Modelos separados por entidad
```
api/models/
├── __init__.py - 40 líneas (importar todos los modelos)
├── user.py - 150 líneas
├── product.py - 180 líneas
├── order.py - 200 líneas
├── payment.py - 160 lines
├── inventory.py - 140 líneas
└── report.py - 130 líneas
```

```python
# __init__.py - Importar todos los modelos
from .user import User, UserRole
from .product import Product, Category
from .order import Order, OrderItem
from .payment import Payment, PaymentMethod
from .inventory import Inventory
from .report import Report

# Exportar para usar como: from api.models import User
__all__ = [
    'User', 'UserRole',
    'Product', 'Category',
    'Order', 'OrderItem',
    'Payment', 'PaymentMethod',
    'Inventory',
    'Report'
]
```

---

### **STORE/REDUCER (> 500 líneas)**

#### ❌ PROBLEMA: "Mega Store"
```
store.js - 800 líneas
├── initialStore (grande)
├── reducer (gigante con 50+ cases)
└── crudActions (100+ funciones)
```

#### ✅ SOLUCIÓN: Dividir en slices/módulos
```
store/
├── index.js - 100 líneas (configuración principal)
├── slices/
│   ├── authSlice.js - 150 líneas
│   ├── userSlice.js - 180 líneas
│   ├── productSlice.js - 200 líneas
│   └── uiSlice.js - 120 líneas
└── actions/
    ├── authActions.js - 180 líneas
    ├── userActions.js - 200 líneas
    ├── productActions.js - 220 líneas
    └── apiHelpers.js - 100 líneas
```

```javascript
// index.js - Combinar slices
import { combineReducers } from './utils';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import productReducer from './slices/productSlice';
import uiReducer from './slices/uiSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  users: userReducer,
  products: productReducer,
  ui: uiReducer
});

export default rootReducer;
```

---

## 🚨 DETECCIÓN Y PREVENCIÓN

### SEÑALES DE ALERTA:

1. **Scroll Vertical Excesivo**: Si necesitas scrollear más de 5 segundos, el archivo es demasiado grande
2. **Múltiples Responsabilidades**: Un archivo que hace más de una cosa
3. **Comentarios de Sección**: Si tienes comentarios como `// === SECCIÓN USUARIOS ===`, deberías tener un archivo separado
4. **Dificultad para Nombrar**: Si es difícil darle un nombre descriptivo conciso, probablemente hace demasiado
5. **Testing Complicado**: Si es difícil testear, probablemente necesita división

### PROCESO DE REFACTORIZACIÓN:

```markdown
1. **Identificar**: Encontrar archivos > 500 líneas
2. **Analizar**: Identificar responsabilidades y cohesión
3. **Diseñar**: Planear la división lógica
4. **Dividir**: Crear archivos más pequeños
5. **Integrar**: Conectar los nuevos módulos
6. **Testear**: Validar que todo funcione
7. **Documentar**: Actualizar documentación
```

### COMANDO DE VERIFICACIÓN:

```bash
# Encontrar archivos > 500 líneas
# PowerShell
Get-ChildItem -Path src -Recurse -File | Where-Object { (Get-Content $_.FullName | Measure-Object -Line).Lines -gt 500 } | Select-Object FullName, @{Name="Lines";Expression={(Get-Content $_.FullName | Measure-Object -Line).Lines}}

# Linux/Mac
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.css" \) -exec wc -l {} \; | awk '$1 > 500'
```

---

## 📋 CHECKLIST DE MODULARIDAD

Antes de hacer commit, asegurar que:

- [ ] Ningún archivo excede 500 líneas
- [ ] `index.css` solo contiene imports
- [ ] CSS está dividido en `base/`, `layout/`, `components/`
- [ ] Rutas backend están separadas por dominio
- [ ] Modelos están en archivos individuales
- [ ] Componentes complejos están divididos
- [ ] Store/Reducer usa slices cuando es necesario
- [ ] Cada archivo tiene una única responsabilidad clara
- [ ] Los nombres de archivo reflejan su contenido

---

## 🎨 MODULARIDAD INTEGRAL

### 🔥 RESTRICCIONES CRÍTICAS OBLIGATORIAS

#### ❌ PROHIBICIONES ABSOLUTAS:

**GESTIÓN DE ESTADO:**
- ❌ **NO useState** para estado compartido - Solo useReducer + Context API
- ❌ **NO estados locales** para datos de negocio - Solo store global
- ❌ **NO llamadas API directas** en componentes - Solo crudActions

**NAVEGACIÓN:**
- ❌ **NO useNavigate** - Solo Link declarativo
- ❌ **NO navegación imperativa** - Solo declarativa

**FORMULARIOS:**
- ❌ **NO formularios controlados** con estado - Solo FormData
- ❌ **NO value** en inputs - Solo defaultValue

**ARQUITECTURA:**
- ❌ **NO archivos monolíticos** - CSS gigante, componentes "Dios", rutas sin separar
- ❌ **NO estilos inline** - Solo CSS modular
- ❌ **NO código duplicado** - Reutilizar componentes y funciones

#### ✅ OBLIGATORIOS:

**GESTIÓN DE ESTADO:**
- ✅ **useReducer + Context API** exclusivamente
- ✅ **Store global centralizado** para todo el estado
- ✅ **crudActions centralizadas** para lógica de negocio

**NAVEGACIÓN:**
- ✅ **Link de react-router-dom** para toda navegación
- ✅ **Rutas declarativas** en archivo de configuración

**FORMULARIOS:**
- ✅ **FormData** en todos los formularios
- ✅ **defaultValue** para pre-carga de datos
- ✅ **Validación HTML5** + backend

**ARQUITECTURA:**
- ✅ **Patrón Inteligente/Tonto** para componentes
- ✅ **Modularidad integral** en todas las capas
- ✅ **Separación de responsabilidades** estricta

---

## 📁 ESTRUCTURA MODULAR

### FRONTEND:

```
src/front/
├── components/           # Componentes reutilizables
│   ├── common/          # Componentes genéricos (Botones, Modales, etc)
│   ├── layout/          # Estructura (Navbar, Footer, Sidebar)
│   └── feature/         # Componentes específicos de dominio
│
├── pages/               # Componentes de página (contenedores inteligentes)
│   ├── public/          # Páginas públicas (Landing, Login)
│   └── protected/       # Páginas protegidas (Dashboard, Admin)
│
├── hooks/               # Custom hooks
│   ├── useGlobalReducer.js
│   └── useAuth.js
│
├── store/               # Gestión de estado
│   ├── index.js         # Configuración principal del store
│   ├── reducer.js       # Reducer global
│   └── actions.js       # Acciones centralizadas (crudActions)
│
├── styles/              # CSS MODULAR (OBLIGATORIO)
│   ├── base/           # Resets, variables, utilidades
│   │   ├── reset.css
│   │   ├── variables.css
│   │   └── utilities.css
│   ├── layout/         # Estilos de estructura
│   │   ├── navbar.css
│   │   ├── footer.css
│   │   └── sidebar.css
│   ├── components/     # Estilos de componentes
│   │   ├── buttons.css
│   │   ├── cards.css
│   │   └── forms.css
│   └── index.css       # SOLO IMPORTS (prohibido código CSS aquí)
│
├── utils/              # Utilidades y helpers
│   ├── validators.js
│   ├── formatters.js
│   └── constants.js
│
└── routes/             # Configuración de rutas
    └── index.jsx
```

### BACKEND:

```
src/api/
├── models/             # Modelos de base de datos
│   ├── __init__.py
│   ├── user.py
│   └── entity.py
│
├── routes/             # Rutas por dominio (MODULAR)
│   ├── __init__.py
│   ├── auth_routes.py
│   ├── user_routes.py
│   └── entity_routes.py
│
├── services/           # Lógica de negocio
│   ├── auth_service.py
│   └── entity_service.py
│
├── middlewares/        # Middlewares
│   ├── auth.py
│   └── validation.py
│
├── utils/              # Utilidades
│   ├── validators.py
│   └── helpers.py
│
└── app.py             # Configuración principal (SOLO configuración)
```

### CSS MODULAR (OBLIGATORIO):

```css
/* ❌ PROHIBIDO: index.css monolítico con 1000+ líneas */

/* ✅ CORRECTO: index.css SOLO con imports */
/* src/front/styles/index.css */
@import './base/reset.css';
@import './base/variables.css';
@import './base/utilities.css';

@import './layout/navbar.css';
@import './layout/footer.css';
@import './layout/sidebar.css';

@import './components/buttons.css';
@import './components/cards.css';
@import './components/forms.css';
```

```css
/* src/front/styles/base/variables.css */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  
  --font-family: 'Inter', sans-serif;
  --border-radius: 8px;
  --box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

```css
/* src/front/styles/components/cards.css */
.card-custom {
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: transform 0.2s;
}

.card-custom:hover {
  transform: translateY(-4px);
}
```

---

## 📱 DISEÑO RESPONSIVE CON BOOTSTRAP

### PRINCIPIO FUNDAMENTAL:
**Usar Bootstrap como base y complementar con CSS modular personalizado solo cuando sea necesario.**

### PATRONES RESPONSIVE:

```javascript
// Grid responsive
<div className="container-fluid">
  <div className="row">
    <div className="col-12 col-md-6 col-lg-4 col-xl-3">
      {/* 1 col en mobile, 2 en tablet, 3 en desktop, 4 en XL */}
    </div>
  </div>
</div>

// Headers responsive
<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
  <h1>Título</h1>
  <div className="btn-group">
    <button className="btn btn-primary">Acción</button>
  </div>
</div>

// Tablas responsive
<div className="table-responsive">
  <table className="table table-striped table-hover">
    {/* ... */}
  </table>
</div>

// Navegación responsive
<nav className="navbar navbar-expand-lg navbar-dark bg-dark">
  <div className="container-fluid">
    <button className="navbar-toggler" type="button" data-bs-toggle="collapse">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse">
      {/* ... */}
    </div>
  </div>
</nav>
```

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### PRINCIPIOS FUNDAMENTALES:

1. **Normalización**: Evitar redundancia de datos
2. **Relaciones claras**: FK bien definidas
3. **Índices estratégicos**: Para queries frecuentes
4. **Constraints**: Integridad referencial
5. **Nomenclatura consistente**: Convenciones claras

### PATRÓN DE MODELO:

```python
# SQLAlchemy (Python)
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class BaseModel(db.Model):
    """Modelo base con campos comunes"""
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

class User(BaseModel):
    __tablename__ = 'users'
    
    # Campos básicos
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'editor', 'viewer'), nullable=False)
    
    # Información personal
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    avatar_url = db.Column(db.String(500))
    
    # Relaciones
    items = db.relationship('Item', backref='owner', lazy=True)
    
    def serialize(self):
        """Serializar para JSON"""
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Item(BaseModel):
    __tablename__ = 'items'
    
    # Campos
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum('active', 'inactive', 'archived'), default='active')
    
    # Índices
    __table_args__ = (
        db.Index('idx_user_status', 'user_id', 'status'),
    )
    
    def serialize(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'status': self.status
        }
```

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### PRINCIPIOS FUNDAMENTALES:

1. **JWT para sesiones**: Tokens stateless
2. **Roles y permisos**: RBAC (Role-Based Access Control)
3. **Middleware de autenticación**: Validar en cada request
4. **Hashing seguro**: Bcrypt/Scrypt para contraseñas
5. **HTTPS obligatorio**: En producción

### PATRÓN DE AUTENTICACIÓN:

```python
# Backend (Flask)
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Credenciales inválidas'}), 401
    
    # Crear token con información del usuario
    access_token = create_access_token(
        identity=user.id,
        additional_claims={
            'role': user.role,
            'email': user.email,
            'permissions': get_user_permissions(user.role)
        }
    )
    
    return jsonify({
        'token': access_token,
        'user': user.serialize(),
        'role': user.role,
        'permissions': get_user_permissions(user.role)
    }), 200

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify({'user': user.serialize()}), 200

def get_user_permissions(role):
    """Mapeo de permisos por rol"""
    permissions_map = {
        'admin': ['create', 'read', 'update', 'delete', 'manage_users'],
        'editor': ['create', 'read', 'update'],
        'viewer': ['read']
    }
    return permissions_map.get(role, [])
```

```javascript
// Frontend
const crudActions = {
  login: async (dispatch, credentials) => {
    dispatch({ type: 'API_START' });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const data = await response.json();
      
      // Guardar token
      localStorage.setItem('token', data.token);
      
      // Actualizar store
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: data.user,
          role: data.role,
          token: data.token,
          permissions: data.permissions
        }
      });
      
      dispatch({ type: 'API_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'API_ERROR', payload: error.message });
    }
  },
  
  // Interceptor para agregar token a todas las requests
  fetchWithAuth: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const config = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await fetch(url, config);
    
    // Si token expiró, hacer logout
    if (response.status === 401) {
      dispatch({ type: 'LOGOUT' });
      localStorage.removeItem('token');
    }
    
    return response;
  }
};
```

---

## 🚀 IMPLEMENTACIÓN POR FASES

### PRINCIPIO FUNDAMENTAL:
**Desarrollar en fases incrementales, validando cada una antes de avanzar.**

### METODOLOGÍA RECOMENDADA:

#### **FASE 1: FUNDAMENTOS (Semanas 1-2)**
1. Configurar arquitectura base
2. Implementar store centralizado (useReducer + Context)
3. Crear modelos de base de datos
4. Implementar autenticación JWT
5. Estructura modular de carpetas

**Métricas de éxito:**
- ✅ Store global operativo
- ✅ Login/Logout funcional
- ✅ Rutas protegidas activas
- ✅ Base de datos configurada

#### **FASE 2: CRUD BÁSICO (Semanas 3-4)**
1. Implementar crudActions centralizadas
2. Crear componentes inteligentes/tontos
3. Formularios con FormData
4. Navegación declarativa con Link
5. CSS modular configurado

**Métricas de éxito:**
- ✅ CRUD completo de entidad principal
- ✅ Componentes reutilizables
- ✅ Estados de loading/error
- ✅ Diseño responsive

#### **FASE 3: CARACTERÍSTICAS AVANZADAS (Semanas 5-7)**
1. Sistema de permisos granulares
2. Múltiples roles y vistas
3. Notificaciones en tiempo real (WebSockets)
4. Subida de archivos/imágenes
5. Búsqueda y filtros

**Métricas de éxito:**
- ✅ Permisos por rol funcionando
- ✅ Notificaciones en tiempo real
- ✅ Upload de archivos operativo
- ✅ Filtros y búsqueda avanzada

#### **FASE 4: OPTIMIZACIÓN Y PRODUCCIÓN (Semanas 8-10)**
1. Testing unitario y de integración
2. Optimización de performance
3. Documentación completa
4. Deploy y CI/CD
5. Monitoreo y logs

**Métricas de éxito:**
- ✅ Cobertura de tests > 80%
- ✅ Performance optimizado
- ✅ Documentación completa
- ✅ Deploy exitoso a producción

---

## 📊 MÉTRICAS DE CALIDAD

### INDICADORES CLAVE:

#### **ARQUITECTURA:**
- ✅ **0 usos de useState** para estado compartido
- ✅ **100% useReducer + Context** para gestión de estado
- ✅ **0 llamadas API directas** en componentes
- ✅ **100% crudActions** centralizadas

#### **MODULARIDAD:**
- ✅ **CSS modular** en carpeta styles/
- ✅ **index.css solo imports** (< 50 líneas)
- ✅ **Componentes < 300 líneas** cada uno
- ✅ **Archivos de ruta separados** por dominio

#### **CÓDIGO:**
- ✅ **Cobertura de tests > 80%**
- ✅ **Sin duplicación** de código
- ✅ **Convenciones consistentes** en nomenclatura
- ✅ **Documentación JSDoc** en funciones complejas

#### **PERFORMANCE:**
- ✅ **Tiempo de carga < 2s**
- ✅ **Lighthouse score > 90**
- ✅ **Sin re-renders innecesarios**
- ✅ **Lazy loading** de rutas

---

## 🛠️ HERRAMIENTAS Y TECNOLOGÍAS

### STACK RECOMENDADO:

#### **FRONTEND:**
- **React 18+** - Framework UI
- **Vite** - Build tool rápido
- **React Router DOM** - Navegación SPA
- **Bootstrap 5** - Framework CSS responsive
- **Chart.js / Recharts** - Visualizaciones

#### **BACKEND:**
- **Flask / FastAPI / Express** - Framework backend
- **SQLAlchemy / Sequelize / Prisma** - ORM
- **JWT** - Autenticación
- **Socket.IO** - WebSockets
- **Cloudinary / AWS S3** - Almacenamiento de archivos

#### **BASE DE DATOS:**
- **PostgreSQL** - BD relacional robusta
- **MySQL** - Alternativa popular
- **Redis** - Caché y sesiones

#### **DEPLOYMENT:**
- **Docker** - Containerización
- **Nginx** - Proxy reverso
- **GitHub Actions / GitLab CI** - CI/CD
- **Heroku / Railway / Vercel** - Hosting

---

## 🎓 PRINCIPIOS DE DESARROLLO

### SOLID:

1. **S - Single Responsibility**: Cada módulo/función una sola responsabilidad
2. **O - Open/Closed**: Abierto a extensión, cerrado a modificación
3. **L - Liskov Substitution**: Componentes intercambiables
4. **I - Interface Segregation**: Interfaces específicas y mínimas
5. **D - Dependency Inversion**: Depender de abstracciones, no de implementaciones

### DRY (Don't Repeat Yourself):
- Reutilizar componentes y funciones
- Extraer lógica común a utilidades
- Compartir constantes y configuraciones

### KISS (Keep It Simple, Stupid):
- Soluciones simples sobre complejas
- Código legible y directo
- Evitar sobre-ingeniería

### YAGNI (You Aren't Gonna Need It):
- Implementar solo lo necesario ahora
- No anticipar necesidades futuras sin evidencia
- Iterar según feedback real

---

## 📚 CONCLUSIÓN

Esta arquitectura proporciona los **fundamentos sólidos** necesarios para construir aplicaciones escalables, mantenibles y robustas. Los principios aquí definidos son **universales** y pueden aplicarse a cualquier proyecto, independientemente del dominio de negocio.

### 🎯 PILARES DEL SISTEMA:

1. **Estado Centralizado** - useReducer + Context API como única fuente de verdad
2. **Modularidad Integral** - Separación de responsabilidades en todas las capas
3. **Componentes Inteligentes/Tontos** - Lógica vs Presentación separadas
4. **Acciones Centralizadas** - crudActions para toda la lógica de negocio
5. **Navegación Declarativa** - Link para experiencia predecible
6. **Formularios Eficientes** - FormData y defaultValue
7. **CSS Modular** - Estilos organizados y mantenibles
8. **Seguridad por Diseño** - JWT, RBAC, validaciones
9. **Desarrollo por Fases** - Iteración incremental validada
10. **Calidad Continua** - Testing, performance, documentación

### 🚀 PRÓXIMOS PASOS:

Con estos fundamentos, cualquier equipo de desarrollo puede:
- ✅ Iniciar proyectos con base sólida
- ✅ Escalar sin deuda técnica
- ✅ Mantener código consistente
- ✅ Colaborar eficientemente
- ✅ Entregar con calidad

**La arquitectura es el timón del barco. Con dirección clara, el viaje será exitoso.**

---

*Documento de Arquitectura Universal*  
*Base para Proyectos Escalables y Mantenibles* ⚡
