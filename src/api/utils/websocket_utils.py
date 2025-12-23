"""
WebSocket Utils - Utilidades para emisión de eventos WebSocket

Este módulo centraliza la emisión de eventos WebSocket para garantizar
que SIEMPRE se envíen datos consistentes y completos.

Uso:
    from api.utils.websocket_utils import emit_ticket_event, get_socketio
    
    emit_ticket_event(
        event='ticket_asignado',
        ticket=ticket,
        action='asignado',
        extra_data={'analista_id': analista.id},
        rooms=['role_supervisor', 'role_analista', f'analista_{analista.id}']
    )
"""

from datetime import datetime
from functools import lru_cache


@lru_cache(maxsize=1)
def get_socketio():
    """
    Obtiene la instancia de SocketIO de forma segura.
    
    Returns:
        SocketIO: Instancia de Flask-SocketIO o None si no está disponible
    """
    try:
        from api import socketio
        return socketio
    except ImportError:
        return None


def emit_ticket_event(event, ticket, action, extra_data=None, rooms=None):
    """
    Emite un evento de ticket con estructura CONSISTENTE.
    
    SIEMPRE envía el ticket completo para evitar que el frontend
    tenga que manejar casos donde solo viene ticket_id.
    
    Args:
        event (str): Nombre del evento (ej: 'ticket_asignado')
        ticket: Objeto Ticket de SQLAlchemy
        action (str): Acción realizada (ej: 'asignado', 'escalado')
        extra_data (dict, optional): Datos adicionales a incluir
        rooms (list, optional): Lista de rooms a emitir. Si es None, broadcast global.
    
    Returns:
        bool: True si se emitió correctamente, False si falló
    
    Example:
        emit_ticket_event(
            event='ticket_escalado',
            ticket=ticket,
            action='escalado',
            rooms=['role_supervisor', f'room_ticket_{ticket.id}']
        )
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
        
        # Emitir a rooms específicas o broadcast
        if rooms:
            for room in rooms:
                if room:  # Ignorar rooms vacías
                    socketio.emit(event, data, room=room)
        else:
            socketio.emit(event, data)
        
        return True
        
    except Exception as e:
        print(f"Error emitiendo evento WebSocket {event}: {e}")
        return False


def emit_ticket_created(ticket, rooms=None):
    """
    Emite evento de ticket creado.
    
    Args:
        ticket: Ticket recién creado
        rooms: Rooms a notificar (default: supervisores y administradores)
    """
    if rooms is None:
        rooms = ['supervisores', 'administradores', f'cliente_{ticket.id_cliente}']
    
    return emit_ticket_event(
        event='ticket_created',
        ticket=ticket,
        action='creado',
        extra_data={'id_cliente': ticket.id_cliente},
        rooms=rooms
    )


def emit_ticket_asignado(ticket, analista_id, es_reasignacion=False, rooms=None):
    """
    Emite evento de ticket asignado o reasignado.
    
    Args:
        ticket: Ticket asignado
        analista_id: ID del analista asignado
        es_reasignacion: True si es reasignación
        rooms: Rooms a notificar
    """
    action = 'reasignado' if es_reasignacion else 'asignado'
    event = 'ticket_reasignado' if es_reasignacion else 'ticket_asignado'
    
    if rooms is None:
        rooms = [
            'supervisores',
            'administradores',
            f'analista_{analista_id}',
            'role_analista',
            f'room_ticket_{ticket.id}'
        ]
    
    return emit_ticket_event(
        event=event,
        ticket=ticket,
        action=action,
        extra_data={
            'analista_id': analista_id,
            'id_analista': analista_id,
            'es_reasignacion': es_reasignacion
        },
        rooms=rooms
    )


def emit_ticket_escalado(ticket, rooms=None):
    """
    Emite evento de ticket escalado.
    
    Args:
        ticket: Ticket escalado
        rooms: Rooms a notificar
    """
    if rooms is None:
        rooms = [
            'supervisores',
            'administradores',
            'role_analista',
            f'room_ticket_{ticket.id}'
        ]
    
    return emit_ticket_event(
        event='ticket_escalado',
        ticket=ticket,
        action='escalado',
        rooms=rooms
    )


def emit_ticket_estado_changed(ticket, nuevo_estado, rooms=None):
    """
    Emite evento genérico de cambio de estado.
    
    Args:
        ticket: Ticket modificado
        nuevo_estado: Nuevo estado del ticket
        rooms: Rooms a notificar
    """
    event_map = {
        'en_proceso': 'ticket_iniciado',
        'solucionado': 'ticket_solucionado',
        'cerrado': 'ticket_cerrado',
        'reabierto': 'ticket_reabierto',
        'escalado': 'ticket_escalado'
    }
    
    event = event_map.get(nuevo_estado, 'ticket_updated')
    
    if rooms is None:
        rooms = [
            'supervisores',
            'administradores',
            f'cliente_{ticket.id_cliente}',
            f'room_ticket_{ticket.id}'
        ]
        if ticket.id_analista:
            rooms.append(f'analista_{ticket.id_analista}')
    
    return emit_ticket_event(
        event=event,
        ticket=ticket,
        action=nuevo_estado,
        extra_data={'nuevo_estado': nuevo_estado},
        rooms=rooms
    )
