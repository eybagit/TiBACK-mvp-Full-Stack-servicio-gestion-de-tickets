"""
Rutas de Chat: chat supervisor-analista y chat analista-cliente
"""
from datetime import datetime
from flask import Blueprint, request, jsonify

from api.models import db, Ticket, Comentarios
from api.jwt_utils import require_auth, get_user_from_token
from api.routes.utils_routes import get_socketio

chat_bp = Blueprint('chat', __name__)


# ==================== CHAT SUPERVISOR-ANALISTA ====================

@chat_bp.route('/tickets/<int:ticket_id>/chat-supervisor-analista', methods=['GET'])
@require_auth
def obtener_chat_supervisor_analista(ticket_id):
    """Obtener mensajes del chat entre supervisor y analista para un ticket"""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        mensajes = Comentarios.query.filter_by(
            id_ticket=ticket_id
        ).filter(
            Comentarios.texto.like('CHAT_SUPERVISOR_ANALISTA:%')
        ).order_by(Comentarios.fecha_comentario.asc()).all()

        chat_mensajes = []
        for mensaje in mensajes:
            mensaje_texto = mensaje.texto.replace('CHAT_SUPERVISOR_ANALISTA:', '')

            autor = None
            if mensaje.supervisor:
                autor = {
                    'id': mensaje.supervisor.id,
                    'nombre': mensaje.supervisor.nombre,
                    'apellido': mensaje.supervisor.apellido,
                    'rol': 'supervisor'
                }
            elif mensaje.analista:
                autor = {
                    'id': mensaje.analista.id,
                    'nombre': mensaje.analista.nombre,
                    'apellido': mensaje.analista.apellido,
                    'rol': 'analista'
                }

            chat_mensajes.append({
                'id': mensaje.id,
                'mensaje': mensaje_texto,
                'fecha_mensaje': mensaje.fecha_comentario.isoformat(),
                'autor': autor
            })

        return jsonify(chat_mensajes), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener mensajes del chat: {str(e)}"}), 500


@chat_bp.route('/chat-supervisor-analista', methods=['POST'])
@require_auth
def enviar_mensaje_supervisor_analista():
    """Enviar mensaje en el chat entre supervisor y analista"""
    try:
        data = request.get_json()
        ticket_id = data.get('id_ticket')
        mensaje = data.get('mensaje')

        if not ticket_id or not mensaje:
            return jsonify({"message": "Ticket ID y mensaje son requeridos"}), 400

        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        user_info = get_user_from_token()
        if not user_info:
            return jsonify({"message": "Token inválido"}), 401

        comentario = Comentarios(
            id_ticket=ticket_id,
            texto=f'CHAT_SUPERVISOR_ANALISTA:{mensaje}',
            fecha_comentario=datetime.now()
        )

        if user_info['role'] == 'supervisor':
            comentario.id_supervisor = user_info['id']
        elif user_info['role'] == 'analista':
            comentario.id_analista = user_info['id']
        else:
            return jsonify({"message": "Solo supervisores y analistas pueden usar este chat"}), 403

        db.session.add(comentario)
        db.session.commit()

        socketio = get_socketio()
        if socketio:
            chat_room = f'chat_supervisor_analista_{ticket_id}'
            
            socketio.emit('nuevo_mensaje_chat_supervisor_analista', {
                'ticket_id': ticket_id,
                'mensaje': mensaje,
                'autor': {
                    'id': user_info['id'],
                    'nombre': user_info.get('nombre', 'Usuario'),
                    'rol': user_info['role']
                },
                'fecha': datetime.now().isoformat()
            }, room=chat_room)

            general_room = f'room_ticket_{ticket_id}'
            socketio.emit('nuevo_mensaje_chat', {
                'ticket_id': ticket_id,
                'tipo': 'chat_supervisor_analista',
                'mensaje': mensaje,
                'autor': {
                    'id': user_info['id'],
                    'nombre': user_info.get('nombre', 'Usuario'),
                    'rol': user_info['role']
                },
                'fecha': datetime.now().isoformat()
            }, room=general_room)
        
        return jsonify({
            "message": "Mensaje enviado exitosamente",
            "mensaje_id": comentario.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al enviar mensaje: {str(e)}"}), 500


# ==================== CHAT ANALISTA-CLIENTE ====================

@chat_bp.route('/tickets/<int:ticket_id>/chat-analista-cliente', methods=['GET'])
@require_auth
def obtener_chat_analista_cliente(ticket_id):
    """Obtener mensajes del chat entre analista y cliente para un ticket"""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        mensajes = Comentarios.query.filter_by(
            id_ticket=ticket_id
        ).filter(
            Comentarios.texto.like('CHAT_ANALISTA_CLIENTE:%')
        ).order_by(Comentarios.fecha_comentario.asc()).all()

        chat_mensajes = []
        for mensaje in mensajes:
            mensaje_texto = mensaje.texto.replace('CHAT_ANALISTA_CLIENTE:', '')

            autor = None
            if mensaje.analista:
                autor = {
                    'id': mensaje.analista.id,
                    'nombre': mensaje.analista.nombre,
                    'apellido': mensaje.analista.apellido,
                    'rol': 'analista'
                }
            elif mensaje.cliente:
                autor = {
                    'id': mensaje.cliente.id,
                    'nombre': mensaje.cliente.nombre,
                    'apellido': mensaje.cliente.apellido,
                    'rol': 'cliente'
                }

            chat_mensajes.append({
                'id': mensaje.id,
                'mensaje': mensaje_texto,
                'fecha_mensaje': mensaje.fecha_comentario.isoformat(),
                'autor': autor
            })

        return jsonify(chat_mensajes), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener mensajes del chat: {str(e)}"}), 500


@chat_bp.route('/chat-analista-cliente', methods=['POST'])
@require_auth
def enviar_mensaje_analista_cliente():
    """Enviar mensaje en el chat entre analista y cliente"""
    try:
        data = request.get_json()
        ticket_id = data.get('id_ticket')
        mensaje = data.get('mensaje')

        if not ticket_id or not mensaje:
            return jsonify({"message": "Ticket ID y mensaje son requeridos"}), 400

        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        user_info = get_user_from_token()
        if not user_info:
            return jsonify({"message": "Token inválido"}), 401

        comentario = Comentarios(
            id_ticket=ticket_id,
            texto=f'CHAT_ANALISTA_CLIENTE:{mensaje}',
            fecha_comentario=datetime.now()
        )

        if user_info['role'] == 'analista':
            comentario.id_analista = user_info['id']
        elif user_info['role'] == 'cliente':
            comentario.id_cliente = user_info['id']
        else:
            return jsonify({"message": "Solo analistas y clientes pueden usar este chat"}), 403

        db.session.add(comentario)
        db.session.commit()

        socketio = get_socketio()
        if socketio:
            chat_room = f'chat_analista_cliente_{ticket_id}'
            
            socketio.emit('nuevo_mensaje_chat_analista_cliente', {
                'ticket_id': ticket_id,
                'mensaje': mensaje,
                'autor': {
                    'id': user_info['id'],
                    'nombre': user_info.get('nombre', 'Usuario'),
                    'rol': user_info['role']
                },
                'fecha': datetime.now().isoformat()
            }, room=chat_room)

            general_room = f'room_ticket_{ticket_id}'
            socketio.emit('nuevo_mensaje_chat', {
                'ticket_id': ticket_id,
                'tipo': 'chat_analista_cliente',
                'mensaje': mensaje,
                'autor': {
                    'id': user_info['id'],
                    'nombre': user_info.get('nombre', 'Usuario'),
                    'rol': user_info['role']
                },
                'fecha': datetime.now().isoformat()
            }, room=general_room)
        
        return jsonify({
            "message": "Mensaje enviado exitosamente",
            "mensaje_id": comentario.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al enviar mensaje: {str(e)}"}), 500
