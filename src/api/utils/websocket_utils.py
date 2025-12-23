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
        
        # SOLO global_tickets - todos reciben TODO
        socketio.emit(event, data, room='global_tickets')
        
        # DEBUG: Log para verificar emisión
        print(f"✅ WebSocket emitido: {event} → global_tickets (ticket_id: {ticket.id})")
        
        return True
        
    except Exception as e:
        print(f"Error emitiendo evento WebSocket {event}: {e}")
        return False


def emit_ticket_created(ticket):
    """Emite evento de ticket creado."""
    print(f"📨 emit_ticket_created llamado para ticket {ticket.id}")
    
    return emit_ticket_event(
        event='ticket_created',
        ticket=ticket,
        action='creado',
        extra_data={'id_cliente': ticket.id_cliente}
    )


def emit_ticket_asignado(ticket, analista_id, es_reasignacion=False):
    """Emite evento de ticket asignado o reasignado."""
    action = 'reasignado' if es_reasignacion else 'asignado'
    event = 'ticket_reasignado' if es_reasignacion else 'ticket_asignado'
    
    return emit_ticket_event(
        event=event,
        ticket=ticket,
        action=action,
        extra_data={
            'analista_id': analista_id,
            'id_analista': analista_id,
            'es_reasignacion': es_reasignacion
        }
    )


def emit_ticket_escalado(ticket):
    """Emite evento de ticket escalado."""
    return emit_ticket_event(
        event='ticket_escalado',
        ticket=ticket,
        action='escalado'
    )


def emit_ticket_estado_changed(ticket, nuevo_estado):
    """Emite evento genérico de cambio de estado."""
    event_map = {
        'en_proceso': 'ticket_iniciado',
        'solucionado': 'ticket_solucionado',
        'cerrado': 'ticket_cerrado',
        'reabierto': 'ticket_reabierto',
        'escalado': 'ticket_escalado'
    }
    
    event = event_map.get(nuevo_estado, 'ticket_updated')
    
    return emit_ticket_event(
        event=event,
        ticket=ticket,
        action=f'estado_cambiado_a_{nuevo_estado}',
        extra_data={'nuevo_estado': nuevo_estado}
    )


def emit_ticket_evaluado(ticket):
    """
    Emite evento cuando cliente evalúa un ticket.
    Todos los roles reciben la calificación en tiempo real.
    """
    return emit_ticket_event(
        event='ticket_evaluado',
        ticket=ticket,
        action='evaluado',
        extra_data={
            'calificacion': ticket.calificacion,
            'evaluado_en': datetime.now().isoformat()
        }
    )


def emit_comentario_nuevo(comentario, ticket):
    """
    Emite evento cuando se agrega un nuevo comentario.
    Todos los roles ven el comentario en tiempo real.
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
            **autor_info
        }
        
        # SOLO global_tickets
        socketio.emit('comentario_nuevo', data, room='global_tickets')
        
        return True
        
    except Exception as e:
        print(f"Error emitiendo comentario_nuevo: {e}")
        return False
