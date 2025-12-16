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
cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY')
cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET')

if cloudinary_url:
    cloudinary.config(cloudinary_url=cloudinary_url)
elif cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret:
    cloudinary.config(
        cloud_name=cloudinary_cloud_name,
        api_key=cloudinary_api_key,
        api_secret=cloudinary_api_secret
    )

# ==================== FUNCIONES HELPER WEBSOCKET ====================

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


def emit_websocket_event(event_name, data, room=None, include_self=False, callback=None):
    """
    Emite eventos WebSocket de manera robusta con manejo de errores
    
    Args:
        event_name (str): Nombre del evento
        data (dict): Datos a enviar
        room (str, optional): Room específica. Si es None, envía a todos
        include_self (bool): Si incluir al emisor en el broadcast
        callback (callable, optional): Callback para manejar confirmación
    """
    try:
        socketio = get_socketio()
        if socketio:
            if 'timestamp' not in data:
                data['timestamp'] = datetime.now().isoformat()
            
            if room:
                socketio.emit(event_name, data, room=room, include_self=include_self, callback=callback)
                print(f"📤 Evento '{event_name}' enviado a room '{room}'")
            else:
                socketio.emit(event_name, data, callback=callback)
                print(f"📤 Evento '{event_name}' enviado globalmente")
                
            return True
    except Exception as e:
        print(f"❌ Error enviando WebSocket '{event_name}': {e}")
        return False
    
    return False


def emit_websocket_to_role(event_name, data, role, include_self=False):
    """Emite evento a todos los usuarios de un rol específico"""
    role_room = f'role_{role}'
    return emit_websocket_event(event_name, data, room=role_room, include_self=include_self)


def emit_websocket_to_user(event_name, data, user_id):
    """Emite evento a un usuario específico"""
    user_room = f'user_{user_id}'
    return emit_websocket_event(event_name, data, room=user_room)


def emit_websocket_to_ticket(event_name, data, ticket_id, include_self=False):
    """Emite evento a todos los usuarios conectados a un ticket"""
    ticket_room = f'room_ticket_{ticket_id}'
    return emit_websocket_event(event_name, data, room=ticket_room, include_self=include_self)


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
    """Emite evento crítico de ticket a todos los roles críticos"""
    critical_roles = ['cliente', 'analista', 'supervisor']
    
    for role in critical_roles:
        emit_websocket_to_role('critical_ticket_update', {
            'ticket_id': ticket_id,
            'action': action,
            'user_id': user_data['id'],
            'role': user_data['role'],
            'priority': 'critical'
        }, role, include_self=False)
    
    emit_websocket_to_ticket('critical_ticket_update', {
        'ticket_id': ticket_id,
        'action': action,
        'user_id': user_data['id'],
        'role': user_data['role'],
        'priority': 'critical'
    }, ticket_id, include_self=False)
    
    print(f'🚨 Evento crítico emitido: {action} en ticket {ticket_id} por {user_data["role"]} (ID: {user_data["id"]})')
    return True


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
    cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY')
    cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    cloudinary_configured = (
        cloudinary_url or 
        (cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret)
    )
    
    return jsonify({
        "cloudinary_configured": cloudinary_configured,
        "cloudinary_url": bool(cloudinary_url),
        "cloudinary_cloud_name": cloudinary_cloud_name,
        "cloudinary_api_key": bool(cloudinary_api_key),
        "cloudinary_api_secret": bool(cloudinary_api_secret)
    }), 200
