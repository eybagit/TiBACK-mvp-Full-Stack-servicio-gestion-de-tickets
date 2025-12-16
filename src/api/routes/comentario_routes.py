"""
Rutas CRUD para la entidad Comentarios
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Ticket, Comentarios, Asignacion
from api.jwt_utils import require_role, get_user_from_token
from api.routes.utils_routes import (
    get_socketio, emit_critical_ticket_action, emit_websocket_to_ticket
)

comentario_bp = Blueprint('comentarios', __name__)


@comentario_bp.route('/comentarios', methods=['GET'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def listar_comentarios():
    comentarios = Comentarios.query.all()
    return jsonify([c.serialize() for c in comentarios]), 200


@comentario_bp.route('/tickets/<int:id>/comentarios', methods=['GET'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def get_ticket_comentarios(id):
    """Obtener comentarios de un ticket específico"""
    try:
        user = get_user_from_token()
        ticket = db.session.get(Ticket, id)

        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        # Verificar permisos
        if user['role'] == 'cliente' and ticket.id_cliente != user['id']:
            return jsonify({"message": "No tienes permisos para ver este ticket"}), 403

        # Para analistas, verificar que el ticket esté asignado a ellos
        if user['role'] == 'analista':
            asignacion = Asignacion.query.filter_by(
                id_ticket=id, id_analista=user['id']).first()
            if not asignacion:
                return jsonify({"message": "No tienes permisos para ver este ticket"}), 403

        comentarios = Comentarios.query.filter_by(
            id_ticket=id).order_by(Comentarios.fecha_comentario).all()
        return jsonify([c.serialize() for c in comentarios]), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener comentarios: {str(e)}"}), 500


@comentario_bp.route('/comentarios', methods=['POST'])
@require_role(['analista', 'supervisor', 'cliente', 'administrador'])
def create_comentario():
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()

    required = ["id_ticket", "texto"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400

    try:
        # Determinar quién está comentando
        id_cliente = user['id'] if user['role'] == 'cliente' else body.get('id_cliente')
        id_analista = user['id'] if user['role'] == 'analista' else body.get('id_analista')
        id_supervisor = user['id'] if user['role'] == 'supervisor' else body.get('id_supervisor')
        id_gestion = body.get('id_gestion')

        comentario = Comentarios(
            id_ticket=body["id_ticket"],
            id_gestion=id_gestion,
            id_cliente=id_cliente,
            id_analista=id_analista,
            id_supervisor=id_supervisor,
            texto=body["texto"],
            fecha_comentario=datetime.now()
        )
        db.session.add(comentario)
        db.session.commit()

        # Emitir evento WebSocket para notificar nuevo comentario al room del ticket
        socketio = get_socketio()
        if socketio:
            try:
                ticket_room = f'room_ticket_{comentario.id_ticket}'
                socketio.emit('nuevo_comentario', {
                    'comentario': comentario.serialize(),
                    'tipo': 'comentario_agregado',
                    'timestamp': datetime.now().isoformat()
                }, room=ticket_room)
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

        # Emitir evento crítico para nuevo comentario
        emit_critical_ticket_action(comentario.id_ticket, 'comentario_agregado', user)
        
        # También emitir evento normal para compatibilidad
        emit_websocket_to_ticket('nuevo_comentario', {
            'comentario': comentario.serialize(),
            'tipo': 'comentario_agregado',
            'usuario': user['role'],
            'usuario_id': user['id']
        }, comentario.id_ticket, include_self=False)
        
        return jsonify(comentario.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@comentario_bp.route('/comentarios/<int:id>', methods=['GET'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def get_comentario(id):
    comentario = db.session.get(Comentarios, id)
    if not comentario:
        return jsonify({"message": "Comentario no encontrado"}), 404
    return jsonify(comentario.serialize()), 200


@comentario_bp.route('/comentarios/<int:id>', methods=['PUT'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def update_comentario(id):
    body = request.get_json(silent=True) or {}
    comentario = db.session.get(Comentarios, id)
    if not comentario:
        return jsonify({"message": "Comentario no encontrado"}), 404
    try:
        for field in ["id_gestion", "id_cliente", "id_analista", "id_supervisor", "texto", "fecha_comentario"]:
            if field in body:
                value = body[field]
                if field == "fecha_comentario" and value:
                    value = datetime.fromisoformat(value)
                setattr(comentario, field, value)
        db.session.commit()
        return jsonify(comentario.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@comentario_bp.route('/comentarios/<int:id>', methods=['DELETE'])
@require_role(['analista', 'supervisor', 'administrador', 'cliente'])
def delete_comentario(id):
    comentario = db.session.get(Comentarios, id)
    if not comentario:
        return jsonify({"message": "Comentario no encontrado"}), 404
    try:
        db.session.delete(comentario)
        db.session.commit()
        return jsonify({"message": "Comentario eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500
