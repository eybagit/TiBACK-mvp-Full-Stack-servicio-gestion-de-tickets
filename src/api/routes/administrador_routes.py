"""
Rutas CRUD para la entidad Administrador
"""
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Administrador
from api.jwt_utils import require_role

administrador_bp = Blueprint('administradores', __name__)


@administrador_bp.route('/administradores', methods=['GET'])
@require_role(['administrador'])
def listar_administradores():
    administradores = Administrador.query.all()
    return jsonify([a.serialize() for a in administradores]), 200


@administrador_bp.route('/administradores', methods=['POST'])
@require_role(['administrador'])
def create_administrador():
    body = request.get_json(silent=True) or {}
    required = ["permisos_especiales", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        administrador = Administrador(**{k: body[k] for k in required})
        db.session.add(administrador)
        db.session.commit()
        return jsonify(administrador.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email ya existe"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@administrador_bp.route('/administradores/<int:id>', methods=['GET'])
@require_role(['administrador'])
def get_administrador(id):
    administrador = db.session.get(Administrador, id)
    if not administrador:
        return jsonify({"message": "Administrador no encontrado"}), 404
    return jsonify(administrador.serialize()), 200


@administrador_bp.route('/administradores/<int:id>', methods=['PUT'])
@require_role(['administrador'])
def update_administrador(id):
    body = request.get_json(silent=True) or {}
    administrador = db.session.get(Administrador, id)
    if not administrador:
        return jsonify({"message": "Administrador no encontrado"}), 404
    try:
        for field in ["permisos_especiales", "email", "contraseña_hash"]:
            if field in body:
                setattr(administrador, field, body[field])
        db.session.commit()
        return jsonify(administrador.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email duplicado"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@administrador_bp.route('/administradores/<int:id>', methods=['DELETE'])
@require_role(['administrador'])
def delete_administrador(id):
    administrador = db.session.get(Administrador, id)
    if not administrador:
        return jsonify({"message": "Administrador no encontrado"}), 404
    try:
        db.session.delete(administrador)
        db.session.commit()
        return jsonify({"message": "Administrador eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500
