# 🎯 ATAQUE - PLAN DE IMPLEMENTACIÓN TiBACK
## Estrategia Eficaz y Eficiente con Arquitectura tiback-hello

---

## 📋 OBJETIVO ESTRATÉGICO

**Implementar el sistema completo de TiBACK (Sistema de Tickets) siguiendo estrictamente la arquitectura tiback-hello con un ENFOQUE MODULAR ESTRICTO en todas las capas (Frontend, Backend, Estilos), utilizando el modelo de base de datos definido sin modificaciones, con implementación por fases para máxima eficiencia. Estrictamente no modificar los modelos de bases de datos de corazon.md y seguir la arquitectura.md, no crear archivos adicionales a menos que se especifique. Dentro de cada dashboard protegido debe ir solo la información que puede manejar y conocer ese rol.**

**No tomar en cuenta desactivar cuentas por el administrador por ahora. Siempre piensa y responde en español. Evitamos modales adicionales (Solo cuando sea necesario), siempre creamos páginas. Cuando presentamos errores de CORS realmente es falla de cualquier otra cosa, CORS no falla. Cuando vayas a realizar una tarea nueva, corregir o mejorar algo, no modifiques lo que ya sirve, a menos que tengas exactamente clara la implementación.**

---

## 🗃️ MODELO DE BASE DE DATOS DEFINITIVO (SIN CAMBIOS)

### **Tablas del Sistema de Tickets:**

```sql
-- 1. Tabla: Cliente
CREATE TABLE Cliente (
    id INT PRIMARY KEY AUTO_INCREMENT,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    url_imagen VARCHAR(500)
);

-- 2. Tabla: Administrador
CREATE TABLE Administrador (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permisos_especiales TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL
);

-- 3. Tabla: Supervisor
CREATE TABLE Supervisor (
    id INT PRIMARY KEY AUTO_INCREMENT,
    area_responsable VARCHAR(100),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL
);

-- 4. Tabla: Analista
CREATE TABLE Analista (
    id INT PRIMARY KEY AUTO_INCREMENT,
    especialidad VARCHAR(100),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL
);

-- 5. Tabla: Ticket (Corazón del sistema)
CREATE TABLE Ticket (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    estado ENUM('Creado', 'En espera', 'En proceso', 'Solucionado', 'Cerrado', 'Reabierto') NOT NULL DEFAULT 'Creado',
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME NULL,
    prioridad ENUM('Baja', 'Media', 'Alta', 'Urgente') NOT NULL DEFAULT 'Media',
    calificacion INT NULL,
    comentario TEXT NULL,
    fecha_evaluacion DATETIME NULL,
    url_imagen VARCHAR(500),
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id)
);

-- 6. Tabla: Comentario
CREATE TABLE Comentario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_gestion INT NULL,
    id_cliente INT NULL,
    id_analista INT NULL,
    id_supervisor INT NULL,
    texto TEXT NOT NULL,
    fecha_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Cliente(id),
    FOREIGN KEY (id_analista) REFERENCES Analista(id),
    FOREIGN KEY (id_supervisor) REFERENCES Supervisor(id)
);

-- 7. Tabla: Asignacion
CREATE TABLE Asignacion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_ticket INT NOT NULL,
    id_supervisor INT NOT NULL,
    id_analista INT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ticket) REFERENCES Ticket(id),
    FOREIGN KEY (id_supervisor) REFERENCES Supervisor(id),
    FOREIGN KEY (id_analista) REFERENCES Analista(id)
);

-- 8. Tabla: Gestion
CREATE TABLE Gestion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_ticket INT NOT NULL,
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    nota_caso TEXT,
    FOREIGN KEY (id_ticket) REFERENCES Ticket(id)
);
```

---

## 🎯 ESTRATEGIA DE IMPLEMENTACIÓN POR FASES

### **FASE 1: BASE FUNCIONAL (Cliente + Supervisor) - 4 SEMANAS**

#### **Semana 1: Arquitectura Base**
- ✅ Configurar arquitectura tiback-hello
- ✅ Crear modelos SQLAlchemy (8 tablas)
- ✅ Implementar autenticación JWT con roles
- ✅ Store centralizado con useReducer + Context API

#### **Semana 2: Gestión de Tickets (Cliente)**
- ✅ CRUD Tickets (Cliente)
- ✅ Estados: Creado → En espera
- ✅ Subida de imágenes (opcional)
- ✅ Dashboard Cliente

#### **Semana 3: Recepción y Clasificación (Supervisor)**
- ✅ Visualización tickets pendientes
- ✅ Clasificación y priorización
- ✅ Asignación a analistas
- ✅ Dashboard Supervisor

#### **Semana 4: Integración y Testing**
- ✅ Flujo completo Cliente-Supervisor
- ✅ Notificaciones básicas
- ✅ Testing de integración
- ✅ Deploy Fase 1

### **FASE 2: RESOLUCIÓN (Analista) - 3 SEMANAS**

#### **Semana 5-6: Workflow de Resolución**
- ✅ Bandeja de tickets asignados (Analista)
- ✅ Resolver/Escalar tickets con comentarios
- ✅ Transición En proceso → Solucionado
- ✅ Dashboard Analista

#### **Semana 7: Gestión y Seguimiento**
- ✅ Sistema de comentarios
- ✅ Historial de cambios (Gestión)
- ✅ Alertas de escalamiento
- ✅ Reasignación de tickets

### **FASE 3: CIERRE Y EVALUACIÓN (Cliente) - 2 SEMANAS**

#### **Semana 8-9: Ciclo de Retroalimentación**
- ✅ Cliente revisa solución
- ✅ Cierre con calificación
- ✅ Reapertura de tickets
- ✅ Workflow post-resolución

### **FASE 4: ADMINISTRACIÓN COMPLETA - 3 SEMANAS**

#### **Semana 10-12: Administración Total**
- ✅ Gestión completa de usuarios (Admin)
- ✅ Creación de Supervisores y Analistas
- ✅ Reportes y estadísticas
- ✅ Log de auditoría completo
- ✅ Configuración del sistema

---

## 🔧 ARQUITECTURA TIBACK-HELLO APLICADA

### **Store Centralizado Especializado:**

```javascript
const initialStore = {
  // Entidades del negocio
  clientes: [],
  supervisores: [],
  analistas: [],
  administradores: [],
  tickets: [],
  comentarios: [],
  asignaciones: [],
  gestiones: [],
  
  // Estados UI por rol
  ui: {
    // Cliente
    showTickets: true,
    showTicketForm: false,
    editingTicketId: null,
    selectedTicket: null,
    
    // Supervisor
    showPendingTickets: true,
    showAssignmentForm: false,
    selectedTicketForAssignment: null,
    
    // Analista
    showAssignedTickets: true,
    showResolutionForm: false,
    selectedTicketForResolution: null,
    
    // Admin
    showUserManagement: false,
    showReports: false,
    showAuditLog: false
  },
  
  // Estados API centralizados
  api: {
    loading: false,
    error: null,
    notifications: []
  },
  
  // Autenticación y permisos
  auth: {
    user: null,
    role: null, // 'cliente', 'supervisor', 'analista', 'administrador'
    token: null,
    permissions: []
  }
}
```

### **crudActions Especializadas por Workflow:**

```javascript
const crudActions = {
  // === AUTENTICACIÓN ===
  login: async (dispatch, credentials) => {},
  logout: (dispatch) => {},
  register: async (dispatch, userData) => {},
  
  // === TICKETS (Cliente) ===
  createTicket: async (dispatch, ticketData) => {},
  updateTicket: async (dispatch, id, ticketData) => {},
  getMisTickets: async (dispatch, clienteId) => {},
  closeTicket: async (dispatch, ticketId, calificacion, comentario) => {},
  reopenTicket: async (dispatch, ticketId, razon) => {},
  
  // === RECEPCIÓN Y CLASIFICACIÓN (Supervisor) ===
  getTicketsPendientes: async (dispatch) => {},
  clasificarTicket: async (dispatch, ticketId, prioridad) => {},
  asignarTicket: async (dispatch, ticketId, analistaId) => {},
  reasignarTicket: async (dispatch, ticketId, nuevoAnalistaId) => {},
  
  // === RESOLUCIÓN (Analista) ===
  getTicketsAsignados: async (dispatch, analistaId) => {},
  resolverTicket: async (dispatch, ticketId, solucion) => {},
  escalarTicket: async (dispatch, ticketId, razon) => {},
  agregarComentario: async (dispatch, ticketId, comentario) => {},
  
  // === GESTIÓN (Todos) ===
  getHistorialTicket: async (dispatch, ticketId) => {},
  getComentariosTicket: async (dispatch, ticketId) => {},
  
  // === ADMINISTRACIÓN (Admin) ===
  getUsuarios: async (dispatch, rol) => {},
  createUsuario: async (dispatch, userData, rol) => {},
  updateUsuario: async (dispatch, id, userData, rol) => {},
  getReportes: async (dispatch, filtros) => {},
  getAuditLog: async (dispatch, filtros) => {},
  
  // === NOTIFICACIONES ===
  subscribeToNotifications: (dispatch, userId, role) => {},
  sendNotification: async (dispatch, notification) => {},
  markNotificationRead: async (dispatch, notificationId) => {}
}
```

### **Rutas Protegidas por Rol:**

```javascript
// Sistema de rutas con permisos granulares
<Routes>
  {/* Rutas Públicas */}
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Cliente */}
  <Route path="/cliente/*" element={<ProtectedRoute role="cliente" />}>
    <Route index element={<ClienteDashboard />} />
    <Route path="tickets" element={<MisTickets />} />
    <Route path="crear-ticket" element={<CrearTicket />} />
    <Route path="ticket/:id" element={<DetalleTicket />} />
    <Route path="perfil" element={<PerfilCliente />} />
  </Route>
  
  {/* Supervisor */}
  <Route path="/supervisor/*" element={<ProtectedRoute role="supervisor" />}>
    <Route index element={<SupervisorDashboard />} />
    <Route path="bandeja" element={<BandejaTickets />} />
    <Route path="asignar/:id" element={<AsignarTicket />} />
    <Route path="reportes" element={<ReportesSupervisor />} />
  </Route>
  
  {/* Analista */}
  <Route path="/analista/*" element={<ProtectedRoute role="analista" />}>
    <Route index element={<AnalistaDashboard />} />
    <Route path="tickets-asignados" element={<TicketsAsignados />} />
    <Route path="resolver/:id" element={<ResolverTicket />} />
    <Route path="historial" element={<HistorialTickets />} />
  </Route>
  
  {/* Administrador */}
  <Route path="/admin/*" element={<ProtectedRoute role="administrador" />}>
    <Route index element={<AdminDashboard />} />
    <Route path="usuarios" element={<GestionUsuarios />} />
    <Route path="crear-usuario" element={<CrearUsuario />} />
    <Route path="reportes" element={<ReportesAdmin />} />
    <Route path="auditoria" element={<LogAuditoria />} />
    <Route path="configuracion" element={<ConfiguracionSistema />} />
  </Route>
</Routes>
```

---

## 🚥 FLUJOS DE ESTADO CRÍTICOS

### **Estados del Ticket:**
```
Creado → En espera → En proceso → Solucionado → Cerrado
                                              ↓
                                         Reabierto → En espera
```

### **Flujo de Asignación:**
```
Ticket Creado → Supervisor Clasifica → Asigna a Analista → En proceso
```

### **Flujo de Resolución:**
```
En proceso → Analista Resuelve → Solucionado → Cliente Evalúa → Cerrado
           ↓
        Escala → En espera (reasignación)
```

---

## 🔥 RESTRICCIONES ARQUITECTÓNICAS OBLIGATORIAS

### **❌ PROHIBICIONES ABSOLUTAS:**
- **NO useState** - Solo useReducer + Context API
- **NO useNavigate** - Solo Link declarativo
- **NO llamadas API directas** - Solo crudActions centralizadas
- **NO estados locales** - Todo en store global
- **NO formularios controlados** - Solo FormData + defaultValue
- **NO CSS Monolítico** - Prohibido usar un solo archivo index.css gigante

### **✅ OBLIGATORIOS:**
- **useReducer + Context API** exclusivamente
- **Link de react-router-dom** para navegación
- **crudActions centralizadas** en store.js
- **Bootstrap responsive** (mobile-first)
- **FormData** en todos los formularios
- **defaultValue** para pre-carga de datos
- **CSS Modular** en carpeta src/front/styles/

---

## 🎯 COMPONENTES CRÍTICOS POR ROL

### **Cliente:**
```javascript
// Componentes principales
- MisTickets.jsx (lista tickets propios)
- CrearTicket.jsx (formulario nuevo ticket)
- DetalleTicket.jsx (ver detalle + comentarios)
- EvaluarTicket.jsx (calificar solución)
```

### **Supervisor:**
```javascript
// Componentes principales
- BandejaTickets.jsx (tickets pendientes)
- AsignarTicket.jsx (asignar a analista)
- ReportesSupervisor.jsx (estadísticas)
```

### **Analista:**
```javascript
// Componentes principales
- TicketsAsignados.jsx (tickets asignados)
- ResolverTicket.jsx (resolver + comentarios)
- HistorialTickets.jsx (tickets resueltos)
```

### **Admin:**
```javascript
// Componentes principales
- GestionUsuarios.jsx (CRUD todos los roles)
- CrearUsuario.jsx (crear supervisores/analistas)
- ReportesAdmin.jsx (estadísticas globales)
- LogAuditoria.jsx (trazabilidad completa)
- ConfiguracionSistema.jsx (parámetros sistema)
```

---

## 🛠️ INTEGRACIONES CRÍTICAS

### **Sistema de Notificaciones:**
```javascript
// Configuración en store
const notificationsConfig = {
  emailService: process.env.REACT_APP_EMAIL_SERVICE,
  webhookUrl: `${backendUrl}/api/webhooks/notifications`,
  realtime: true // WebSockets
}
```

### **Subida de Imágenes (Opcional):**
```javascript
// Cloudinary o similar
const imageUploadConfig = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
  maxSize: 5 * 1024 * 1024 // 5MB
}
```

---

## 📊 MÉTRICAS DE ÉXITO

### **Fase 1 (4 semanas):**
- ✅ Cliente puede crear tickets
- ✅ Supervisor puede ver y clasificar tickets
- ✅ Supervisor puede asignar a analistas
- ✅ Store centralizado operativo

### **Fase 2 (3 semanas):**
- ✅ Analista recibe tickets asignados
- ✅ Analista puede resolver tickets
- ✅ Sistema de comentarios funcional
- ✅ Escalamiento de tickets

### **Fase 3 (2 semanas):**
- ✅ Cliente puede evaluar soluciones
- ✅ Cliente puede cerrar tickets
- ✅ Cliente puede reabrir tickets
- ✅ Workflow completo funcional

### **Fase 4 (3 semanas):**
- ✅ Admin gestiona todos los usuarios
- ✅ Reportes y estadísticas
- ✅ Log de auditoría completo
- ✅ Sistema production-ready

---

## 🚀 COMANDOS DE DESARROLLO

### **Backend:**
```bash
cd src/
python app.py
# API: http://localhost:3001/api
# Admin: http://localhost:3001/admin
```

### **Frontend:**
```bash
npm run dev
# App: http://localhost:3000
```

### **Base de Datos:**
```bash
# Crear tablas
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

---

## 🏁 CONCLUSIÓN ESTRATÉGICA

**PLAN DE ATAQUE DEFINIDO**

✅ **Modelo de BD:** 8 tablas sin cambios, listo para implementar  
✅ **Arquitectura:** tiback-hello perfecta para 4 roles  
✅ **Implementación:** 4 fases, 12 semanas total  
✅ **Complejidad:** Manejable con store centralizado  
✅ **Escalabilidad:** Preparado para crecimiento futuro  

**El sistema está listo para implementación inmediata siguiendo este plan de ataque por fases.**

---

*Plan de ataque generado - Diciembre 2024*  
*Arquitectura: tiback-hello ⚡*  
*Estado: LISTO PARA IMPLEMENTAR*
