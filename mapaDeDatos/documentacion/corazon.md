# HISTORIAS DE USUARIO - SISTEMA DE TICKETS

## ROL: CLIENTE

### Registro de cuenta
- **Como** cliente, **quiero** registrarme en el sistema **para** poder crear y dar seguimiento a mis tickets.

### Creación de ticket
- **Como** cliente, **quiero** crear un ticket describiendo mi problema **para** que el equipo pueda atenderlo y darle seguimiento.

### Consulta de estado
- **Como** cliente, **quiero** consultar el estado de mi ticket **para** conocer en qué etapa del proceso se encuentra.

### Cierre y evaluación
- **Como** cliente, **quiero** cerrar el ticket y evaluar la atención recibida **para** aportar retroalimentación al servicio.

### Reapertura de ticket
- **Como** cliente, **quiero** reabrir un ticket si la solución no fue satisfactoria **para** que el equipo lo revise nuevamente.

---

## ROL: SUPERVISOR

### Recepción, revisión y clasificación del ticket
- **Como** supervisor, **quiero** recibir los tickets creados **para** verificar el tipo de problema, ver su prioridad y clasificarlos.

### Asignación a analista
- **Como** supervisor, **quiero** asignar el ticket al analista más competente **para** garantizar una solución eficiente.

### Reasignación
- **Como** supervisor, **quiero** reasignar el ticket a un analista más experimentado cuando la complejidad lo requiera.

---

## ROL: ANALISTA

### Recepción de ticket asignado
- **Como** analista, **quiero** consultar mis tickets asignados **para** revisar el problema y planificar la solución.

### Resolución de ticket
- **Como** analista, **quiero** dejar comentarios, cambiar el estado y resolver el problema reportado **para** cerrar el ticket satisfactoriamente.

### Escalado al supervisor
- **Como** analista, **quiero** escalar el ticket al supervisor cuando no pueda resolverlo.

---

## ROL: ADMINISTRADOR (Opcional)

### Gestión de usuarios y roles
- **Como** administrador, **quiero** gestionar usuarios y roles **para** controlar el acceso y permisos del sistema.

### Gestión de estados y flujos
- **Como** administrador, **quiero** configurar los estados y flujos de los tickets **para** adaptar el sistema a las necesidades del servicio.

---

## ESTADOS DEL TICKET

- **Creado**: Cliente registra el ticket.
- **En espera**: Pendiente de asignación a analista.
- **En proceso**: Analista trabajando en la solución.
- **Solucionado**: Cliente recibe la propuesta de solución.
- **Cerrado**: Cliente acepta la solución y evalúa la atención.
- **Reabierto**: Cliente reactiva un ticket cerrado porque la solución no fue satisfactoria o el problema persiste.

---




# FLUJO DEL SERVICIO TiBACK

## 1. El cliente entra al sistema
- Si no tiene cuenta, se registra.
- Si ya tiene, inicia sesión.

## 2. El cliente crea un ticket
- El cliente escribe su problema o solicitud.
- El sistema genera un número de seguimiento.
- El ticket queda en estado **"Creado"**.

## 3. El supervisor recibe el ticket
- El supervisor ve el ticket en su bandeja.
- Revisa el ticket, clasifica y establece su prioridad.
- El supervisor lo asigna a un analista o lo reasigna a uno más experimentado si es complejo.
- El ticket pasa a **"En espera"** hasta que se asigna.

## 4. El analista trabaja en el ticket
- El analista recibe el ticket y lo pone en estado **"En proceso"**.
- Analiza el problema y deja comentarios o actualiza el estado.
- Si el analista puede resolverlo, marca el ticket como **"Solucionado"**.
- Si no puede, lo escala al supervisor para que decida qué hacer, se marca automáticamente como **"En espera"**.

## 5. El cliente recibe la solución
- El cliente revisa la propuesta.
- Si está conforme, cierra el ticket y deja su evaluación.
- Si no está conforme, solicita reabrir el ticket y lo envía al supervisor para revisión.

## 6. El administrador
- El administrador gestiona usuarios, roles y permisos.
- El administrador configura los estados y flujos del sistema.

---


# DETALLES TÉCNICOS - BASE DE DATOS Y RELACIONES

Las tablas de la base de datos no se modificarán, permaneciendo tal como están. La lógica de funcionamiento estará en la gestión de los estados y la relación entre los registros. **"FK"** significa que ese campo es una llave foránea. A continuación, se detallan las tablas que trabajan de manera conjunta:

## Tablas Principales

### Ticket
- **Campos**: `id`, `id_cliente` (FK), `estado`, `titulo`, `descripcion`, `fecha_creacion`, `fecha_cierre`, `prioridad`, `calificacion`, `comentario`, `fecha_evaluacion`, `url_imagen`.
- **Flujo**: El cliente crea un ticket, este pasa a los distintos estados según su evolución (Creado → En espera → En proceso → Solucionado → Cerrado → Reabierto).

### Comentario
- **Campos**: `id`, `id_gestion` (FK), `id_cliente` (FK), `id_analista` (FK), `id_supervisor` (FK), `texto`, `fecha_comentario`.
- **Flujo**: El analista y supervisor dejan comentarios en el ticket, y se gestionan mediante el campo `id_gestion`.

### Asignación
- **Campos**: `id`, `id_ticket` (FK), `id_supervisor` (FK), `id_analista` (FK), `fecha_asignacion`.
- **Flujo**: El supervisor asigna un analista a un ticket. La asignación cambia el estado de "En espera" a "En proceso".

### Gestión
- **Campos**: `id`, `id_ticket` (FK), `fecha_cambio`, `Nota de caso`.
- **Flujo**: Se gestionan los tickets, y se realizan cambios en el estado según las necesidades de resolución.

## Roles

Los roles son gestionados mediante las siguientes tablas:

### Cliente
- **Campos**: `id`, `dirección`, `teléfono`, `nombre`, `apellido`, `email`, `contraseña_hash`, `url_imagen`.

### Administrador
- **Campos**: `id`, `permisos_especiales`, `email`, `contraseña_hash`.

### Supervisor
- **Campos**: `id`, `area_responsable`, `nombre`, `apellido`, `email`, `contraseña_hash`.

### Analista
- **Campos**: `id`, `especialidad`, `nombre`, `apellido`, `email`, `contraseña_hash`.

## Notas Importantes

- Las cuentas de administrador están precargadas en la base de datos.
- El administrador es responsable de crear los registros de supervisores y analistas.
- Las relaciones entre las tablas de `Ticket`, `Comentario`, `Asignación`, y `Gestión` son cruciales para gestionar correctamente el flujo de trabajo del ticket y su seguimiento.

---

# CONSIDERACIONES FINALES

- **Flujo completo del ticket**: Todos los roles (Cliente, Analista, Supervisor, y Administrador) están interrelacionados para garantizar el correcto seguimiento del ticket.
- **Estado de los tickets**: Los estados son esenciales para conocer en qué fase se encuentra un ticket y para las operaciones que deben realizar los roles correspondientes.
