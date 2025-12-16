"""
Rutas CRUD para la entidad Asignacion
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Asignacion
from api.jwt_utils import require_role

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
        for field in ["id_ticket", "id_supervisor", "id_analista", "fecha_asignacion"]:
            if field in body:
                value = body[field]
                if field == "fecha_asignacion" and value:
                    value = datetime.fromisoformat(value)
                setattr(asignacion, field, value)
        db.session.commit()
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
        db.session.delete(asignacion)
        db.session.commit()
        return jsonify({"message": "Asignación eliminada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500
