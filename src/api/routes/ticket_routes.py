"""
Rutas CRUD y acciones para la entidad Ticket
Refactorizado para usar TicketService e ImageService según documentacion/modular.md
"""
import json
from datetime import datetime
from flask import Blueprint, request, jsonify

from api.models import db, Ticket
from api.jwt_utils import require_role, require_auth, get_user_from_token
from api.services import TicketService, ImageService
from api.routes.utils_routes import (
    get_socketio, handle_general_error,
    emit_websocket_to_ticket, emit_websocket_to_role, emit_critical_ticket_action
)

ticket_bp = Blueprint('tickets', __name__)


def emit_ws_event(socketio, event, data, rooms):
    """Helper para emitir eventos WebSocket"""
    if not socketio:
        return
    try:
        for room in rooms:
            socketio.emit(event, data, room=room)
    except Exception as e:
        print(f"Error enviando WebSocket {event}: {e}")


# ==================== CRUD BÁSICO ====================

@ticket_bp.route('/tickets', methods=['GET'])
@require_role(['administrador', 'supervisor', 'analista'])
def listar_tickets():
    """Listar todos los tickets"""
    try:
        tickets = TicketService.get_all_tickets()
        return jsonify(tickets), 200
    except Exception as e:
        return handle_general_error(e, "listar tickets")


@ticket_bp.route('/tickets', methods=['POST'])
@require_role(['cliente', 'administrador'])
def create_ticket():
    """Crear nuevo ticket"""
    body = _parse_request_body()
    user = get_user_from_token()

    if user['role'] == 'cliente':
        required = ["titulo", "descripcion", "prioridad"]
        missing = [k for k in required if not body.get(k)]
        if missing:
            return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400

        ticket = TicketService.create_ticket_for_cliente(
            user['id'], body['titulo'], body['descripcion'],
            body['prioridad'], body.get('url_imagen')
        )

        _emit_new_ticket_events(ticket, user)
        return jsonify(ticket.serialize()), 201

    # Administrador
    required = ["id_cliente", "estado", "titulo", "descripcion", "fecha_creacion", "prioridad"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400

    try:
        ticket = TicketService.create_ticket_admin(body)
        return jsonify(ticket.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500


@ticket_bp.route('/upload-image', methods=['POST'])
@require_auth
def upload_image():
    """Subir imagen a Cloudinary"""
    if 'image' not in request.files:
        return jsonify({"message": "No se encontró archivo de imagen"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"message": "No se seleccionó archivo"}), 400

    result, success = ImageService.upload_image(file)
    return jsonify(result), 200


@ticket_bp.route('/tickets/<int:id>', methods=['GET'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def get_ticket(id):
    """Obtener ticket por ID"""
    ticket = TicketService.get_ticket_by_id(id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404
    return jsonify(ticket.serialize()), 200


@ticket_bp.route('/tickets/<int:id>', methods=['PUT'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def update_ticket(id):
    """Actualizar ticket"""
    body = _parse_request_body()
    ticket = TicketService.get_ticket_by_id(id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404

    try:
        ticket = TicketService.update_ticket(ticket, body)
        user = get_user_from_token()

        socketio = get_socketio()
        if socketio:
            data = {
                'ticket': ticket.serialize(),
                'tipo': 'actualizado',
                'usuario': user['role'],
                'timestamp': datetime.now().isoformat()
            }
            emit_ws_event(socketio, 'ticket_actualizado', data, [f'room_ticket_{ticket.id}'])

        emit_critical_ticket_action(ticket.id, 'ticket_actualizado', user)
        return jsonify(ticket.serialize()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500


@ticket_bp.route('/tickets/<int:id>', methods=['DELETE'])
@require_role(['administrador'])
def delete_ticket(id):
    """Eliminar ticket"""
    try:
        ticket_info, analista_id = TicketService.delete_ticket(id)
        if not ticket_info:
            return jsonify({"message": analista_id}), 404  # analista_id contiene el mensaje de error

        socketio = get_socketio()
        if socketio:
            user = get_user_from_token()
            data = {
                'ticket_id': id,
                'ticket_info': ticket_info,
                'tipo': 'eliminado',
                'usuario': user['role'],
                'timestamp': datetime.now().isoformat()
            }
            rooms = ['clientes', 'analistas', 'supervisores', 'administradores', f'room_ticket_{id}']
            if analista_id:
                rooms.append(f'analista_{analista_id}')
            emit_ws_event(socketio, 'ticket_eliminado', data, rooms)

        return jsonify({"message": "Ticket eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500


# ==================== EVALUACIÓN ====================

@ticket_bp.route('/tickets/<int:id>/evaluar', methods=['POST'])
@require_role(['cliente'])
def evaluar_ticket(id):
    """Evaluar un ticket cerrado"""
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()

    calificacion = body.get('calificacion')
    comentario = body.get('comentario', '')

    if not calificacion or calificacion < 1 or calificacion > 5:
        return jsonify({"message": "Calificación debe estar entre 1 y 5"}), 400

    ticket, error = TicketService.evaluar_ticket(id, user['id'], calificacion, comentario)

    if error:
        return jsonify({"message": error}), 400 if "permisos" not in error else 403

    socketio = get_socketio()
    if socketio:
        data = {
            'ticket': ticket.serialize(),
            'tipo': 'evaluado',
            'calificacion': calificacion,
            'comentario': comentario,
            'timestamp': datetime.now().isoformat()
        }
        emit_ws_event(socketio, 'ticket_actualizado', data, [f'room_ticket_{ticket.id}'])

    return jsonify(ticket.serialize()), 200


# ==================== ASIGNACIÓN ====================

@ticket_bp.route('/tickets/<int:id>/asignacion-status', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_ticket_asignacion_status(id):
    """Obtener estado de asignación de un ticket"""
    result, error = TicketService.get_asignacion_status(id)
    if error:
        return jsonify({"message": error}), 404
    return jsonify(result), 200


@ticket_bp.route('/tickets/<int:id>/asignar', methods=['POST'])
@require_role(['supervisor', 'administrador'])
def asignar_ticket(id):
    """Asignar o reasignar ticket a un analista"""
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()

    id_analista = body.get('id_analista')
    comentario = body.get('comentario')
    es_reasignacion = body.get('es_reasignacion', False)

    if not id_analista:
        return jsonify({"message": "ID del analista requerido"}), 400

    ticket, asignacion, error = TicketService.asignar_ticket(
        id, user['id'], id_analista, comentario, es_reasignacion
    )

    if error:
        return jsonify({"message": error}), 400 if "no encontrado" not in error else 404

    # Emitir eventos WebSocket
    socketio = get_socketio()
    if socketio:
        from api.models import Analista
        analista = db.session.get(Analista, id_analista)
        data = {
            'id': ticket.id,
            'ticket_id': ticket.id,
            'estado': ticket.estado,
            'titulo': ticket.titulo,
            'prioridad': ticket.prioridad,
            'descripcion': ticket.descripcion,
            'fecha_creacion': ticket.fecha_creacion.isoformat() if ticket.fecha_creacion else None,
            'id_cliente': ticket.id_cliente,
            'id_analista': id_analista,
            'analista_id': id_analista,
            'analista_nombre': f"{analista.nombre} {analista.apellido}" if analista else "",
            'tipo': 'asignado',
            'accion': "reasignado" if es_reasignacion else "asignado",
            'timestamp': datetime.now().isoformat()
        }

        rooms_asignado = [f'analista_{id_analista}', 'role_analista', f'room_ticket_{ticket.id}',
                         'supervisores', 'administradores']
        emit_ws_event(socketio, 'ticket_asignado_a_mi', data, [f'analista_{id_analista}', 'role_analista'])
        emit_ws_event(socketio, 'ticket_asignado', data, rooms_asignado)
        emit_ws_event(socketio, 'ticket_actualizado', data, [f'room_ticket_{ticket.id}', 'role_analista'])
        emit_ws_event(socketio, 'global_ticket_update', data, [''])

    accion = "reasignado" if es_reasignacion else "asignado"
    return jsonify({
        "message": f"Ticket {accion} exitosamente",
        "ticket": ticket.serialize(),
        "asignacion": asignacion.serialize()
    }), 200


# ==================== HELPERS ====================

def _parse_request_body():
    """Parsear body de request (JSON o FormData)"""
    if request.is_json:
        return request.get_json(silent=True) or {}

    body = request.form.to_dict(flat=True)
    img_urls = request.form.getlist('img_urls')
    if img_urls:
        try:
            body['img_urls'] = json.loads(img_urls[0]) if len(img_urls) == 1 and img_urls[0].startswith('[') else img_urls
        except Exception:
            body['img_urls'] = img_urls
    return body


def _emit_new_ticket_events(ticket, user):
    """Emitir eventos WebSocket para nuevo ticket"""
    socketio = get_socketio()
    ticket_data = {
        'ticket_id': ticket.id,
        'ticket_estado': ticket.estado,
        'ticket_titulo': ticket.titulo,
        'ticket_prioridad': ticket.prioridad,
        'cliente_id': ticket.id_cliente,
        'tipo': 'creado',
        'timestamp': datetime.now().isoformat()
    }

    if socketio:
        rooms = [f'room_ticket_{ticket.id}', 'supervisores', 'administradores']
        emit_ws_event(socketio, 'nuevo_ticket', ticket_data, rooms)
        emit_ws_event(socketio, 'nuevo_ticket_disponible', ticket_data, ['supervisores', 'administradores'])

    emit_critical_ticket_action(ticket.id, 'ticket_creado', user)
    emit_websocket_to_ticket('nuevo_ticket', ticket_data, ticket.id, include_self=False)
    emit_websocket_to_role('nuevo_ticket_disponible', ticket_data, 'supervisor', include_self=False)
    emit_websocket_to_role('nuevo_ticket_disponible', ticket_data, 'administrador', include_self=False)
