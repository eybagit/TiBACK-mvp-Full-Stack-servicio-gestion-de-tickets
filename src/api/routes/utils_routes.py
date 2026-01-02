"""
Rutas de utilidades y funciones helper compartidas para WebSocket y manejo de errores
"""
import os
import cloudinary
from datetime import datetime
from flask import Blueprint, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Comentarios

utils_bp = Blueprint('utils', __name__)

# Configurar Cloudinary usando CLOUDINARY_URL
cloudinary_url = os.getenv('CLOUDINARY_URL')
if cloudinary_url:
    cloudinary.config(cloudinary_url=cloudinary_url)

# ==================== FUNCIONES HELPER WEBSOCKET ====================
# SIMPLIFICADO: Todas las emisiones van a global_tickets (todos reciben todo)
# El frontend filtra lo que necesita con useMemo

def get_socketio():
    """Obtiene la instancia de SocketIO de manera segura"""
    try:
        from app import get_socketio as get_socketio_from_app
        socketio_instance = get_socketio_from_app()
        return socketio_instance
    except ImportError:
        return None
    except Exception as e:
        return None


def emit_to_global(event_name, data, include_self=False):
    """
    Emite evento a global_tickets (ÚNICA fuente de verdad)
    
    NOTA: Todos los eventos van a global_tickets. 
    El frontend filtra lo que necesita usando useMemo/useCallback.
    
    Args:
        event_name (str): Nombre del evento
        data (dict): Datos a enviar
        include_self (bool): Si incluir al emisor
    """
    try:
        socketio = get_socketio()
        if socketio:
            if 'timestamp' not in data:
                data['timestamp'] = datetime.now().isoformat()
            
            # SIEMPRE global_tickets - única fuente de verdad
            # skip_sid=True para evitar error cuando se llama desde ruta HTTP (no WebSocket)
            socketio.emit(event_name, data, room='global_tickets', skip_sid=True)
            print(f"✅ WebSocket: {event_name} → global_tickets")
            return True
    except Exception as e:
        print(f"❌ Error enviando WebSocket '{event_name}': {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return False


# Funciones de compatibilidad (legacy) - todas redirigen a emit_to_global
def emit_websocket_event(event_name, data, room=None, include_self=False, callback=None):
    """Legacy: Redirige a emit_to_global (ignora room específica)"""
    return emit_to_global(event_name, data, include_self)


def emit_websocket_to_role(event_name, data, role, include_self=False):
    """Legacy: Redirige a emit_to_global (todos los roles reciben todo)"""
    return emit_to_global(event_name, data, include_self)


def emit_websocket_to_user(event_name, data, user_id):
    """Legacy: Redirige a emit_to_global (todos reciben, frontend filtra)"""
    return emit_to_global(event_name, data)


def emit_websocket_to_ticket(event_name, data, ticket_id, include_self=False):
    """Legacy: Redirige a emit_to_global (todos reciben, frontend filtra por ticket_id)"""
    # Asegurar que ticket_id está en data para que frontend pueda filtrar
    if 'ticket_id' not in data:
        data['ticket_id'] = ticket_id
    return emit_to_global(event_name, data, include_self)


def tiene_solicitud_reapertura_pendiente(ticket_id):
    """Verifica si un ticket tiene una solicitud de reapertura pendiente"""
    try:
        solicitud_reapertura = Comentarios.query.filter_by(
            id_ticket=ticket_id,
            texto="Cliente solicitó reapertura del ticket - Pendiente de decisión del supervisor"
        ).first()
        
        if solicitud_reapertura:
            decision_supervisor = Comentarios.query.filter(
                Comentarios.id_ticket == ticket_id,
                Comentarios.fecha_comentario > solicitud_reapertura.fecha_comentario,
                Comentarios.id_supervisor.isnot(None),
                Comentarios.texto.like("%Supervisor aprobó solicitud de reapertura%")
            ).first()
            
            return decision_supervisor is None
        
        return False
    except Exception as e:
        print(f"Error verificando solicitud de reapertura: {e}")
        return False


def emit_critical_ticket_action(ticket_id, action, user_data):
    """Emite evento crítico de ticket a global_tickets (todos reciben)"""
    # SIMPLIFICADO: Solo emit a global_tickets, todos reciben
    return emit_to_global('critical_ticket_update', {
        'ticket_id': ticket_id,
        'action': action,
        'user_id': user_data['id'],
        'role': user_data['role'],
        'priority': 'critical'
    })


# ==================== FUNCIONES HELPER MANEJO DE ERRORES ====================

def handle_database_error(e, operation="operación"):
    """Maneja errores de base de datos de manera consistente"""
    db.session.rollback()
    if isinstance(e, IntegrityError):
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    else:
        return jsonify({"message": f"Error en {operation}: {str(e)}"}), 500


def handle_general_error(e, operation="operación"):
    """Maneja errores generales de manera consistente"""
    return jsonify({"message": f"Error en {operation}: {str(e)}"}), 500


# ==================== RUTAS DE UTILIDADES ====================

@utils_bp.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200


@utils_bp.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Manejar solicitudes OPTIONS para CORS"""
    return '', 200


@utils_bp.route('/cloudinary-status', methods=['GET'])
def cloudinary_status():
    """Verificar el estado de la configuración de Cloudinary"""
    cloudinary_url = os.getenv('CLOUDINARY_URL')
    
    return jsonify({
        "cloudinary_configured": bool(cloudinary_url),
        "message": "Configuración verificada"
    }), 200

