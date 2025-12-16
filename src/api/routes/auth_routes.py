"""
Rutas de autenticación: login, registro, refresh token y tickets por rol
"""
from datetime import datetime
from flask import Blueprint, request, jsonify

from api.models import db, Cliente, Analista, Supervisor, Administrador, Ticket, Asignacion, Comentarios
from api.jwt_utils import (
    generate_token, require_role, refresh_token, get_user_from_token
)
from api.routes.utils_routes import handle_general_error

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar nuevo cliente con JWT - Soporte para registro en dos pasos"""
    body = request.get_json(silent=True) or {}
    
    # Verificar si el email ya existe
    existing_cliente = Cliente.query.filter_by(email=body.get('email', '')).first()
    if existing_cliente:
        return jsonify({"message": "Email ya registrado"}), 400

    try:
        # Si es un cliente con datos básicos (registro en dos pasos)
        if body.get('role') == 'cliente' and body.get('nombre') == 'Pendiente':
            cliente_data = {
                'nombre': 'Pendiente',
                'apellido': 'Pendiente',
                'email': body['email'],
                'contraseña_hash': body['password'],
                'direccion': 'Pendiente',
                'telefono': '0000000000'
            }

            cliente = Cliente(**cliente_data)
            db.session.add(cliente)
            db.session.commit()
            
            return jsonify({
                "message": "Cliente básico creado. Completa tu información.",
                "success": True
            }), 201

        else:
            # Registro completo (otros roles o cliente con datos completos)
            required = ["nombre", "apellido", "email",
                        "password", "direccion", "telefono"]
            missing = [k for k in required if not body.get(k)]
            if missing:
                return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400

            cliente_data = {
                'nombre': body['nombre'],
                'apellido': body['apellido'],
                'email': body['email'],
                'contraseña_hash': body['password'],
                'direccion': body['direccion'],
                'telefono': body['telefono']
            }

            # Agregar coordenadas si están presentes
            if 'latitude' in body:
                cliente_data['latitude'] = body['latitude']
            if 'longitude' in body:
                cliente_data['longitude'] = body['longitude']

            cliente = Cliente(**cliente_data)
            db.session.add(cliente)
            db.session.commit()

            return jsonify({
                "message": "Cliente registrado exitosamente. Por favor inicia sesión con tus credenciales.",
                "success": True
            }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al registrar: {str(e)}"}), 500


@auth_bp.route('/complete-client-info', methods=['POST'])
@require_role(['cliente'])
def complete_client_info():
    """Completar información del cliente después del registro básico"""
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()

    required = ["nombre", "apellido", "direccion", "telefono"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400

    try:
        cliente = db.session.get(Cliente, user['id'])
        if not cliente:
            return jsonify({"message": "Cliente no encontrado"}), 404

        cliente.nombre = body['nombre']
        cliente.apellido = body['apellido']
        cliente.direccion = body['direccion']
        cliente.telefono = body['telefono']

        if 'latitude' in body:
            cliente.latitude = body['latitude']
        if 'longitude' in body:
            cliente.longitude = body['longitude']

        if 'password' in body and body['password']:
            cliente.contraseña_hash = body['password']

        db.session.commit()

        return jsonify({
            "message": "Información completada exitosamente",
            "cliente": cliente.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al completar información: {str(e)}"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Iniciar sesión con JWT"""
    body = request.get_json(silent=True) or {}
    email = body.get('email')
    password = body.get('password')
    role = body.get('role', 'cliente')

    if not email or not password:
        return jsonify({"message": "Email y contraseña requeridos"}), 400

    try:
        user = None
        if role == 'cliente':
            user = Cliente.query.filter_by(email=email).first()
        elif role == 'analista':
            user = Analista.query.filter_by(email=email).first()
        elif role == 'supervisor':
            user = Supervisor.query.filter_by(email=email).first()
        elif role == 'administrador':
            user = Administrador.query.filter_by(email=email).first()
        else:
            return jsonify({"message": "Rol inválido"}), 400

        if not user or user.contraseña_hash != password:
            return jsonify({"message": "Credenciales inválidas"}), 401

        token = generate_token(user.id, user.email, role)

        return jsonify({
            "message": "Login exitoso",
            "token": token
        }), 200

    except Exception as e:
        return jsonify({"message": f"Error en login: {str(e)}"}), 500


@auth_bp.route('/refresh', methods=['POST'])
def refresh_token_endpoint():
    """Refrescar token con JWT"""
    body = request.get_json(silent=True) or {}
    token = body.get('token')

    if not token:
        return jsonify({"message": "Token requerido"}), 400

    try:
        new_token = refresh_token(token)

        if not new_token:
            return jsonify({"message": "Token inválido o expirado"}), 401

        return jsonify({
            "token": new_token['token']
        }), 200

    except Exception as e:
        return jsonify({"message": f"Error al refrescar token: {str(e)}"}), 500


# ==================== RUTAS DE TICKETS POR ROL ====================

@auth_bp.route('/tickets/cliente', methods=['GET'])
@require_role(['cliente'])
def get_cliente_tickets():
    """Obtener tickets del cliente autenticado con JWT"""
    try:
        user = get_user_from_token()
        if not user or user['role'] != 'cliente':
            return jsonify({"message": "Acceso denegado"}), 403

        tickets = Ticket.query.filter(
            Ticket.id_cliente == user['id'],
            Ticket.estado != 'cerrado'
        ).all()

        return jsonify([t.serialize() for t in tickets]), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener tickets: {str(e)}"}), 500


@auth_bp.route('/tickets/analista/<int:id>', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_analista_tickets_by_id(id):
    """Obtener tickets de un analista específico por ID"""
    try:
        analista = db.session.get(Analista, id)
        if not analista:
            return jsonify({"message": "Analista no encontrado"}), 404
        
        asignaciones = Asignacion.query.filter_by(id_analista=id).all()
        ticket_ids = [a.id_ticket for a in asignaciones]
        
        if not ticket_ids:
            return jsonify([]), 200
        
        tickets = Ticket.query.filter(Ticket.id.in_(ticket_ids)).all()
        
        return jsonify([t.serialize() for t in tickets]), 200
        
    except Exception as e:
        return handle_general_error(e, "obtener tickets del analista")


@auth_bp.route('/tickets/analista', methods=['GET'])
@require_role(['analista', 'administrador'])
def get_analista_tickets():
    """Obtener tickets asignados al analista autenticado (excluyendo tickets escalados)"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({"message": "Token inválido o expirado"}), 401
        if user['role'] not in ['analista', 'administrador']:
            return jsonify({"message": "Acceso denegado"}), 403

        asignaciones = Asignacion.query.filter_by(id_analista=user['id']).all()
        ticket_ids = [a.id_ticket for a in asignaciones]

        tickets = Ticket.query.filter(
            Ticket.id.in_(ticket_ids),
            Ticket.estado != 'cerrado'
        ).all()

        tickets_filtrados = []
        asignaciones_analista = {a.id_ticket: a for a in Asignacion.query.filter_by(
            id_analista=user['id']).all()}

        comentarios_escalacion = {c.id_ticket: c.fecha_comentario for c in Comentarios.query.filter(
            Comentarios.id_analista == user['id'],
            Comentarios.texto.like("%escalado%")
        ).all()}

        for ticket in tickets:
            if ticket.id not in asignaciones_analista:
                continue

            asignacion = asignaciones_analista[ticket.id]

            if ticket.id in comentarios_escalacion:
                if comentarios_escalacion[ticket.id] > asignacion.fecha_asignacion:
                    continue

            estado_ticket_normalizado = ticket.estado.lower().replace('_', ' ')
            if estado_ticket_normalizado not in ['en espera', 'en proceso']:
                continue

            tickets_filtrados.append(ticket)

        return jsonify([t.serialize() for t in tickets_filtrados]), 200

    except Exception as e:
        return handle_general_error(e, "obtener tickets del analista")


@auth_bp.route('/tickets/supervisor', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_supervisor_tickets():
    """Obtener todos los tickets activos para el supervisor"""
    try:
        tickets = Ticket.query.filter(
            Ticket.estado != 'cerrado'
        ).all()
        return jsonify([t.serialize() for t in tickets]), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener tickets: {str(e)}"}), 500


@auth_bp.route('/tickets/supervisor/cerrados', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_supervisor_closed_tickets():
    """Obtener tickets cerrados para el supervisor"""
    try:
        tickets = Ticket.query.filter(
            Ticket.estado == 'cerrado'
        ).all()
        return jsonify([t.serialize() for t in tickets]), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener tickets cerrados: {str(e)}"}), 500
