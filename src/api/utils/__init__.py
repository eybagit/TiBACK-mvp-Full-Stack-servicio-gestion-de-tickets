"""
API Utils - Utilidades compartidas para la API

Módulos disponibles:
- websocket_utils: Emisión centralizada de eventos WebSocket
- Importaciones desde api/utils_legacy.py: APIException, generate_sitemap
"""

# Importar desde el archivo utils_legacy.py (anteriormente utils.py)
from ..utils_legacy import APIException, generate_sitemap


from .websocket_utils import (
    emit_ticket_event,
    emit_ticket_created,
    emit_ticket_asignado,
    emit_ticket_escalado,
    emit_ticket_estado_changed,
    get_socketio
)

__all__ = [
    'APIException',
    'generate_sitemap',
    'emit_ticket_event',
    'emit_ticket_created',
    'emit_ticket_asignado',
    'emit_ticket_escalado',
    'emit_ticket_estado_changed',
    'get_socketio'
]
