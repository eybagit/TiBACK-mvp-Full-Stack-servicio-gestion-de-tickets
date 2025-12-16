"""
Rutas CRUD para la entidad Gestion
"""
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Gestion
from api.jwt_utils import require_role

gestion_bp = Blueprint('gestiones', __name__)


@gestion_bp.route('/gestiones', methods=['GET'])
@require_role(['analista', 'supervisor', 'administrador'])
def obtener_gestiones():
    gestiones = Gestion.query.all()
    return jsonify([g.serialize() for g in gestiones]), 200


@gestion_bp.route('/gestiones', methods=['POST'])
@require_role(['analista', 'supervisor', 'administrador'])
def crear_gestion():
    body = request.get_json(silent=True) or {}
    required = ["id_ticket", "tipo_gestion", "descripcion_gestion"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        gestion = Gestion(
            id_ticket=body["id_ticket"],
            tipo_gestion=body["tipo_gestion"],
            descripcion_gestion=body["descripcion_gestion"]
        )
        db.session.add(gestion)
        db.session.commit()
        return jsonify(gestion.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@gestion_bp.route('/gestiones/<int:id>', methods=['GET'])
@require_role(['analista', 'supervisor', 'administrador'])
def ver_gestion(id):
    gestion = db.session.get(Gestion, id)
    if not gestion:
        return jsonify({"message": "Gestión no encontrada"}), 404
    return jsonify(gestion.serialize()), 200


@gestion_bp.route('/gestiones/<int:id>', methods=['PUT'])
@require_role(['analista', 'supervisor', 'administrador'])
def actualizar_gestion(id):
    body = request.get_json(silent=True) or {}
    gestion = db.session.get(Gestion, id)
    if not gestion:
        return jsonify({"message": "Gestión no encontrada"}), 404
    try:
        for field in ["id_ticket", "tipo_gestion", "descripcion_gestion"]:
            if field in body:
                setattr(gestion, field, body[field])
        db.session.commit()
        return jsonify(gestion.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@gestion_bp.route('/gestiones/<int:id>', methods=['DELETE'])
@require_role(['analista', 'supervisor', 'administrador'])
def eliminar_gestion(id):
    gestion = db.session.get(Gestion, id)
    if not gestion:
        return jsonify({"message": "Gestión no encontrada"}), 404
    try:
        db.session.delete(gestion)
        db.session.commit()
        return jsonify({"message": "Gestión eliminada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500
