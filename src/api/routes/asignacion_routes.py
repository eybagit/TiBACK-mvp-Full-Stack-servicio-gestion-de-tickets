"""
Rutas CRUD para la entidad Asignacion
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Asignacion, Ticket
from api.jwt_utils import require_role, get_user_from_token
from api.routes.utils_routes import get_socketio

asignacion_bp = Blueprint('asignaciones', __name__)


@asignacion_bp.route('/asignaciones', methods=['GET'])
@require_role(['supervisor', 'administrador', 'analista'])
def listar_asignaciones():
    asignaciones = Asignacion.query.all()
    return jsonify([a.serialize() for a in asignaciones]), 200


@asignacion_bp.route('/asignaciones', methods=['POST'])
@require_role(['supervisor', 'administrador', 'analista'])
def create_asignacion():
    body = request.get_json(silent=True) or {}
    required = ["id_ticket", "id_supervisor",
                "id_analista", "fecha_asignacion"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        asignacion = Asignacion(
            id_ticket=body["id_ticket"],
            id_supervisor=body["id_supervisor"],
            id_analista=body["id_analista"],
            fecha_asignacion=datetime.fromisoformat(body["fecha_asignacion"])
        )
        db.session.add(asignacion)
        db.session.commit()
        
        # Emitir evento WebSocket a global_tickets
        socketio = get_socketio()
        if socketio:
            ticket = db.session.get(Ticket, body["id_ticket"])
            if ticket:
                from api.utils.websocket_utils import emit_ticket_asignado
                emit_ticket_asignado(ticket, body["id_analista"], es_reasignacion=False)
        
        return jsonify(asignacion.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@asignacion_bp.route('/asignaciones/<int:id>', methods=['GET'])
@require_role(['supervisor', 'administrador', 'analista'])
def get_asignacion(id):
    asignacion = db.session.get(Asignacion, id)
    if not asignacion:
        return jsonify({"message": "Asignación no encontrada"}), 404
    return jsonify(asignacion.serialize()), 200


@asignacion_bp.route('/asignaciones/<int:id>', methods=['PUT'])
@require_role(['supervisor', 'administrador', 'analista'])
def update_asignacion(id):
    body = request.get_json(silent=True) or {}
    asignacion = db.session.get(Asignacion, id)
    if not asignacion:
        return jsonify({"message": "Asignación no encontrada"}), 404
    try:
        # Detectar si cambia el analista para emitir reasignación
        id_analista_anterior = asignacion.id_analista
        cambio_analista = False
        
        for field in ["id_ticket", "id_supervisor", "id_analista", "fecha_asignacion"]:
            if field in body:
                value = body[field]
                if field == "fecha_asignacion" and value:
                    value = datetime.fromisoformat(value)
                if field == "id_analista" and value != id_analista_anterior:
                    cambio_analista = True
                setattr(asignacion, field, value)
        
        db.session.commit()
        
        # Emitir WebSocket si cambió el analista
        if cambio_analista:
            socketio = get_socketio()
            if socketio and asignacion.id_ticket:
                ticket = db.session.get(Ticket, asignacion.id_ticket)
                if ticket:
                    from api.utils.websocket_utils import emit_ticket_asignado
                    emit_ticket_asignado(ticket, asignacion.id_analista, es_reasignacion=True)
        
        return jsonify(asignacion.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@asignacion_bp.route('/asignaciones/<int:id>', methods=['DELETE'])
@require_role(['supervisor', 'administrador', 'analista'])
def delete_asignacion(id):
    asignacion = db.session.get(Asignacion, id)
    if not asignacion:
        return jsonify({"message": "Asignación no encontrada"}), 404
    try:
        # Guardar info antes de eliminar para WebSocket
        asignacion_info = {
            'id': asignacion.id,
            'id_ticket': asignacion.id_ticket,
            'id_analista': asignacion.id_analista,
            'id_supervisor': asignacion.id_supervisor
        }
        
        db.session.delete(asignacion)
        db.session.commit()
        
        # Emitir evento WebSocket a global_tickets
        socketio = get_socketio()
        if socketio:
            user = get_user_from_token()
            data = {
                'asignacion_id': id,
                'asignacion_info': asignacion_info,
                'tipo': 'asignacion_eliminada',
                'usuario': user['role'] if user else 'desconocido',
                'timestamp': datetime.now().isoformat()
            }
            # SOLO global_tickets - TODOS escuchan TODO
            socketio.emit('asignacion_eliminada', data, room='global_tickets')
        
        return jsonify({"message": "Asignación eliminada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500
