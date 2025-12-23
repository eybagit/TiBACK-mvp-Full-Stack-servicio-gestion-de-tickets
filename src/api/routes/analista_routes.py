"""
Rutas CRUD para la entidad Analista
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Analista
from api.jwt_utils import require_role, get_user_from_token
from api.routes.utils_routes import get_socketio, handle_general_error

analista_bp = Blueprint('analistas', __name__)


@analista_bp.route('/analistas', methods=['GET'])
@require_role(['administrador', 'analista', 'supervisor'])
def listar_analistas():
    try:
        analistas = Analista.query.all()
        return jsonify([a.serialize() for a in analistas]), 200
    except Exception as e:
        return handle_general_error(e, "listar analistas")


@analista_bp.route('/analistas', methods=['POST'])
@require_role(['administrador', 'analista'])
def create_analista():
    body = request.get_json(silent=True) or {}
    required = ["especialidad", "nombre",
                "apellido", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        analista = Analista(**{k: body[k] for k in required})
        db.session.add(analista)
        db.session.commit()

        # Emitir evento WebSocket para notificar creación de analista
        socketio = get_socketio()
        if socketio:
            try:
                # SOLO global_tickets - TODOS escuchan TODO
                socketio.emit('analista_creado', {
                    'analista': analista.serialize(),
                    'tipo': 'analista_creado',
                    'timestamp': datetime.now().isoformat()
                }, room='global_tickets')
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

        return jsonify(analista.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email ya existe"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@analista_bp.route('/analistas/<int:id>', methods=['GET'])
@require_role(['administrador', 'analista', 'supervisor'])
def get_analista(id):
    try:
        analista = db.session.get(Analista, id)
        if not analista:
            return jsonify({"message": "Analista no encontrado"}), 404
        return jsonify(analista.serialize()), 200
    except Exception as e:
        return handle_general_error(e, "obtener analista")


@analista_bp.route('/analistas/<int:id>', methods=['PUT'])
@require_role(['administrador', 'analista'])
def update_analista(id):
    body = request.get_json(silent=True) or {}
    analista = db.session.get(Analista, id)
    if not analista:
        return jsonify({"message": "Analista no encontrado"}), 404
    try:
        for field in ["especialidad", "nombre", "apellido", "email", "contraseña_hash"]:
            if field in body:
                setattr(analista, field, body[field])
        db.session.commit()
        return jsonify(analista.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email duplicado"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@analista_bp.route('/analistas/<int:id>', methods=['DELETE'])
@require_role(['administrador', 'analista'])
def delete_analista(id):
    analista = db.session.get(Analista, id)
    if not analista:
        return jsonify({"message": "Analista no encontrado"}), 404
    try:
        analista_info = {
            'id': analista.id,
            'nombre': analista.nombre,
            'apellido': analista.apellido,
            'email': analista.email,
            'especialidad': analista.especialidad
        }

        db.session.delete(analista)
        db.session.commit()

        socketio = get_socketio()
        if socketio:
            try:
                user = get_user_from_token()
                eliminacion_data = {
                    'analista_id': id,
                    'analista_info': analista_info,
                    'tipo': 'analista_eliminado',
                    'usuario': user['role'],
                    'timestamp': datetime.now().isoformat()
                }

                # SOLO global_tickets - TODOS escuchan TODO
                socketio.emit('analista_eliminado', eliminacion_data, room='global_tickets')
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

        return jsonify({"message": "Analista eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500
