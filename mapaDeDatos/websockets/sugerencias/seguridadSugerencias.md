# 🔒 Seguridad WebSocket: JWT como Fuente Única de Verdad

**Fecha de Creación:** 2025-12-29  
**Sistema:** TiBACK - Blindaje de Seguridad WebSocket  
**Objetivo:** Seguridad 10/10 con Room Global  
**Principio Fundamental:** JWT es la única fuente de verdad inmodificable desde el frontend

---

## 📋 Tabla de Contenidos

1. [Estado Actual y Vulnerabilidades](#estado-actual-y-vulnerabilidades)
2. [Arquitectura de Seguridad Propuesta](#arquitectura-de-seguridad-propuesta)
3. [JWT como Fuente Única de Verdad](#jwt-como-fuente-única-de-verdad)
4. [Sistema de Metadata de Permisos](#sistema-de-metadata-de-permisos)
5. [Middleware de Autorización](#middleware-de-autorización)
6. [Logging y Auditoría](#logging-y-auditoría)
7. [Plan de Implementación](#plan-de-implementación)
8. [Testing de Seguridad](#testing-de-seguridad)
9. [Casos de Uso y Validaciones](#casos-de-uso-y-validaciones)

---

## 🎯 Estado Actual y Vulnerabilidades

### **Puntuación Actual: 6/10** ⚠️

### Arquitectura Actual

**Flujo de Eventos:**
```
Backend emite evento → global_tickets → TODOS los clientes reciben → Frontend filtra
```

**Problema Principal:**
La seguridad depende 100% del código frontend, que es modificable por el usuario.

---

### Vulnerabilidades Identificadas

#### Vulnerabilidad 1: Cliente Malicioso Puede Ver Todo 🔴 CRÍTICA

**Descripción:**
Un usuario con conocimientos técnicos puede abrir DevTools del navegador y modificar el código JavaScript para desactivar o alterar el filtrado de eventos.

**Escenario de Ataque:**
1. Cliente A abre DevTools
2. Localiza función de filtrado en `useWebSocketEvents.js`
3. Modifica la función para retornar `true` siempre
4. Ahora recibe TODOS los eventos de TODOS los tickets
5. Puede ver datos de otros clientes, analistas, supervisores

**Impacto:**
- Fuga de información confidencial
- Violación de privacidad
- Incumplimiento de GDPR/regulaciones
- Pérdida de confianza de usuarios

**Probabilidad:** Media (requiere conocimientos técnicos)  
**Severidad:** Crítica

---


#### Vulnerabilidad 2: No Hay Auditoría de Acceso 🟡 ALTA

**Descripción:**
No existe registro de qué eventos recibe cada usuario, imposibilitando detectar accesos no autorizados o investigar incidentes de seguridad.

**Escenario de Problema:**
1. Cliente reporta que sus datos fueron vistos por otro usuario
2. No hay logs de quién recibió qué eventos
3. Imposible investigar o probar el incidente
4. No hay evidencia para acciones legales

**Impacto:**
- Imposibilidad de detectar brechas de seguridad
- No hay trazabilidad de accesos
- Incumplimiento de requisitos de auditoría
- Imposibilidad de investigar incidentes

**Probabilidad:** Alta (tarde o temprano se necesitará)  
**Severidad:** Alta

---

#### Vulnerabilidad 3: Confianza en Código Cliente 🔴 CRÍTICA

**Descripción:**
La arquitectura actual asume que el código frontend funcionará correctamente y no será manipulado. Esta es una violación del principio de "nunca confiar en el cliente".

**Escenario de Problema:**
1. Bug en código de filtrado frontend
2. Evento se muestra a usuario incorrecto
3. Usuario ve datos confidenciales sin intención maliciosa
4. Responsabilidad legal de la empresa

**Impacto:**
- Violación del principio de seguridad fundamental
- Riesgo legal y regulatorio
- Pérdida de certificaciones de seguridad
- Daño reputacional

**Probabilidad:** Media (bugs ocurren)  
**Severidad:** Crítica

---

#### Vulnerabilidad 4: Sin Validación de Integridad de Eventos 🟡 MEDIA

**Descripción:**
No hay verificación de que los eventos recibidos no han sido manipulados en tránsito o que provienen realmente del servidor.

**Escenario de Ataque:**
1. Atacante intercepta conexión WebSocket (MITM)
2. Inyecta eventos falsos
3. Cliente procesa eventos maliciosos
4. Datos corruptos en UI o acciones no autorizadas

**Impacto:**
- Manipulación de datos
- Acciones no autorizadas
- Corrupción de estado de aplicación

**Probabilidad:** Baja (requiere MITM)  
**Severidad:** Media

---


## 🏗️ Arquitectura de Seguridad Propuesta

### **Puntuación Proyectada: 10/10** ✅

### Principio Fundamental

**"JWT es la única fuente de verdad inmodificable desde el frontend"**

El token JWT contiene toda la información de identidad y permisos del usuario. Esta información:
- Es firmada criptográficamente por el servidor
- No puede ser modificada sin invalidar la firma
- Es validada en CADA operación en el servidor
- Es la base para TODAS las decisiones de autorización

---

### Arquitectura de Capas de Seguridad

**Capa 1: Autenticación (Ya Implementada)**
- JWT en header Authorization para HTTP
- JWT en handshake para WebSocket
- Validación de firma y expiración

**Capa 2: Autorización HTTP (Ya Implementada)**
- Decoradores `@require_role`
- Validación de permisos de negocio
- Control de acceso a recursos

**Capa 3: Metadata de Permisos (NUEVA)**
- Cada evento incluye información de quién puede verlo
- Basada en datos del ticket/entidad
- Viaja con el evento

**Capa 4: Middleware de Autorización WebSocket (NUEVA)**
- Intercepta eventos ANTES de enviar a cliente
- Valida JWT del cliente
- Compara permisos del evento vs permisos del usuario
- Decide si enviar o descartar evento

**Capa 5: Auditoría (NUEVA)**
- Registra todos los accesos
- Detecta intentos no autorizados
- Trazabilidad completa

**Capa 6: Filtrado Frontend (Existente - Ahora Redundante)**
- Mejora UX (no procesa eventos irrelevantes)
- NO es crítica para seguridad
- Defensa en profundidad

---

### Flujo de Seguridad Completo

**Fase 1: Conexión WebSocket**
```
1. Cliente se conecta con JWT en handshake
2. Servidor valida JWT
3. Extrae user_id, role, permisos
4. Guarda en sesión de socket
5. Une cliente a room global
```

**Fase 2: Acción del Usuario**
```
6. Usuario hace acción en UI
7. Frontend envía HTTP request con JWT
8. Backend valida JWT (Capa 1)
9. Backend valida rol (Capa 2)
10. Backend valida permisos de negocio (Capa 2)
11. Backend procesa y guarda en BD
```

**Fase 3: Construcción de Evento**
```
12. Backend obtiene entidad actualizada de BD
13. Backend extrae información de permisos (Capa 3)
14. Backend construye metadata de permisos
15. Backend agrega metadata al evento
```


**Fase 4: Emisión y Filtrado**
```
16. Backend emite evento a global_tickets
17. Socket.IO itera sobre TODOS los clientes conectados
18. Para CADA cliente:
    a. Middleware intercepta (Capa 4)
    b. Obtiene JWT del cliente de sesión
    c. Valida JWT (firma, expiración)
    d. Extrae user_id, role del JWT
    e. Compara con metadata de permisos del evento
    f. SI tiene permisos: Envía evento al cliente
    g. SI NO tiene permisos: Descarta (cliente nunca lo ve)
    h. Registra decisión en logs (Capa 5)
```

**Fase 5: Recepción en Cliente**
```
19. Cliente recibe SOLO eventos autorizados
20. Frontend puede confiar en que TODO es válido
21. Frontend filtra por contexto/UI (Capa 6 - opcional)
22. React actualiza UI
```

---

### Garantías de Seguridad

**Garantía 1: Imposibilidad de Manipulación**
- JWT está firmado criptográficamente
- Modificar JWT invalida la firma
- Servidor rechaza JWT inválido
- Cliente no puede falsificar identidad

**Garantía 2: Validación en Cada Evento**
- CADA evento se valida individualmente
- No hay caché de permisos (siempre actualizado)
- Cambios de permisos se aplican inmediatamente

**Garantía 3: Defensa en Profundidad**
- 6 capas de seguridad
- Fallo de una capa no compromete sistema
- Múltiples puntos de validación

**Garantía 4: Trazabilidad Total**
- Cada acceso se registra
- Auditoría completa
- Investigación de incidentes posible

**Garantía 5: Principio de Menor Privilegio**
- Usuario recibe SOLO lo que necesita
- Nada más, nada menos
- Basado en JWT inmodificable

---

## 🔑 JWT como Fuente Única de Verdad

### Estructura del JWT

**Payload del Token:**
```
{
  "user_id": 123,
  "role": "cliente" | "analista" | "supervisor" | "administrador",
  "email": "usuario@ejemplo.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "exp": 1735488000,  // Timestamp de expiración
  "iat": 1735401600   // Timestamp de emisión
}
```

**Características Críticas:**
- Firmado con clave secreta del servidor
- Firma es HMAC-SHA256 o RS256
- Modificar cualquier campo invalida la firma
- Solo el servidor puede crear tokens válidos
- Cliente no puede modificar sin detectarse

---


### Validación del JWT

**En Cada Operación:**

**Paso 1: Verificar Firma**
- Extraer header, payload, signature del token
- Recalcular firma usando clave secreta
- Comparar firma calculada con firma del token
- SI no coinciden: Rechazar (token manipulado)

**Paso 2: Verificar Expiración**
- Extraer campo `exp` del payload
- Comparar con timestamp actual
- SI expirado: Rechazar (token vencido)

**Paso 3: Verificar Emisor (Opcional)**
- Verificar que token fue emitido por este servidor
- Previene tokens de otros sistemas

**Paso 4: Extraer Información**
- Una vez validado, extraer user_id y role
- Esta información es CONFIABLE
- Base para decisiones de autorización

---

### Por Qué JWT es Inmodificable

**Criptografía de Firma:**

**Proceso de Creación (Solo Servidor):**
1. Servidor crea payload con datos del usuario
2. Servidor codifica payload en Base64
3. Servidor calcula HMAC-SHA256(header + payload, SECRET_KEY)
4. Resultado es la firma
5. Token = header.payload.firma

**Intento de Modificación (Cliente Malicioso):**
1. Cliente decodifica payload
2. Cliente modifica user_id o role
3. Cliente codifica payload modificado
4. Cliente NO conoce SECRET_KEY
5. Cliente NO puede calcular firma válida
6. Servidor detecta firma inválida
7. Servidor rechaza token

**Conclusión:**
Sin la clave secreta del servidor, es criptográficamente imposible modificar el JWT sin detectarse.

---

### JWT en WebSocket

**Envío del Token:**

**Opción 1: En Handshake (Recomendada)**
- Cliente envía JWT al conectar
- Parámetro: `auth: { token: jwt }`
- Servidor valida antes de aceptar conexión
- Token se guarda en sesión de socket

**Opción 2: En Query String**
- URL: `wss://servidor.com?token=jwt`
- Menos seguro (token en logs)
- Solo si Opción 1 no es posible

**Almacenamiento en Sesión:**
- Servidor guarda JWT en `socket.handshake.auth.token`
- Disponible para middleware
- Válido durante toda la conexión
- Se revalida periódicamente

---

### Renovación de Token

**Problema:**
Token expira mientras usuario está conectado.

**Solución:**

**Detección de Expiración:**
- Middleware detecta token expirado
- Emite evento especial al cliente: `token_expired`
- Cliente no recibe más eventos de negocio

**Renovación:**
- Cliente solicita nuevo token vía HTTP
- Servidor valida refresh token
- Servidor emite nuevo JWT
- Cliente reconecta WebSocket con nuevo token
- Sesión continúa sin pérdida de datos

**Prevención:**
- Tokens con expiración larga (ej: 8 horas)
- Renovación automática antes de expirar
- Refresh token para renovación sin re-login

---


## 📊 Sistema de Metadata de Permisos

### Propósito

Cada evento debe incluir información explícita sobre quién tiene permiso para verlo. Esta metadata viaja con el evento y es usada por el middleware para tomar decisiones de autorización.

---

### Estructura de Metadata

**Campo: `_permissions`**

**Información Incluida:**

**IDs de Entidades Autorizadas:**
- `cliente_id`: ID del cliente dueño del ticket (null si no aplica)
- `analista_id`: ID del analista asignado (null si no hay asignación)
- `supervisor_id`: ID del supervisor que asignó (null si no hay)
- `creador_id`: ID de quien creó la entidad (para comentarios, etc.)

**Roles Permitidos:**
- `roles_permitidos`: Array de roles que pueden ver el evento
- Ejemplo: `["cliente", "analista", "supervisor", "administrador"]`

**Tipo de Permiso:**
- `tipo_permiso`: Categoría de permiso
- Valores:
  - `"owner"`: Solo el dueño puede ver
  - `"assigned"`: Solo asignados pueden ver
  - `"team"`: Equipo completo puede ver
  - `"public"`: Todos los autenticados pueden ver
  - `"admin_only"`: Solo administradores

**Contexto Adicional:**
- `ticket_id`: ID del ticket relacionado
- `entidad_tipo`: Tipo de entidad (ticket, comentario, chat)
- `accion`: Acción realizada (created, updated, deleted)

---

### Ejemplo de Metadata Completa

**Evento: Ticket Asignado**
```
{
  "tipo": "ticket_asignado",
  "ticket_id": 123,
  "ticket": { ...datos completos del ticket... },
  "timestamp": "2025-12-29T10:30:00Z",
  
  "_permissions": {
    "cliente_id": 456,
    "analista_id": 789,
    "supervisor_id": 101,
    "roles_permitidos": ["cliente", "analista", "supervisor", "administrador"],
    "tipo_permiso": "assigned",
    "ticket_id": 123,
    "entidad_tipo": "ticket",
    "accion": "asignado"
  }
}
```

**Quién Puede Ver Este Evento:**
- Cliente con ID 456 (dueño del ticket)
- Analista con ID 789 (asignado al ticket)
- Supervisor con ID 101 (quien asignó)
- Cualquier administrador

---

### Construcción de Metadata

**Ubicación:**
Función centralizada que construye eventos con metadata.

**Proceso:**

**Paso 1: Obtener Entidad de BD**
- Después de guardar cambios
- Hacer refresh si es necesario
- Asegurar que relaciones están cargadas

**Paso 2: Extraer IDs de Permisos**
- Del ticket: `cliente_id`, `asignacion_actual.analista_id`, `asignacion_actual.supervisor_id`
- De comentario: `id_cliente`, `id_analista`, `id_supervisor`
- De chat: Participantes del chat

**Paso 3: Determinar Roles Permitidos**
- Basado en tipo de evento
- Basado en estado de entidad
- Basado en reglas de negocio

**Paso 4: Determinar Tipo de Permiso**
- Analizar quién debe ver el evento
- Clasificar según categorías definidas

**Paso 5: Construir Objeto de Metadata**
- Crear diccionario con toda la información
- Agregar al evento como campo `_permissions`

---


### Reglas de Metadata por Tipo de Evento

**Eventos de Ticket:**

**ticket_created:**
- `cliente_id`: ID del cliente creador
- `roles_permitidos`: ["supervisor", "administrador"]
- `tipo_permiso`: "team"
- Razón: Supervisores deben ver nuevos tickets para asignar

**ticket_asignado:**
- `cliente_id`: ID del cliente dueño
- `analista_id`: ID del analista asignado
- `supervisor_id`: ID del supervisor que asignó
- `roles_permitidos`: ["cliente", "analista", "supervisor", "administrador"]
- `tipo_permiso`: "assigned"

**ticket_iniciado:**
- `cliente_id`: ID del cliente dueño
- `analista_id`: ID del analista trabajando
- `roles_permitidos`: ["cliente", "analista", "supervisor", "administrador"]
- `tipo_permiso`: "assigned"

**ticket_solucionado:**
- `cliente_id`: ID del cliente dueño
- `analista_id`: ID del analista que solucionó
- `supervisor_id`: ID del supervisor asignado
- `roles_permitidos`: ["cliente", "analista", "supervisor", "administrador"]
- `tipo_permiso`: "assigned"

**ticket_cerrado:**
- `cliente_id`: ID del cliente dueño
- `analista_id`: ID del analista asignado
- `supervisor_id`: ID del supervisor
- `roles_permitidos`: ["analista", "supervisor", "administrador"]
- `tipo_permiso`: "assigned"
- Nota: Cliente NO debe ver (se elimina de su lista)

**ticket_reabierto:**
- `cliente_id`: ID del cliente dueño
- `supervisor_id`: ID del supervisor que reabrió
- `roles_permitidos`: ["cliente", "supervisor", "administrador"]
- `tipo_permiso`: "assigned"

**ticket_escalado:**
- `supervisor_id`: ID del supervisor
- `analista_id`: null (ya no asignado)
- `roles_permitidos`: ["supervisor", "administrador"]
- `tipo_permiso`: "team"
- Nota: Analista anterior NO debe ver (perdió asignación)

---

**Eventos de Chat:**

**nuevo_mensaje_chat (supervisor-analista):**
- `analista_id`: ID del analista participante
- `supervisor_id`: ID del supervisor participante
- `ticket_id`: ID del ticket relacionado
- `roles_permitidos`: ["analista", "supervisor", "administrador"]
- `tipo_permiso`: "assigned"

**nuevo_mensaje_chat (analista-cliente):**
- `cliente_id`: ID del cliente participante
- `analista_id`: ID del analista participante
- `ticket_id`: ID del ticket relacionado
- `roles_permitidos`: ["cliente", "analista", "administrador"]
- `tipo_permiso`: "assigned"

---

**Eventos de Comentarios:**

**nuevo_comentario:**
- Heredar permisos del ticket relacionado
- Agregar `creador_id` del comentario
- Mismos roles que el ticket

---

### Casos Especiales

**Solicitud de Reapertura:**
- `cliente_id`: ID del cliente que solicita
- `supervisor_id`: ID del supervisor asignado
- `roles_permitidos`: ["cliente", "supervisor", "administrador"]
- `tipo_permiso`: "assigned"
- Nota: Analista NO debe ver (no es su responsabilidad)

**Ticket Eliminado:**
- `roles_permitidos`: ["administrador"]
- `tipo_permiso`: "admin_only"
- Nota: Solo admin puede eliminar, solo admin debe ver evento

---


## 🛡️ Middleware de Autorización

### Propósito

Interceptar CADA evento ANTES de enviarlo a CADA cliente y validar que el cliente tiene permiso para verlo basándose en su JWT.

---

### Ubicación y Registro

**Archivo:**
- `src/api/middleware/websocket_auth.py`

**Registro:**
- En inicialización de Socket.IO
- Antes de cualquier handler de eventos
- Se ejecuta automáticamente para todos los eventos salientes

**Tipo de Middleware:**
- Middleware de emisión (outgoing)
- Se ejecuta cuando servidor emite evento
- Antes de que evento llegue a cliente

---

### Flujo de Ejecución

**Trigger:**
Backend emite evento a room global.

**Proceso del Middleware:**

**Paso 1: Interceptar Evento**
- Middleware recibe: (nombre_evento, data, socket_destino)
- `nombre_evento`: Ej: "ticket_asignado"
- `data`: Objeto del evento con metadata
- `socket_destino`: Socket del cliente específico

**Paso 2: Obtener JWT del Cliente**
- Extraer de `socket_destino.handshake.auth.token`
- Si no existe: Rechazar (cliente no autenticado)

**Paso 3: Validar JWT**
- Verificar firma criptográfica
- Verificar expiración
- Si inválido: Rechazar y emitir `token_invalid`

**Paso 4: Extraer Información del Usuario**
- Decodificar payload del JWT
- Extraer: `user_id`, `role`, `email`
- Esta información es CONFIABLE (JWT validado)

**Paso 5: Verificar Metadata del Evento**
- Buscar campo `_permissions` en data
- Si no existe: Permitir (evento público)
- Si existe: Continuar validación

**Paso 6: Validar Permisos**
- Ejecutar lógica de autorización (ver sección siguiente)
- Resultado: PERMITIR o DENEGAR

**Paso 7: Acción Según Resultado**
- SI PERMITIR:
  - Enviar evento al cliente
  - Loggear acceso (nivel INFO)
- SI DENEGAR:
  - NO enviar evento (cliente nunca lo ve)
  - Loggear intento denegado (nivel WARNING)
  - Opcionalmente: Incrementar contador de intentos sospechosos

---

### Lógica de Autorización

**Algoritmo de Decisión:**

```
FUNCIÓN validar_permiso(usuario, metadata_evento):
  
  // Caso 1: Evento sin metadata (público)
  SI metadata_evento es null O vacío:
    RETORNAR PERMITIR
  
  // Caso 2: Administrador ve todo
  SI usuario.role === "administrador":
    RETORNAR PERMITIR
  
  // Caso 3: Rol no está en roles permitidos
  SI usuario.role NO está en metadata_evento.roles_permitidos:
    RETORNAR DENEGAR
  
  // Caso 4: Validación específica por rol
  SEGÚN usuario.role:
    
    CASO "cliente":
      SI metadata_evento.cliente_id === usuario.user_id:
        RETORNAR PERMITIR
      SINO:
        RETORNAR DENEGAR
    
    CASO "analista":
      SI metadata_evento.analista_id === usuario.user_id:
        RETORNAR PERMITIR
      SINO:
        RETORNAR DENEGAR
    
    CASO "supervisor":
      SI metadata_evento.supervisor_id === usuario.user_id:
        RETORNAR PERMITIR
      SINO:
        // Supervisor puede ver tickets de su área
        SI metadata_evento.tipo_permiso === "team":
          RETORNAR PERMITIR
        SINO:
          RETORNAR DENEGAR
  
  // Caso por defecto: Denegar
  RETORNAR DENEGAR
```

---


### Casos Especiales de Validación

**Caso 1: Múltiples IDs Válidos**

Algunos eventos pueden tener múltiples usuarios autorizados.

**Ejemplo: Ticket Asignado**
- Cliente dueño puede ver
- Analista asignado puede ver
- Supervisor que asignó puede ver

**Lógica:**
```
SI usuario.role === "cliente" Y metadata.cliente_id === usuario.id:
  PERMITIR
O SI usuario.role === "analista" Y metadata.analista_id === usuario.id:
  PERMITIR
O SI usuario.role === "supervisor" Y metadata.supervisor_id === usuario.id:
  PERMITIR
SINO:
  DENEGAR
```

---

**Caso 2: Permisos de Equipo**

Algunos eventos son visibles para todo un equipo.

**Ejemplo: Ticket Creado**
- Todos los supervisores deben verlo para poder asignar

**Lógica:**
```
SI metadata.tipo_permiso === "team":
  SI usuario.role en metadata.roles_permitidos:
    PERMITIR
  SINO:
    DENEGAR
```

---

**Caso 3: Cambio de Permisos Durante Evento**

Usuario puede perder permisos mientras evento está en tránsito.

**Ejemplo: Ticket Escalado**
- Analista escala ticket
- Pierde asignación
- NO debe recibir eventos futuros del ticket

**Solución:**
- Metadata refleja estado DESPUÉS del cambio
- `analista_id` es null en metadata
- Analista anterior no recibe evento

---

**Caso 4: Eventos Sin Entidad Específica**

Algunos eventos no están ligados a una entidad específica.

**Ejemplo: Notificación del Sistema**
- Todos los usuarios deben verla

**Lógica:**
```
SI metadata.tipo_permiso === "public":
  PERMITIR
```

---

### Optimizaciones de Performance

**Problema:**
Validar JWT en cada evento para cada cliente puede ser costoso.

**Soluciones:**

**Optimización 1: Caché de JWT Validado**
- Validar JWT una vez al conectar
- Guardar resultado en sesión de socket
- Reutilizar información validada
- Revalidar solo si token expira

**Optimización 2: Índice de Usuarios por ID**
- Mantener mapa: user_id → socket
- Acceso O(1) para encontrar sockets autorizados
- Actualizar al conectar/desconectar

**Optimización 3: Pre-filtrado por Rol**
- Agrupar sockets por rol
- Emitir solo a roles relevantes
- Reducir iteraciones innecesarias

**Optimización 4: Batch Processing**
- Agrupar validaciones de múltiples eventos
- Procesar en lote
- Reducir overhead

---

### Manejo de Errores

**Error 1: JWT Inválido**
- Acción: No enviar evento
- Emitir: `token_invalid` al cliente
- Cliente debe renovar token y reconectar

**Error 2: JWT Expirado**
- Acción: No enviar evento
- Emitir: `token_expired` al cliente
- Cliente debe renovar token

**Error 3: Metadata Malformada**
- Acción: Loggear error
- Decisión: Denegar por seguridad
- Investigar por qué metadata es inválida

**Error 4: Usuario No Encontrado**
- Acción: Denegar
- Loggear: Usuario en JWT no existe en BD
- Posible token antiguo o usuario eliminado

---


## 📝 Logging y Auditoría

### Propósito

Registrar TODOS los accesos a eventos para:
- Detectar intentos de acceso no autorizado
- Investigar incidentes de seguridad
- Cumplir requisitos de compliance
- Análisis de uso y performance

---

### Niveles de Logging

**DEBUG (Solo Desarrollo):**
- Todos los eventos procesados
- Decisiones de autorización
- Metadata de eventos
- Performance de validaciones

**INFO (Producción):**
- Eventos permitidos a usuarios
- Conexiones y desconexiones
- Renovaciones de token
- Eventos críticos (creación, cierre)

**WARNING (Producción):**
- Eventos denegados
- Intentos de acceso no autorizado
- JWT inválidos o expirados
- Metadata malformada

**ERROR (Producción):**
- Errores en middleware
- Excepciones no manejadas
- Fallos de validación de JWT
- Problemas de BD

---

### Estructura de Logs

**Log de Evento Permitido (INFO):**
```
{
  "timestamp": "2025-12-29T10:30:00.123Z",
  "nivel": "INFO",
  "tipo": "evento_permitido",
  "usuario": {
    "user_id": 123,
    "role": "cliente",
    "email": "cliente@ejemplo.com"
  },
  "evento": {
    "nombre": "ticket_asignado",
    "ticket_id": 456,
    "accion": "asignado"
  },
  "decision": "PERMITIR",
  "razon": "cliente_id coincide",
  "ip": "192.168.1.100",
  "session_id": "abc123xyz"
}
```

**Log de Evento Denegado (WARNING):**
```
{
  "timestamp": "2025-12-29T10:30:00.123Z",
  "nivel": "WARNING",
  "tipo": "evento_denegado",
  "usuario": {
    "user_id": 789,
    "role": "cliente",
    "email": "otro@ejemplo.com"
  },
  "evento": {
    "nombre": "ticket_asignado",
    "ticket_id": 456,
    "accion": "asignado"
  },
  "decision": "DENEGAR",
  "razon": "cliente_id no coincide (esperado: 123, recibido: 789)",
  "metadata_evento": {
    "cliente_id": 123,
    "analista_id": 456
  },
  "ip": "192.168.1.200",
  "session_id": "def456uvw",
  "alerta": "POSIBLE_INTENTO_NO_AUTORIZADO"
}
```

---

### Información a Registrar

**Por Cada Evento Procesado:**

**Información del Usuario:**
- `user_id`: ID del usuario
- `role`: Rol del usuario
- `email`: Email del usuario
- `ip`: Dirección IP del cliente
- `session_id`: ID de sesión WebSocket

**Información del Evento:**
- `nombre_evento`: Tipo de evento
- `ticket_id`: ID del ticket (si aplica)
- `entidad_tipo`: Tipo de entidad
- `accion`: Acción realizada

**Información de Autorización:**
- `decision`: PERMITIR o DENEGAR
- `razon`: Razón de la decisión
- `metadata_evento`: Metadata de permisos (si denegado)

**Información de Contexto:**
- `timestamp`: Momento exacto
- `duracion_validacion`: Tiempo de validación (ms)
- `jwt_expira_en`: Tiempo hasta expiración del JWT

---

### Almacenamiento de Logs

**Opción 1: Archivo de Logs (Básico)**
- Archivo rotativo por día
- Formato: JSON Lines (un JSON por línea)
- Ubicación: `/var/log/tiback/websocket_auth.log`
- Rotación: Diaria, mantener 30 días

**Opción 2: Base de Datos (Recomendado)**
- Tabla: `websocket_audit_log`
- Índices: user_id, timestamp, decision
- Permite queries complejas
- Retención: 90 días

**Opción 3: Sistema de Logging Centralizado (Producción)**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- CloudWatch (AWS)
- Permite análisis avanzado y alertas

---


### Alertas Automáticas

**Alerta 1: Múltiples Intentos Denegados**

**Trigger:**
Usuario tiene más de 5 eventos denegados en 1 minuto.

**Acción:**
- Enviar alerta a equipo de seguridad
- Posible intento de manipulación
- Revisar actividad del usuario

---

**Alerta 2: Patrón Sospechoso**

**Trigger:**
Usuario intenta acceder a tickets de múltiples clientes diferentes.

**Acción:**
- Alerta de alta prioridad
- Posible cuenta comprometida
- Considerar bloqueo temporal

---

**Alerta 3: JWT Inválido Repetido**

**Trigger:**
Mismo cliente envía JWT inválido múltiples veces.

**Acción:**
- Posible ataque de replay
- Posible intento de falsificación
- Bloquear IP temporalmente

---

**Alerta 4: Acceso Fuera de Horario**

**Trigger:**
Usuario accede fuera de horario laboral (opcional).

**Acción:**
- Notificación informativa
- Revisar si es actividad legítima

---

### Análisis y Reportes

**Reporte Diario:**
- Total de eventos procesados
- Total de eventos permitidos vs denegados
- Usuarios con más eventos denegados
- Tipos de eventos más denegados

**Reporte Semanal:**
- Tendencias de acceso
- Usuarios más activos
- Patrones de uso
- Incidentes de seguridad

**Reporte Mensual:**
- Compliance y auditoría
- Estadísticas de seguridad
- Recomendaciones de mejora

---

### Retención de Logs

**Logs de Eventos Permitidos:**
- Retención: 30 días
- Después: Archivar o eliminar
- Excepción: Eventos críticos (90 días)

**Logs de Eventos Denegados:**
- Retención: 90 días
- Después: Archivar
- Importante para investigaciones

**Logs de Alertas:**
- Retención: 1 año
- Crítico para compliance
- Evidencia legal

---

## 📋 Plan de Implementación

### Fase 1: Agregar Metadata de Permisos

**Duración:** 2-3 horas

**Objetivo:**
Modificar función de emisión para incluir metadata de permisos en cada evento.

---

**Paso 1.1: Modificar Función de Emisión**

**Archivo:** `src/api/routes/utils_routes.py` o `src/api/utils/websocket_utils.py`

**Cambios:**
- Agregar parámetro `ticket` o `entidad` a función `emit_ws_event()`
- Extraer información de permisos de la entidad
- Construir objeto `_permissions`
- Agregar al data del evento

**Información a Extraer:**
- De ticket: `id_cliente`, `asignacion_actual.id_analista`, `asignacion_actual.id_supervisor`
- Determinar `roles_permitidos` según tipo de evento
- Determinar `tipo_permiso` según contexto

---

**Paso 1.2: Actualizar Todas las Emisiones**

**Archivos a Modificar:**
- `src/api/routes/ticket_routes.py`
- `src/api/routes/ticket_estado_routes.py`
- `src/api/routes/chat_routes.py`

**Cambios:**
- Pasar entidad completa a función de emisión
- Verificar que metadata se construye correctamente
- Mantener compatibilidad con eventos sin metadata

---

**Paso 1.3: Testing**

**Verificar:**
- Eventos incluyen campo `_permissions`
- Metadata contiene información correcta
- IDs coinciden con entidad
- Roles permitidos son correctos

---


### Fase 2: Implementar Middleware de Autorización

**Duración:** 4-5 horas

**Objetivo:**
Crear middleware que intercepte eventos y valide permisos basándose en JWT.

---

**Paso 2.1: Crear Archivo de Middleware**

**Archivo:** `src/api/middleware/websocket_auth.py`

**Contenido:**
- Función de validación de JWT
- Función de extracción de información de usuario
- Función de validación de permisos
- Función principal de middleware

---

**Paso 2.2: Implementar Validación de JWT**

**Funcionalidad:**
- Extraer JWT de socket session
- Verificar firma criptográfica
- Verificar expiración
- Extraer payload
- Retornar información de usuario o error

**Manejo de Errores:**
- JWT inválido: Retornar None
- JWT expirado: Emitir `token_expired`
- JWT malformado: Loggear y retornar None

---

**Paso 2.3: Implementar Lógica de Autorización**

**Funcionalidad:**
- Recibir: usuario, metadata_evento
- Aplicar algoritmo de decisión (ver sección anterior)
- Retornar: PERMITIR o DENEGAR con razón

**Casos a Manejar:**
- Evento sin metadata (permitir)
- Administrador (permitir todo)
- Validación por rol
- Validación por ID
- Permisos de equipo

---

**Paso 2.4: Implementar Función Principal de Middleware**

**Funcionalidad:**
- Interceptar evento saliente
- Obtener socket destino
- Validar JWT del socket
- Extraer metadata del evento
- Validar permisos
- Decidir si enviar o descartar

**Integración:**
- Registrar en Socket.IO al inicializar
- Aplicar a todos los eventos salientes
- No interferir con eventos de sistema

---

**Paso 2.5: Registrar Middleware**

**Archivo:** `src/api/__init__.py`

**Cambios:**
- Importar middleware
- Registrar al crear instancia de Socket.IO
- Verificar que se ejecuta correctamente

---

**Paso 2.6: Testing**

**Verificar:**
- Middleware se ejecuta en cada evento
- JWT se valida correctamente
- Permisos se validan correctamente
- Eventos permitidos llegan al cliente
- Eventos denegados NO llegan al cliente

---

### Fase 3: Implementar Logging y Auditoría

**Duración:** 2-3 horas

**Objetivo:**
Registrar todas las decisiones de autorización para auditoría.

---

**Paso 3.1: Crear Sistema de Logging**

**Archivo:** `src/api/utils/audit_logger.py`

**Funcionalidad:**
- Función para loggear evento permitido
- Función para loggear evento denegado
- Función para loggear error
- Configuración de formato y destino

---

**Paso 3.2: Integrar con Middleware**

**Cambios:**
- Llamar a logger después de cada decisión
- Incluir toda la información relevante
- Usar nivel apropiado (INFO, WARNING, ERROR)

---

**Paso 3.3: Configurar Rotación de Logs**

**Configuración:**
- Archivo rotativo por día
- Mantener últimos 30 días
- Formato JSON Lines
- Ubicación: `/var/log/tiback/`

---

**Paso 3.4: Testing**

**Verificar:**
- Logs se generan correctamente
- Información completa en logs
- Formato es correcto
- Rotación funciona
- Performance no se degrada

---

### Fase 4: Testing Exhaustivo de Seguridad

**Duración:** 4-5 horas

**Objetivo:**
Verificar que el sistema es seguro contra intentos de manipulación.

---

**Paso 4.1: Testing de Permisos Básicos**

**Escenarios:**
- Cliente A crea ticket → Cliente A recibe evento
- Cliente B NO recibe evento de Cliente A
- Analista recibe evento de ticket asignado
- Analista NO recibe evento de ticket no asignado
- Supervisor recibe eventos de tickets que asignó
- Administrador recibe todos los eventos

---

**Paso 4.2: Testing de Manipulación de JWT**

**Escenarios:**
- Modificar user_id en JWT → Rechazado
- Modificar role en JWT → Rechazado
- JWT expirado → Rechazado con evento `token_expired`
- JWT sin firma → Rechazado
- JWT de otro sistema → Rechazado

---

**Paso 4.3: Testing de Manipulación de Frontend**

**Escenarios:**
- Modificar código de filtrado → Usuario NO ve eventos no autorizados
- Eliminar validación de frontend → Usuario NO ve eventos no autorizados
- Inyectar eventos falsos → Rechazados por servidor

---

**Paso 4.4: Testing de Casos Edge**

**Escenarios:**
- Usuario pierde permisos mientras está conectado
- Ticket se reasigna mientras usuario lo está viendo
- Usuario se desconecta y reconecta
- Múltiples usuarios simultáneos
- Carga alta (100+ eventos/segundo)

---

**Paso 4.5: Testing de Auditoría**

**Escenarios:**
- Verificar logs de eventos permitidos
- Verificar logs de eventos denegados
- Verificar que información es completa
- Verificar que se pueden investigar incidentes

---


### Fase 5: Optimización y Monitoreo

**Duración:** 2-3 horas

**Objetivo:**
Optimizar performance y configurar monitoreo.

---

**Paso 5.1: Optimizar Validación de JWT**

**Implementar:**
- Caché de JWT validado en sesión
- Evitar revalidar en cada evento
- Revalidar solo si expira

---

**Paso 5.2: Optimizar Búsqueda de Sockets**

**Implementar:**
- Índice de sockets por user_id
- Acceso O(1) en lugar de iteración
- Actualizar al conectar/desconectar

---

**Paso 5.3: Configurar Métricas**

**Métricas a Trackear:**
- Eventos procesados por segundo
- Eventos permitidos vs denegados
- Latencia de validación
- Errores de validación

---

**Paso 5.4: Configurar Alertas**

**Alertas:**
- Múltiples intentos denegados
- JWT inválidos repetidos
- Latencia alta de validación
- Tasa de error alta

---

### Resumen de Esfuerzo

**Total Estimado:** 14-19 horas (~2-3 días)

**Desglose:**
- Fase 1 (Metadata): 2-3 horas
- Fase 2 (Middleware): 4-5 horas
- Fase 3 (Logging): 2-3 horas
- Fase 4 (Testing): 4-5 horas
- Fase 5 (Optimización): 2-3 horas

**ROI:** Altamente positivo
- Seguridad: 6/10 → 10/10
- Compliance: Auditoría completa
- Confianza: Sistema blindado

---

## 🧪 Testing de Seguridad

### Metodología de Testing

**Enfoque:**
Testing de penetración (pentesting) simulando atacante malicioso.

---

### Escenario 1: Cliente Malicioso Intenta Ver Tickets de Otros

**Objetivo del Atacante:**
Ver tickets de otros clientes modificando código frontend.

**Pasos del Ataque:**
1. Cliente A se autentica normalmente
2. Abre DevTools del navegador
3. Localiza función de filtrado en `useWebSocketEvents.js`
4. Modifica función para retornar `true` siempre
5. Espera eventos de otros clientes

**Resultado Esperado:**
- Cliente A NO recibe eventos de otros clientes
- Middleware bloquea eventos en servidor
- Logs registran que Cliente A solo recibe sus eventos
- Modificación de frontend es inútil

**Verificación:**
- Revisar logs de auditoría
- Confirmar que solo eventos autorizados fueron enviados
- Verificar que no hay fugas de información

---

### Escenario 2: Atacante Intenta Modificar JWT

**Objetivo del Atacante:**
Cambiar user_id en JWT para hacerse pasar por otro usuario.

**Pasos del Ataque:**
1. Atacante obtiene su JWT válido
2. Decodifica JWT (Base64)
3. Modifica campo `user_id` a ID de otro usuario
4. Codifica JWT modificado
5. Intenta conectar con JWT modificado

**Resultado Esperado:**
- Servidor rechaza JWT (firma inválida)
- Conexión WebSocket es rechazada
- Log registra intento con JWT inválido
- Alerta de seguridad se genera

**Verificación:**
- Conexión es rechazada
- Log muestra JWT inválido
- Usuario no puede conectar

---

### Escenario 3: Atacante Intenta Replay Attack

**Objetivo del Atacante:**
Reutilizar JWT expirado o de otra sesión.

**Pasos del Ataque:**
1. Atacante captura JWT válido
2. Espera a que expire
3. Intenta conectar con JWT expirado
4. O intenta usar JWT de otro usuario

**Resultado Esperado:**
- JWT expirado es rechazado
- Evento `token_expired` es emitido
- JWT de otro usuario es rechazado (firma no coincide)
- Logs registran intentos

**Verificación:**
- JWT expirado no permite conexión
- JWT de otro usuario no funciona
- Logs muestran intentos rechazados

---


### Escenario 4: Analista Intenta Ver Tickets No Asignados

**Objetivo del Atacante:**
Analista intenta ver tickets de otros analistas.

**Pasos del Ataque:**
1. Analista A se autentica
2. Modifica frontend para no filtrar por asignación
3. Espera eventos de tickets no asignados a él

**Resultado Esperado:**
- Analista A solo recibe eventos de sus tickets
- Middleware valida `analista_id` en metadata
- Eventos de otros analistas son bloqueados
- Logs registran solo eventos autorizados

**Verificación:**
- Analista solo ve sus tickets
- Logs confirman filtrado correcto
- No hay fugas de información

---

### Escenario 5: Supervisor Intenta Acceso No Autorizado

**Objetivo del Atacante:**
Supervisor intenta ver tickets fuera de su área.

**Pasos del Ataque:**
1. Supervisor A se autentica
2. Intenta ver tickets asignados por Supervisor B
3. Modifica frontend para mostrar todos los tickets

**Resultado Esperado:**
- Supervisor A solo recibe eventos de tickets que él asignó
- Middleware valida `supervisor_id` en metadata
- Eventos de otros supervisores son bloqueados
- Excepción: Eventos tipo "team" son permitidos

**Verificación:**
- Supervisor ve solo tickets autorizados
- Logs confirman validación correcta
- Permisos de equipo funcionan correctamente

---

### Escenario 6: Man-in-the-Middle (MITM)

**Objetivo del Atacante:**
Interceptar y modificar eventos WebSocket.

**Pasos del Ataque:**
1. Atacante intercepta conexión WebSocket
2. Intenta inyectar eventos falsos
3. Intenta modificar eventos en tránsito

**Resultado Esperado:**
- Conexión usa WSS (WebSocket Secure)
- Eventos están protegidos por TLS
- Eventos inyectados no tienen firma válida
- Cliente rechaza eventos sin validación

**Verificación:**
- Conexión es segura (WSS)
- Eventos no pueden ser modificados
- Inyección de eventos falla

---

### Escenario 7: Carga Masiva de Eventos

**Objetivo:**
Verificar que sistema mantiene seguridad bajo carga.

**Pasos:**
1. Generar 1000 eventos simultáneos
2. 100 usuarios conectados
3. Verificar que cada usuario recibe solo eventos autorizados

**Resultado Esperado:**
- Todos los eventos son validados
- No hay fugas por race conditions
- Performance se mantiene aceptable
- Logs son completos

**Verificación:**
- Cada usuario recibe solo eventos autorizados
- No hay eventos perdidos
- Latencia < 500ms
- Logs completos y correctos

---

## 📊 Casos de Uso y Validaciones

### Caso de Uso 1: Cliente Crea Ticket

**Flujo:**
1. Cliente A crea ticket
2. Backend guarda en BD
3. Backend construye metadata:
   - `cliente_id`: ID de Cliente A
   - `roles_permitidos`: ["supervisor", "administrador"]
   - `tipo_permiso`: "team"
4. Backend emite `ticket_created` a global_tickets
5. Middleware valida para cada cliente conectado:
   - Cliente A: DENEGAR (no es supervisor)
   - Cliente B: DENEGAR (no es supervisor)
   - Supervisor X: PERMITIR (rol supervisor)
   - Analista Y: DENEGAR (no es supervisor)
   - Admin Z: PERMITIR (es administrador)

**Resultado:**
- Solo supervisores y administradores reciben evento
- Clientes NO ven tickets de otros clientes siendo creados
- Supervisores pueden asignar el ticket

---

### Caso de Uso 2: Supervisor Asigna Ticket a Analista

**Flujo:**
1. Supervisor asigna ticket a Analista A
2. Backend guarda asignación
3. Backend construye metadata:
   - `cliente_id`: ID del cliente dueño
   - `analista_id`: ID de Analista A
   - `supervisor_id`: ID del supervisor
   - `roles_permitidos`: ["cliente", "analista", "supervisor", "administrador"]
   - `tipo_permiso`: "assigned"
4. Backend emite `ticket_asignado`
5. Middleware valida:
   - Cliente dueño: PERMITIR (cliente_id coincide)
   - Analista A: PERMITIR (analista_id coincide)
   - Analista B: DENEGAR (analista_id no coincide)
   - Supervisor: PERMITIR (supervisor_id coincide)

**Resultado:**
- Cliente ve que su ticket fue asignado
- Analista A ve nuevo ticket en su lista
- Analista B NO ve el ticket
- Supervisor ve confirmación de asignación

---


### Caso de Uso 3: Analista Escala Ticket

**Flujo:**
1. Analista A escala ticket
2. Backend elimina asignación
3. Backend construye metadata:
   - `cliente_id`: ID del cliente dueño
   - `analista_id`: null (ya no asignado)
   - `supervisor_id`: ID del supervisor original
   - `roles_permitidos`: ["supervisor", "administrador"]
   - `tipo_permiso`: "team"
4. Backend emite `ticket_escalado`
5. Middleware valida:
   - Analista A: DENEGAR (analista_id es null)
   - Supervisor: PERMITIR (rol supervisor)
   - Cliente: DENEGAR (no es supervisor)

**Resultado:**
- Analista A NO recibe evento (perdió asignación)
- Ticket desaparece de lista de Analista A
- Supervisor recibe evento para reasignar
- Cliente NO ve detalles internos de escalamiento

---

### Caso de Uso 4: Cliente Solicita Reapertura

**Flujo:**
1. Cliente solicita reapertura de ticket solucionado
2. Backend crea comentario de solicitud
3. Backend construye metadata:
   - `cliente_id`: ID del cliente
   - `supervisor_id`: ID del supervisor asignado
   - `roles_permitidos`: ["cliente", "supervisor", "administrador"]
   - `tipo_permiso`: "assigned"
4. Backend emite `solicitud_reapertura`
5. Middleware valida:
   - Cliente: PERMITIR (cliente_id coincide)
   - Supervisor: PERMITIR (supervisor_id coincide)
   - Analista: DENEGAR (no en roles_permitidos)

**Resultado:**
- Cliente ve confirmación de solicitud
- Supervisor ve solicitud pendiente
- Analista NO ve (no es su responsabilidad)

---

### Caso de Uso 5: Supervisor Cierra Ticket

**Flujo:**
1. Supervisor cierra ticket
2. Backend actualiza estado
3. Backend construye metadata:
   - `cliente_id`: ID del cliente dueño
   - `analista_id`: ID del analista asignado
   - `supervisor_id`: ID del supervisor
   - `roles_permitidos`: ["analista", "supervisor", "administrador"]
   - `tipo_permiso`: "assigned"
   - Nota: Cliente NO en roles_permitidos
4. Backend emite `ticket_cerrado`
5. Middleware valida:
   - Cliente: DENEGAR (no en roles_permitidos)
   - Analista: PERMITIR (analista_id coincide)
   - Supervisor: PERMITIR (supervisor_id coincide)

**Resultado:**
- Cliente NO recibe evento (ticket se elimina de su lista)
- Analista ve que ticket fue cerrado
- Supervisor ve confirmación

---

### Caso de Uso 6: Chat Supervisor-Analista

**Flujo:**
1. Supervisor envía mensaje en chat
2. Backend guarda mensaje
3. Backend construye metadata:
   - `analista_id`: ID del analista participante
   - `supervisor_id`: ID del supervisor participante
   - `ticket_id`: ID del ticket relacionado
   - `roles_permitidos`: ["analista", "supervisor", "administrador"]
   - `tipo_permiso`: "assigned"
4. Backend emite `nuevo_mensaje_chat`
5. Middleware valida:
   - Analista participante: PERMITIR (analista_id coincide)
   - Supervisor participante: PERMITIR (supervisor_id coincide)
   - Otro analista: DENEGAR (analista_id no coincide)
   - Cliente: DENEGAR (no en roles_permitidos)

**Resultado:**
- Solo participantes del chat reciben mensaje
- Otros usuarios NO ven mensajes privados
- Privacidad del chat garantizada

---

## 🎯 Resumen Ejecutivo

### Estado Actual vs Propuesto

**ANTES (Actual):**
```
Seguridad: 6/10
Filtrado: Solo frontend
Manipulación: Posible
Auditoría: No existe
Confianza: En cliente
```

**DESPUÉS (Propuesto):**
```
Seguridad: 10/10
Filtrado: Backend + Frontend
Manipulación: Imposible
Auditoría: Completa
Confianza: En servidor (JWT)
```

---

### Principio Fundamental

**"JWT es la única fuente de verdad inmodificable desde el frontend"**

- JWT firmado criptográficamente
- Imposible de modificar sin detectarse
- Validado en cada operación
- Base para todas las decisiones de autorización

---

### Garantías de Seguridad

✅ **Cliente NUNCA recibe eventos no autorizados**
- Middleware valida en servidor
- Basado en JWT inmodificable
- Independiente de código frontend

✅ **Manipulación de frontend es inútil**
- Seguridad en servidor, no en cliente
- Modificar código no da acceso
- Principio de "nunca confiar en el cliente"

✅ **Auditoría completa**
- Todos los accesos registrados
- Investigación de incidentes posible
- Compliance regulatorio

✅ **Trazabilidad total**
- Quién accedió a qué y cuándo
- Detección de intentos no autorizados
- Evidencia para acciones legales

✅ **Defensa en profundidad**
- 6 capas de seguridad
- Múltiples puntos de validación
- Fallo de una capa no compromete sistema

---

### Esfuerzo de Implementación

**Total:** 14-19 horas (~2-3 días)

**Fases:**
1. Metadata de permisos: 2-3 horas
2. Middleware de autorización: 4-5 horas
3. Logging y auditoría: 2-3 horas
4. Testing de seguridad: 4-5 horas
5. Optimización: 2-3 horas

**ROI:** Altamente positivo
- Bajo costo de implementación
- Alto beneficio de seguridad
- Crítico para producción

---

### Recomendación

**IMPLEMENTAR INMEDIATAMENTE** ✅

**Razones:**
1. Vulnerabilidades críticas actuales
2. Bajo costo de implementación
3. Alto beneficio de seguridad
4. Requisito para producción
5. Compliance y auditoría
6. Confianza de usuarios

---

## 📚 Referencias

- **Documentación de Flujos:** `mapaDeDatos/websockets/flujoEnumerado.md`
- **Base de Implementación:** `mapaDeDatos/websockets/baseSockets.md`
- **Sugerencias Generales:** `mapaDeDatos/websockets/sugerenciasSocket.md`
- **JWT RFC:** https://tools.ietf.org/html/rfc7519
- **Socket.IO Security:** https://socket.io/docs/v4/middlewares/
- **OWASP WebSocket Security:** https://owasp.org/www-community/vulnerabilities/WebSocket_security

---

**Última actualización:** 2025-12-29  
**Mantenido por:** Equipo de desarrollo TiBACK  
**Estado:** Propuesta de Implementación  
**Prioridad:** 🔴 CRÍTICA

---

**FIN DEL DOCUMENTO**
