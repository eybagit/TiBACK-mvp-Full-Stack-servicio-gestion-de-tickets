"""
Rutas CRUD para la entidad Cliente
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Cliente
from api.jwt_utils import require_role
from werkzeug.security import generate_password_hash

cliente_bp = Blueprint('clientes', __name__)


@cliente_bp.route('/clientes', methods=['GET'])
@require_role(['administrador', 'cliente'])
def listar_clientes():
    clientes = Cliente.query.all()
    return jsonify([c.serialize() for c in clientes]), 200


@cliente_bp.route('/clientes', methods=['POST'])
@require_role(['administrador', 'cliente'])
def create_cliente():
    body = request.get_json(silent=True) or {}
    required = ["direccion", "telefono", "nombre",
                "apellido", "email", "contraseña_hash"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        cliente_data = {k: body[k] for k in required}
        if 'latitude' in body:
            cliente_data['latitude'] = body['latitude']
        if 'longitude' in body:
            cliente_data['longitude'] = body['longitude']
        if 'url_imagen' in body:
            cliente_data['url_imagen'] = body['url_imagen']
        # Hash de contraseña antes de guardar
        cliente_data['contraseña_hash'] = generate_password_hash(cliente_data['contraseña_hash'])
            
        cliente = Cliente(**cliente_data)
        db.session.add(cliente)
        db.session.commit()
        return jsonify(cliente.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email ya existe"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@cliente_bp.route('/clientes/<int:id>', methods=['GET'])
@require_role(['administrador', 'cliente'])
def get_cliente(id):
    cliente = db.session.get(Cliente, id)
    if not cliente:
        return jsonify({"message": "Cliente no encontrado"}), 404
    return jsonify(cliente.serialize()), 200


@cliente_bp.route('/clientes/<int:id>', methods=['PUT'])
@require_role(['administrador', 'cliente'])
def update_cliente(id):
    body = request.get_json(silent=True) or {}
    cliente = db.session.get(Cliente, id)
    if not cliente:
        return jsonify({"message": "Cliente no encontrado"}), 404
    try:
        for field in ["direccion", "telefono", "nombre", "apellido", "email", "latitude", "longitude", "url_imagen"]:
            if field in body:
                setattr(cliente, field, body[field])
        if "contraseña_hash" in body:
            setattr(cliente, "contraseña_hash", generate_password_hash(body["contraseña_hash"]))
        db.session.commit()
        return jsonify(cliente.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email duplicado"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@cliente_bp.route('/clientes/<int:id>', methods=['DELETE'])
@require_role(['administrador', 'cliente'])
def delete_cliente(id):
    cliente = db.session.get(Cliente, id)
    if not cliente:
        return jsonify({"message": "Cliente no encontrado"}), 404
    try:
        db.session.delete(cliente)
        db.session.commit()
        return jsonify({"message": "Cliente eliminado"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al eliminar: {str(e)}"}), 500
