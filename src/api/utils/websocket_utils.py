"""
WebSocket Utils - Utilidades para emisión de eventos WebSocket

SIMPLIFICADO: Todos los eventos se emiten SOLO a 'global_tickets'
Todos los roles (supervisor, analista, cliente) escuchan TODO.
El frontend filtra lo que necesita con useMemo.

Uso:
    from api.utils.websocket_utils import emit_ticket_event
    
    emit_ticket_created(ticket)  # Simple, sin rooms
"""

from datetime import datetime
from functools import lru_cache

# 🔒 SEGURIDAD: Middleware de autorización WebSocket
from api.middleware.websocket_auth import emit_con_autorizacion


def get_socketio():
    """
    Obtiene la instancia de SocketIO de forma segura.
    
    Returns:
        SocketIO: Instancia de Flask-SocketIO o None si no está disponible
    """
    try:
        from app import socketio
        return socketio
    except ImportError as e:
        print(f"❌ ERROR: No se pudo importar socketio: {e}")
        return None




def emit_ticket_event(event, ticket, action=None, extra_data=None):
    """
    Emite un evento de ticket a TODOS los clientes via global_tickets.
    
    SIEMPRE envía el ticket completo para evitar que el frontend
    tenga que manejar casos donde solo viene ticket_id.
    
    Args:
        event (str): Nombre del evento (ej: 'ticket_asignado')
        ticket: Objeto Ticket de SQLAlchemy
        action (str, optional): Acción realizada (ej: 'asignado', 'escalado')
        extra_data (dict, optional): Datos adicionales a incluir
    
    Returns:
        bool: True si se emitió correctamente, False si falló
    
    Example:
        emit_ticket_event('ticket_escalado', ticket, action='escalado')
    """
    socketio = get_socketio()
    if not socketio:
        return False
    
    try:
        # Estructura base CONSISTENTE
        data = {
            'ticket_id': ticket.id,
            'ticket': ticket.serialize(),  # SIEMPRE completo
            'action': action,
            'estado': ticket.estado,
            'timestamp': datetime.now().isoformat(),
        }
        
        # Agregar datos extra si existen
        if extra_data:
            data.update(extra_data)
        
        # 🔒 SEGURIDAD: Usar middleware de autorización JWT
        # Filtra eventos en BACKEND antes de enviar a cada cliente
        enviados = emit_con_autorizacion(
            socketio=socketio,
            evento_nombre=event,
            evento_data=data,
            room='global_tickets'
        )
        
        # DEBUG: Log para verificar emisión con filtrado
        print(f"✅ WebSocket filtrado: {event} → {enviados} clientes autorizados (ticket_id: {ticket.id})")
        
        return enviados > 0
        
    except Exception as e:
        print(f"Error emitiendo evento WebSocket {event}: {e}")
        return False


def emit_ticket_created(ticket):
    """Emite evento de ticket creado CON metadata de permisos."""
    print(f"📨 emit_ticket_created llamado para ticket {ticket.id}")
    
    # Construir metadata de permisos
    metadata = construir_metadata_permisos(ticket, 'ticket_created')
    
    return emit_ticket_event(
        event='ticket_created',
        ticket=ticket,
        action='creado',
        extra_data={
            'id_cliente': ticket.id_cliente,
            '_permissions': metadata  # ✅ NUEVA SEGURIDAD
        }
    )



def emit_ticket_asignado(ticket, analista_id, es_reasignacion=False):
    """Emite evento de ticket asignado o reasignado CON metadata de permisos."""
    action = 'reasignado' if es_reasignacion else 'asignado'
    event = 'ticket_reasignado' if es_reasignacion else 'ticket_asignado'
    
    # Construir metadata de permisos
    metadata = construir_metadata_permisos(ticket, event)
    
    return emit_ticket_event(
        event=event,
        ticket=ticket,
        action=action,
        extra_data={
            'analista_id': analista_id,
            'id_analista': analista_id,
            'es_reasignacion': es_reasignacion,
            '_permissions': metadata  # ✅ NUEVA SEGURIDAD
        }
    )



def emit_ticket_escalado(ticket):
    """Emite evento de ticket escalado CON metadata de permisos."""
    # Construir metadata de permisos
    metadata = construir_metadata_permisos(ticket, 'ticket_escalado')
    
    return emit_ticket_event(
        event='ticket_escalado',
        ticket=ticket,
        action='escalado',
        extra_data={'_permissions': metadata}  # ✅ NUEVA SEGURIDAD
    )



def emit_ticket_estado_changed(ticket, nuevo_estado):
    """Emite evento genérico de cambio de estado CON metadata de permisos."""
    event_map = {
        'en_proceso': 'ticket_iniciado',
        'solucionado': 'ticket_solucionado',
        'cerrado': 'ticket_cerrado',
        'reabierto': 'ticket_reabierto',
        'escalado': 'ticket_escalado'
    }
    
    event = event_map.get(nuevo_estado, 'ticket_updated')
    
    # Construir metadata de permisos
    metadata = construir_metadata_permisos(ticket, event)
    
    return emit_ticket_event(
        event=event,
        ticket=ticket,
        action=f'estado_cambiado_a_{nuevo_estado}',
        extra_data={
            'nuevo_estado': nuevo_estado,
            '_permissions': metadata  # ✅ NUEVA SEGURIDAD
        }
    )



def emit_ticket_evaluado(ticket):
    """
    Emite evento cuando cliente evalúa un ticket CON metadata de permisos.
    Todos los roles autorizados reciben la calificación en tiempo real.
    """
    # Construir metadata de permisos
    metadata = construir_metadata_permisos(ticket, 'ticket_evaluado')
    
    return emit_ticket_event(
        event='ticket_evaluado',
        ticket=ticket,
        action='evaluado',
        extra_data={
            'calificacion': ticket.calificacion,
            'evaluado_en': datetime.now().isoformat(),
            '_permissions': metadata  # ✅ NUEVA SEGURIDAD
        }
    )



def emit_comentario_nuevo(comentario, ticket):
    """
    Emite evento cuando se agrega un nuevo comentario CON metadata de permisos.
    Los roles autorizados ven el comentario en tiempo real.
    """
    socketio = get_socketio()
    if not socketio:
        return False
    
    try:
        # Detectar autor
        autor_info = {}
        if comentario.id_analista:
            autor_info = {
                'autor_tipo': 'analista',
                'autor_id': comentario.id_analista,
                'autor_nombre': comentario.analista.nombre if comentario.analista else 'Analista'
            }
        elif comentario.id_cliente:
            autor_info = {
                'autor_tipo': 'cliente',
                'autor_id': comentario.id_cliente,
                'autor_nombre': comentario.cliente.nombre if comentario.cliente else 'Cliente'
            }
        else:
            autor_info = {
                'autor_tipo': 'supervisor',
                'autor_id': None,
                'autor_nombre': 'Supervisor'
            }
        
        # Construir metadata de permisos
        metadata = construir_metadata_comentario(comentario, ticket)
        
        data = {
            'ticket_id': ticket.id,
            'ticket': ticket.serialize(),
            'comentario_id': comentario.id,
            'comentario': comentario.serialize() if hasattr(comentario, 'serialize') else {
                'id': comentario.id,
                'contenido': comentario.contenido,
                'fecha_creacion': comentario.fecha_creacion.isoformat() if comentario.fecha_creacion else None
            },
            'action': 'comentario_nuevo',
            'timestamp': datetime.now().isoformat(),
            '_permissions': metadata,  # ✅ NUEVA SEGURIDAD
            **autor_info
        }
        
        # SOLO global_tickets
        socketio.emit('comentario_nuevo', data, room='global_tickets')
        
        return True
        
    except Exception as e:
        print(f"Error emitiendo comentario_nuevo: {e}")
        return False


# ==================== METADATA DE PERMISOS PARA SEGURIDAD ====================

def construir_metadata_permisos(ticket, tipo_evento):
    """
    Construye metadata de permisos para un evento de ticket.
    Esta metadata se usa para validar en el backend qué clientes pueden ver cada evento.
    
    SEGURIDAD: JWT como única fuente de verdad
    - La metadata define quién DEBE ver el evento
    - El middleware valida JWT del cliente contra esta metadata
    - El cliente NUNCA decide qué eventos puede ver
    
    Args:
        ticket: Entidad Ticket de SQLAlchemy con relaciones cargadas
        tipo_evento: Tipo de evento (str) como 'ticket_created', 'ticket_asignado', etc.
    
    Returns:
        dict: Metadata de permisos con estructura:
            {
                "cliente_id": int | None,
                "analista_id": int | None,
                "supervisor_id": int | None,
                "roles_permitidos": list[str],
                "tipo_permiso": str,  # "owner", "assigned", "team", "public", "admin_only"
                "ticket_id": int,
                "entidad_tipo": str,
                "accion": str
            }
    """
    from api.models import Asignacion
    
    # Estructura base de metadata
    metadata = {
        "cliente_id": ticket.id_cliente,
        "analista_id": None,
        "supervisor_id": None,
        "roles_permitidos": [],
        "tipo_permiso": "",
        "ticket_id": ticket.id,
        "entidad_tipo": "ticket",
        "accion": tipo_evento.replace("ticket_", "")
    }
    
    # Obtener asignación actual si existe
    try:
        if ticket.asignaciones:
            # Obtener la asignación más reciente
            asignacion_actual = max(ticket.asignaciones, key=lambda x: x.fecha_asignacion)
            metadata["analista_id"] = asignacion_actual.id_analista
            metadata["supervisor_id"] = asignacion_actual.id_supervisor
    except Exception as e:
        print(f"⚠️ Error obteniendo asignación para metadata: {e}")
    
    # Determinar permisos según tipo de evento
    # Basado en las reglas definidas en planSeguridad.md
    
    if tipo_evento == "ticket_created":
        # Solo supervisores y admins ven tickets nuevos (para asignar)
        metadata["roles_permitidos"] = ["supervisor", "administrador"]
        metadata["tipo_permiso"] = "team"
        metadata["cliente_id"] = ticket.id_cliente  # Cliente NO ve este evento
    
    elif tipo_evento in ["ticket_asignado", "ticket_reasignado"]:
        # Cliente, analista asignado, supervisor y admin
        metadata["roles_permitidos"] = ["cliente", "analista", "supervisor", "administrador"]
        metadata["tipo_permiso"] = "assigned"
    
    elif tipo_evento == "ticket_iniciado":
        # Analista inició trabajo - cliente, analista, supervisor y admin
        metadata["roles_permitidos"] = ["cliente", "analista", "supervisor", "administrador"]
        metadata["tipo_permiso"] = "assigned"
    
    elif tipo_evento == "ticket_solucionado":
        # Analista marcó como solucionado - todos los involucrados
        metadata["roles_permitidos"] = ["cliente", "analista", "supervisor", "administrador"]
        metadata["tipo_permiso"] = "assigned"
    
    elif tipo_evento == "ticket_cerrado":
        # Supervisor cierra - analista y supervisor ven, cliente NO
        metadata["roles_permitidos"] = ["analista", "supervisor", "administrador"]
        metadata["tipo_permiso"] = "assigned"
    
    elif tipo_evento == "ticket_reabierto":
        # Cliente reabre - cliente, supervisor y admin (analista NO)
        metadata["roles_permitidos"] = ["cliente", "supervisor", "administrador"]
        metadata["tipo_permiso"] = "assigned"
        metadata["analista_id"] = None  # Sin analista asignado aún
    
    elif tipo_evento == "ticket_escalado":
        # Analista escala - solo supervisores (para reasignar)
        metadata["roles_permitidos"] = ["supervisor", "administrador"]
        metadata["tipo_permiso"] = "team"
        metadata["analista_id"] = None  # Ya no tiene analista
    
    elif tipo_evento == "solicitud_reapertura":
        # Cliente solicita reapertura - cliente, supervisor y admin
        metadata["roles_permitidos"] = ["cliente", "supervisor", "administrador"]
        metadata["tipo_permiso"] = "assigned"
    
    elif tipo_evento == "ticket_evaluado":
        # Cliente evalúa - todos los involucrados
        metadata["roles_permitidos"] = ["cliente", "analista", "supervisor", "administrador"]
        metadata["tipo_permiso"] = "assigned"
    
    elif tipo_evento in ["ticket_updated", "ticket_actualizado"]:
        # Evento genérico - todos los involucrados
        metadata["roles_permitidos"] = ["cliente", "analista", "supervisor", "administrador"]
        metadata["tipo_permiso"] = "assigned"
    
    else:
        # Evento desconocido - solo admin por seguridad
        print(f"⚠️ Evento desconocido: {tipo_evento} - aplicando permisos admin_only")
        metadata["roles_permitidos"] = ["administrador"]
        metadata["tipo_permiso"] = "admin_only"
    
    # DEBUG: Log de metadata construida
    print(f"🔐 Metadata construida para {tipo_evento} (ticket #{ticket.id}): " +
          f"roles={metadata['roles_permitidos']}, tipo={metadata['tipo_permiso']}")
    
    return metadata


def construir_metadata_comentario(comentario, ticket):
    """
    Construye metadata de permisos para un evento de comentario.
    Los comentarios heredan permisos del ticket relacionado.
    
    Args:
        comentario: Entidad Comentario de SQLAlchemy
        ticket: Entidad Ticket relacionada
    
    Returns:
        dict: Metadata de permisos
    """
    # Heredar permisos base del ticket
    metadata = construir_metadata_permisos(ticket, "ticket_updated")
    
    # Agregar información específica del comentario
    metadata["entidad_tipo"] = "comentario"
    metadata["accion"] = "comentario_nuevo"
    metadata["comentario_id"] = comentario.id
    
    # Determinar creador del comentario
    if comentario.id_cliente:
        metadata["creador_id"] = comentario.id_cliente
        metadata["creador_tipo"] = "cliente"
    elif comentario.id_analista:
        metadata["creador_id"] = comentario.id_analista
        metadata["creador_tipo"] = "analista"
    elif comentario.id_supervisor:
        metadata["creador_id"] = comentario.id_supervisor
        metadata["creador_tipo"] = "supervisor"
    else:
        metadata["creador_id"] = None
        metadata["creador_tipo"] = "desconocido"
    
    return metadata
