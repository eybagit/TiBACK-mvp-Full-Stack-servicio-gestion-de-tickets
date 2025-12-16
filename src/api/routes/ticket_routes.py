"""
Rutas CRUD y acciones para la entidad Ticket
Incluye: listar, crear, actualizar, eliminar, cambiar estado, evaluar, asignar
"""
import os
import json
import time
import cloudinary
import cloudinary.uploader
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from api.models import db, Ticket, Analista, Asignacion, Comentarios, Gestion
from api.jwt_utils import require_role, require_auth, get_user_from_token
from api.routes.utils_routes import (
    get_socketio, handle_general_error, 
    emit_websocket_to_ticket, emit_websocket_to_role, emit_critical_ticket_action
)

ticket_bp = Blueprint('tickets', __name__)


# ==================== CRUD BÁSICO ====================

@ticket_bp.route('/tickets', methods=['GET'])
@require_role(['administrador', 'supervisor', 'analista'])
def listar_tickets():
    try:
        print("Iniciando consulta de tickets...")
        tickets = Ticket.query.all()
        print(f"Tickets encontrados: {len(tickets)}")
        
        serialized_tickets = []
        for i, ticket in enumerate(tickets):
            try:
                serialized_ticket = ticket.serialize()
                serialized_tickets.append(serialized_ticket)
            except Exception as serialize_error:
                print(f"Error serializando ticket {ticket.id}: {str(serialize_error)}")
                serialized_tickets.append({
                    "id": ticket.id,
                    "id_cliente": ticket.id_cliente,
                    "estado": ticket.estado,
                    "titulo": ticket.titulo,
                    "descripcion": ticket.descripcion,
                    "fecha_creacion": ticket.fecha_creacion.isoformat() if ticket.fecha_creacion else None,
                    "fecha_cierre": ticket.fecha_cierre.isoformat() if ticket.fecha_cierre else None,
                    "prioridad": ticket.prioridad,
                    "calificacion": ticket.calificacion,
                    "comentario": ticket.comentario,
                    "fecha_evaluacion": ticket.fecha_evaluacion.isoformat() if ticket.fecha_evaluacion else None,
                    "url_imagen": ticket.url_imagen,
                    "cliente": None,
                    "asignacion_actual": None
                })
        
        print(f"Tickets serializados exitosamente: {len(serialized_tickets)}")
        return jsonify(serialized_tickets), 200
    except Exception as e:
        print(f"Error en listar_tickets: {str(e)}")
        return handle_general_error(e, "listar tickets")


@ticket_bp.route('/tickets', methods=['POST'])
@require_role(['cliente', 'administrador'])
def create_ticket():
    if request.is_json:
        body = request.get_json(silent=True) or {}
    else:
        body = request.form.to_dict(flat=True)
        img_urls = request.form.getlist('img_urls')
        if img_urls:
            try:
                body['img_urls'] = json.loads(img_urls[0]) if len(
                    img_urls) == 1 and img_urls[0].startswith('[') else img_urls
            except Exception:
                body['img_urls'] = img_urls
    user = get_user_from_token()

    if user['role'] == 'cliente':
        required = ["titulo", "descripcion", "prioridad"]
        missing = [k for k in required if not body.get(k)]
        if missing:
            return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400

        ticket = Ticket(
            id_cliente=user['id'],
            estado="en espera",
            titulo=body['titulo'],
            descripcion=body['descripcion'],
            fecha_creacion=datetime.now(),
            prioridad=body['prioridad'],
            url_imagen=body.get('url_imagen')
        )
        db.session.add(ticket)
        db.session.commit()

        # Emitir evento WebSocket para notificar nuevo ticket
        socketio = get_socketio()
        if socketio:
            try:
                ticket_data = {
                    'ticket_id': ticket.id,
                    'ticket_estado': ticket.estado,
                    'ticket_titulo': ticket.titulo,
                    'ticket_prioridad': ticket.prioridad,
                    'cliente_id': ticket.id_cliente,
                    'tipo': 'creado',
                    'timestamp': datetime.now().isoformat()
                }

                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('nuevo_ticket', ticket_data, room=ticket_room)
                socketio.emit('nuevo_ticket_disponible', ticket_data, room='supervisores')
                socketio.emit('nuevo_ticket_disponible', ticket_data, room='administradores')
                socketio.emit('nuevo_ticket', ticket_data, room='administradores')
                
            except Exception as e:
                print(f"Error enviando WebSocket de nuevo ticket: {e}")

        ticket_data = {
            'ticket_id': ticket.id,
            'ticket_estado': ticket.estado,
            'ticket_titulo': ticket.titulo,
            'ticket_prioridad': ticket.prioridad,
            'cliente_id': ticket.id_cliente,
            'tipo': 'creado'
        }
        
        user_data = get_user_from_token()
        emit_critical_ticket_action(ticket.id, 'ticket_creado', user_data)
        emit_websocket_to_ticket('nuevo_ticket', ticket_data, ticket.id, include_self=False)
        emit_websocket_to_role('nuevo_ticket_disponible', ticket_data, 'supervisor', include_self=False)
        emit_websocket_to_role('nuevo_ticket_disponible', ticket_data, 'administrador', include_self=False)
        emit_websocket_to_role('nuevo_ticket', ticket_data, 'administrador', include_self=False)
        
        return jsonify(ticket.serialize()), 201

    required = ["id_cliente", "estado", "titulo", "descripcion", "fecha_creacion", "prioridad"]
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"message": f"Faltan campos: {', '.join(missing)}"}), 400
    try:
        ticket = Ticket(
            id_cliente=body["id_cliente"],
            estado=body["estado"],
            titulo=body["titulo"],
            descripcion=body["descripcion"],
            fecha_creacion=datetime.fromisoformat(body["fecha_creacion"]),
            prioridad=body["prioridad"],
            url_imagen=body.get("url_imagen")
        )
        db.session.add(ticket)
        db.session.commit()
        return jsonify(ticket.serialize()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@ticket_bp.route('/upload-image', methods=['POST'])
@require_auth
def upload_image():
    """Subir imagen a Cloudinary y devolver la URL"""
    try:
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        cloudinary_cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
        cloudinary_api_key = os.getenv('CLOUDINARY_API_KEY')
        cloudinary_api_secret = os.getenv('CLOUDINARY_API_SECRET')
        
        cloudinary_configured = (
            cloudinary_url or 
            (cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret)
        )
        
        if not cloudinary_configured:
            if cloudinary_url:
                cloudinary.config(cloudinary_url=cloudinary_url)
                cloudinary_configured = True
            elif cloudinary_cloud_name and cloudinary_api_key and cloudinary_api_secret:
                cloudinary.config(
                    cloud_name=cloudinary_cloud_name,
                    api_key=cloudinary_api_key,
                    api_secret=cloudinary_api_secret
                )
                cloudinary_configured = True
        
        if not cloudinary_configured:
            return jsonify({
                "url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==",
                "public_id": "placeholder"
            }), 200
        
        if 'image' not in request.files:
            return jsonify({"message": "No se encontró archivo de imagen"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"message": "No se seleccionó archivo"}), 400
        
        upload_result = cloudinary.uploader.upload(
            file,
            folder="tickets",
            resource_type="image"
        )
        
        return jsonify({
            "url": upload_result['secure_url'],
            "public_id": upload_result['public_id']
        }), 200
        
    except Exception as e:
        return jsonify({
            "url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIHN1YmllbmRvIGltYWdlbjwvdGV4dD48L3N2Zz4=",
            "public_id": "error_placeholder"
        }), 200


@ticket_bp.route('/tickets/<int:id>', methods=['GET'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def get_ticket(id):
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404
    return jsonify(ticket.serialize()), 200


@ticket_bp.route('/tickets/<int:id>', methods=['PUT'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def update_ticket(id):
    if request.is_json:
        body = request.get_json(silent=True) or {}
    else:
        body = request.form.to_dict(flat=True)
        img_urls = request.form.getlist('img_urls')
        if img_urls:
            try:
                body['img_urls'] = json.loads(img_urls[0]) if len(
                    img_urls) == 1 and img_urls[0].startswith('[') else img_urls
            except Exception:
                body['img_urls'] = img_urls
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404
    try:
        for field in ["id_cliente", "estado", "titulo", "descripcion", "fecha_creacion",
                      "fecha_cierre", "prioridad", "calificacion", "comentario", "fecha_evaluacion", "url_imagen"]:
            if field in body:
                value = body[field]
                if field in ["fecha_creacion", "fecha_cierre", "fecha_evaluacion"] and value:
                    value = datetime.fromisoformat(value)
                setattr(ticket, field, value)
        db.session.commit()

        socketio = get_socketio()
        if socketio:
            try:
                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('ticket_actualizado', {
                    'ticket': ticket.serialize(),
                    'tipo': 'actualizado',
                    'usuario': get_user_from_token()['role'],
                    'timestamp': datetime.now().isoformat()
                }, room=ticket_room)
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

        user = get_user_from_token()
        emit_critical_ticket_action(ticket.id, 'ticket_actualizado', user)
        emit_websocket_to_ticket('ticket_actualizado', {
            'ticket': ticket.serialize(),
            'tipo': 'actualizado',
            'usuario': user['role'],
            'usuario_id': user['id']
        }, ticket.id, include_self=False)
        
        return jsonify(ticket.serialize()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Error de integridad en la base de datos"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error inesperado: {str(e)}"}), 500


@ticket_bp.route('/tickets/<int:id>', methods=['DELETE'])
@require_role(['administrador'])
def delete_ticket(id):
    ticket = db.session.get(Ticket, id)
    if not ticket:
        return jsonify({"message": "Ticket no encontrado"}), 404
    try:
        ticket_info = {
            'id': ticket.id,
            'id_cliente': ticket.id_cliente,
            'titulo': ticket.titulo,
            'estado': ticket.estado
        }

        analista_asignado_id = None
        try:
            if hasattr(ticket, 'asignaciones') and ticket.asignaciones:
                asignacion_mas_reciente = max(ticket.asignaciones, key=lambda x: x.fecha_asignacion)
                analista_asignado_id = asignacion_mas_reciente.id_analista
        except Exception as e:
            print(f"Error obteniendo asignación del ticket: {e}")

        asignaciones = Asignacion.query.filter_by(id_ticket=id).all()
        for asignacion in asignaciones:
            db.session.delete(asignacion)

        comentarios = Comentarios.query.filter_by(id_ticket=id).all()
        for comentario in comentarios:
            db.session.delete(comentario)

        gestiones = Gestion.query.filter_by(id_ticket=id).all()
        for gestion in gestiones:
            db.session.delete(gestion)

        db.session.delete(ticket)
        db.session.commit()

        socketio = get_socketio()
        if socketio:
            try:
                user = get_user_from_token()
                eliminacion_data = {
                    'ticket_id': id,
                    'ticket_info': ticket_info,
                    'tipo': 'eliminado',
                    'usuario': user['role'],
                    'timestamp': datetime.now().isoformat()
                }

                socketio.emit('ticket_eliminado', eliminacion_data, room='clientes')
                socketio.emit('ticket_eliminado', eliminacion_data, room='analistas')
                socketio.emit('ticket_eliminado', eliminacion_data, room='supervisores')
                socketio.emit('ticket_eliminado', eliminacion_data, room='administradores')

                if analista_asignado_id:
                    socketio.emit('ticket_eliminado', eliminacion_data, room=f'analista_{analista_asignado_id}')

                ticket_room = f'room_ticket_{id}'
                socketio.emit('ticket_eliminado', eliminacion_data, room=ticket_room)
                    
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

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

    try:
        ticket = db.session.get(Ticket, id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        if ticket.id_cliente != user['id']:
            return jsonify({"message": "No tienes permisos para evaluar este ticket"}), 403

        estado_ticket_normalizado = ticket.estado.lower().replace('_', ' ')
        if estado_ticket_normalizado != 'cerrado':
            return jsonify({"message": "Solo se pueden evaluar tickets cerrados"}), 400

        ticket.calificacion = calificacion
        ticket.comentario = comentario
        ticket.fecha_evaluacion = datetime.now()

        db.session.commit()

        socketio = get_socketio()
        if socketio:
            try:
                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('ticket_actualizado', {
                    'ticket': ticket.serialize(),
                    'tipo': 'evaluado',
                    'calificacion': calificacion,
                    'comentario': comentario,
                    'timestamp': datetime.now().isoformat()
                }, room=ticket_room)
            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

        return jsonify(ticket.serialize()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al evaluar ticket: {str(e)}"}), 500


# ==================== ASIGNACIÓN ====================

@ticket_bp.route('/tickets/<int:id>/asignacion-status', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_ticket_asignacion_status(id):
    """Obtener el estado de asignación de un ticket para el supervisor"""
    try:
        ticket = db.session.get(Ticket, id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        asignaciones = Asignacion.query.filter_by(id_ticket=id).all()

        if not asignaciones:
            return jsonify({
                "tiene_asignacion": False,
                "accion": "asignar",
                "ticket": ticket.serialize()
            }), 200
        else:
            asignacion_mas_reciente = max(asignaciones, key=lambda x: x.fecha_asignacion)
            return jsonify({
                "tiene_asignacion": True,
                "accion": "reasignar",
                "asignacion_actual": asignacion_mas_reciente.serialize(),
                "ticket": ticket.serialize()
            }), 200

    except Exception as e:
        return jsonify({"message": f"Error al obtener estado de asignación: {str(e)}"}), 500


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

    try:
        ticket = db.session.get(Ticket, id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        analista = db.session.get(Analista, id_analista)
        if not analista:
            return jsonify({"message": "Analista no encontrado"}), 404

        estados_validos = ['en espera', 'reabierto']
        estado_ticket_normalizado = ticket.estado.lower().replace('_', ' ')
        if estado_ticket_normalizado not in estados_validos:
            return jsonify({
                "message": f"El ticket no puede ser asignado en estado '{ticket.estado}'. Estados válidos: {', '.join(estados_validos)}"
            }), 400

        asignaciones_anteriores = Asignacion.query.filter_by(id_ticket=id).all()
        for asignacion_anterior in asignaciones_anteriores:
            db.session.delete(asignacion_anterior)

        asignacion = Asignacion(
            id_ticket=id,
            id_supervisor=user['id'],
            id_analista=id_analista,
            fecha_asignacion=datetime.now()
        )

        ticket.estado = 'en espera'

        db.session.add(asignacion)

        accion_texto = f"Ticket {'reasignado' if es_reasignacion else 'asignado'} a {analista.nombre} {analista.apellido}"
        comentario_asignacion = Comentarios(
            id_ticket=id,
            id_supervisor=user['id'],
            texto=accion_texto,
            fecha_comentario=datetime.now()
        )
        db.session.add(comentario_asignacion)

        if comentario:
            nuevo_comentario = Comentarios(
                id_ticket=id,
                id_supervisor=user['id'],
                texto=comentario,
                fecha_comentario=datetime.now()
            )
            db.session.add(nuevo_comentario)

        db.session.commit()
        time.sleep(0.1)

        socketio = get_socketio()
        if socketio:
            try:
                asignacion_data = {
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
                    'analista_nombre': f"{analista.nombre} {analista.apellido}",
                    'tipo': 'asignado',
                    'accion': "reasignado" if es_reasignacion else "asignado",
                    'timestamp': datetime.now().isoformat()
                }
                
                analista_room = f'analista_{id_analista}'
                ticket_room = f'room_ticket_{ticket.id}'
                
                socketio.emit('ticket_asignado_a_mi', asignacion_data, room=analista_room)
                socketio.emit('ticket_asignado_a_mi', asignacion_data, room='role_analista')
                socketio.emit('ticket_asignado', asignacion_data, room='role_analista')
                socketio.emit('ticket_asignado', asignacion_data, room=ticket_room)
                socketio.emit('ticket_asignado', asignacion_data, room='supervisores')
                socketio.emit('ticket_asignado', asignacion_data, room='administradores')
                socketio.emit('ticket_actualizado', asignacion_data, room=ticket_room)
                socketio.emit('ticket_actualizado', asignacion_data, room='role_analista')
                socketio.emit('global_ticket_update', asignacion_data)

            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

        accion = "reasignado" if es_reasignacion else "asignado"
        return jsonify({
            "message": f"Ticket {accion} exitosamente",
            "ticket": ticket.serialize(),
            "asignacion": asignacion.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al asignar ticket: {str(e)}"}), 500
