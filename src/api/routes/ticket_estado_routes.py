"""
Rutas de cambio de estado para tickets
Lógica compleja de transiciones de estado según rol del usuario
"""
import time
from datetime import datetime
from flask import Blueprint, request, jsonify

from api.models import db, Ticket, Asignacion, Comentarios
from api.jwt_utils import require_role, get_user_from_token
from api.routes.utils_routes import get_socketio

ticket_estado_bp = Blueprint('ticket_estado', __name__)


@ticket_estado_bp.route('/tickets/<int:id>/estado', methods=['PUT'])
@require_role(['analista', 'supervisor', 'cliente', 'administrador'])
def cambiar_estado_ticket(id):
    """Cambiar el estado de un ticket"""
    print(f"🚀 INICIANDO CAMBIO DE ESTADO - Ticket ID: {id}")
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()

    print(f"👤 Usuario autenticado: {user}")
    print(f"📝 Body recibido: {body}")
    
    nuevo_estado = body.get('estado')
    if not nuevo_estado:
        print(f"❌ ERROR: Estado requerido no encontrado en body: {body}")
        return jsonify({"message": "Estado requerido"}), 400

    try:
        ticket = db.session.get(Ticket, id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        print(f"🔍 Verificando permisos - Rol: {user['role']}, Cliente ticket: {ticket.id_cliente}, Usuario ID: {user['id']}")
        if user['role'] == 'cliente' and ticket.id_cliente != user['id']:
            print(f"❌ ERROR: Cliente sin permisos para modificar ticket")
            return jsonify({"message": "No tienes permisos para modificar este ticket"}), 403

        estado_actual = ticket.estado.lower().replace('_', ' ')
        nuevo_estado_lower = nuevo_estado.lower().replace('_', ' ')

        print(f"🔄 INTENTO DE CAMBIO DE ESTADO:")
        print(f"   Ticket ID: {id}")
        print(f"   Usuario: {user['role']} (ID: {user['id']})")
        print(f"   Estado actual (normalizado): '{estado_actual}'")
        print(f"   Estado solicitado (normalizado): '{nuevo_estado_lower}'")
        
        socketio = get_socketio()

        # ==================== LÓGICA PARA CLIENTE ====================
        if user['role'] == 'cliente':
            if nuevo_estado_lower == 'cerrado' and estado_actual == 'solucionado':
                ticket.estado = 'cerrado'
                ticket.fecha_cierre = datetime.now()
                
                calificacion = body.get('calificacion')
                comentario = body.get('comentario', '')
                if calificacion and 1 <= calificacion <= 5:
                    ticket.calificacion = calificacion
                    ticket.comentario = comentario
                    ticket.fecha_evaluacion = datetime.now()

                comentario_cierre = Comentarios(
                    id_ticket=id,
                    id_cliente=user['id'],
                    texto="Ticket cerrado por cliente",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_cierre)

                if socketio:
                    try:
                        cierre_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'cliente_id': ticket.id_cliente,
                            'calificacion': calificacion,
                            'tipo': 'cerrado',
                            'timestamp': datetime.now().isoformat()
                        }

                        socketio.emit('ticket_cerrado', cierre_data, room='supervisores')
                        socketio.emit('ticket_cerrado', cierre_data, room='administradores')
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_cerrado', cierre_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', cierre_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', cierre_data, room='supervisores')
                        socketio.emit('global_ticket_update', cierre_data)

                        print(f"📤 TICKET CERRADO NOTIFICADO: {cierre_data}")
                    except Exception as ws_error:
                        print(f"Error enviando WebSocket de cierre: {ws_error}")

            elif nuevo_estado_lower == 'solicitud reapertura' and estado_actual == 'solucionado':
                print(f"✅ CLIENTE SOLICITANDO REAPERTURA: {id}")
                ticket.estado = 'solucionado'
                
                comentario_solicitud = Comentarios(
                    id_ticket=id,
                    id_cliente=user['id'],
                    texto="Cliente solicitó reapertura del ticket - Pendiente de decisión del supervisor",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_solicitud)

                if socketio:
                    try:
                        solicitud_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'cliente_id': ticket.id_cliente,
                            'tipo': 'solicitud_reapertura',
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        socketio.emit('solicitud_reapertura', solicitud_data, room='supervisores')
                        socketio.emit('solicitud_reapertura', solicitud_data, room='administradores')
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('solicitud_reapertura', solicitud_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', solicitud_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', solicitud_data, room='supervisores')
                        socketio.emit('global_ticket_update', solicitud_data)

                        print(f"📤 SOLICITUD DE REAPERTURA NOTIFICADA")
                    except Exception as ws_error:
                        print(f"Error enviando WebSocket de solicitud: {ws_error}")

            elif nuevo_estado_lower == 'reabierto' and estado_actual == 'cerrado':
                ticket.estado = 'en espera'
                ticket.fecha_cierre = None

                comentario_reapertura = Comentarios(
                    id_ticket=id,
                    id_cliente=user['id'],
                    texto="Ticket reabierto por cliente - Listo para nueva asignación",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_reapertura)

                if socketio:
                    try:
                        reapertura_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'cliente_id': ticket.id_cliente,
                            'tipo': 'reabierto',
                            'timestamp': datetime.now().isoformat()
                        }

                        socketio.emit('ticket_reabierto', reapertura_data, room='supervisores')
                        socketio.emit('ticket_reabierto', reapertura_data, room='administradores')
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_reabierto', reapertura_data, room=ticket_room)

                        print(f"📤 TICKET REABIERTO NOTIFICADO")
                    except Exception as ws_error:
                        print(f"Error enviando WebSocket de reapertura: {ws_error}")
            else:
                print(f"❌ TRANSICIÓN NO VÁLIDA PARA CLIENTE")
                return jsonify({"message": "Transición de estado no válida para cliente"}), 400

        # ==================== LÓGICA PARA ANALISTA ====================
        elif user['role'] == 'analista':
            if nuevo_estado_lower == 'en proceso' and estado_actual == 'en espera':
                print(f"✅ ANALISTA INICIANDO TICKET: {id}")
                ticket.estado = 'en proceso'
                
                comentario_inicio = Comentarios(
                    id_ticket=ticket.id,
                    id_analista=user['id'],
                    texto="Analista inició trabajo en el ticket",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_inicio)
                db.session.commit()
                time.sleep(0.1)
                
                if socketio:
                    try:
                        inicio_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'analista_id': user['id'],
                            'tipo': 'en_proceso',
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_actualizado', inicio_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', inicio_data, room='supervisores')
                        socketio.emit('ticket_actualizado', inicio_data, room='role_supervisor')
                        socketio.emit('ticket_actualizado', inicio_data, room='administradores')
                        socketio.emit('ticket_estado_changed', inicio_data, room=ticket_room)
                        socketio.emit('global_ticket_update', inicio_data)
                        
                        print(f"📤 TICKET INICIADO POR ANALISTA NOTIFICADO")
                    except Exception as ws_error:
                        print(f"Error enviando WebSocket de inicio: {ws_error}")
                
                return jsonify(ticket.serialize()), 200
                        
            elif nuevo_estado_lower == 'solucionado' and estado_actual == 'en proceso':
                print(f"✅ ANALISTA SOLUCIONANDO TICKET: {id}")
                ticket.estado = 'solucionado'
                
                comentario_solucion = Comentarios(
                    id_ticket=ticket.id,
                    id_analista=user['id'],
                    texto="Ticket solucionado por analista",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_solucion)
                db.session.commit()
                time.sleep(0.1)
                
                if socketio:
                    try:
                        solucion_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'analista_id': user['id'],
                            'tipo': 'solucionado',
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_solucionado', solucion_data, room=ticket_room)
                        socketio.emit('ticket_solucionado', solucion_data, room='supervisores')
                        socketio.emit('ticket_solucionado', solucion_data, room='role_supervisor')
                        socketio.emit('ticket_solucionado', solucion_data, room='administradores')
                        socketio.emit('ticket_actualizado', solucion_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', solucion_data, room='role_supervisor')
                        socketio.emit('ticket_estado_changed', solucion_data, room=ticket_room)
                        socketio.emit('global_ticket_update', solucion_data)
                        
                        if ticket.id_cliente:
                            cliente_room = f'cliente_{ticket.id_cliente}'
                            socketio.emit('ticket_solucionado', solucion_data, room=cliente_room)
                            socketio.emit('ticket_actualizado', solucion_data, room=cliente_room)
                        
                        print(f"📤 TICKET SOLUCIONADO POR ANALISTA NOTIFICADO")
                    except Exception as ws_error:
                        print(f"Error enviando WebSocket de solución: {ws_error}")
                
                return jsonify(ticket.serialize()), 200

            elif nuevo_estado_lower == 'en espera' and estado_actual in ['en espera', 'en proceso']:
                print(f"✅ ANALISTA ESCALANDO TICKET: {id}")
                ticket.estado = 'en espera'
                
                asignaciones_analista = Asignacion.query.filter_by(
                    id_ticket=ticket.id,
                    id_analista=user['id']
                ).all()

                for asignacion in asignaciones_analista:
                    db.session.delete(asignacion)

                texto_escalacion = "Ticket escalado al supervisor" if estado_actual == 'en espera' else "Ticket escalado al supervisor - Analista no pudo resolver"
                comentario_escalacion = Comentarios(
                    id_ticket=ticket.id,
                    id_analista=user['id'],
                    texto=texto_escalacion,
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_escalacion)
                db.session.commit()
                time.sleep(0.1)

                if socketio:
                    try:
                        escalacion_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'cliente_id': ticket.id_cliente,
                            'analista_id': user['id'],
                            'tipo': 'escalado',
                            'timestamp': datetime.now().isoformat()
                        }

                        socketio.emit('ticket_escalado', escalacion_data, room='supervisores')
                        socketio.emit('ticket_escalado', escalacion_data, room='administradores')
                        socketio.emit('ticket_escalado', escalacion_data, room='role_supervisor')
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_escalado', escalacion_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', escalacion_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', escalacion_data, room='supervisores')
                        socketio.emit('ticket_actualizado', escalacion_data, room='role_supervisor')
                        socketio.emit('ticket_estado_changed', escalacion_data, room=ticket_room)
                        socketio.emit('global_ticket_update', escalacion_data)
                        socketio.emit('nuevo_ticket_disponible', escalacion_data, room='supervisores')
                        socketio.emit('nuevo_ticket_disponible', escalacion_data, room='role_supervisor')

                        print(f"📤 TICKET ESCALADO NOTIFICADO")
                    except Exception as ws_error:
                        print(f"❌ Error enviando WebSocket de escalación: {ws_error}")
                
                return jsonify(ticket.serialize()), 200
            else:
                print(f"❌ TRANSICIÓN NO VÁLIDA PARA ANALISTA")
                return jsonify({"message": "Transición de estado no válida para analista"}), 400

        # ==================== LÓGICA PARA SUPERVISOR ====================
        elif user['role'] == 'supervisor':
            if nuevo_estado_lower == 'cerrado' and estado_actual in ['solucionado', 'reabierto']:
                print(f"✅ SUPERVISOR CERRANDO TICKET: {id}")
                
                ticket.estado = 'cerrado'
                ticket.fecha_cierre = datetime.now()
                
                comentario_cierre = Comentarios(
                    id_ticket=ticket.id,
                    id_supervisor=user['id'],
                    texto=f"Ticket cerrado por supervisor desde estado '{estado_actual}'",
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_cierre)
                
                if socketio:
                    try:
                        cierre_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'tipo': 'cerrado_por_supervisor',
                            'supervisor_id': user['id'],
                            'estado_anterior': estado_actual,
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_cerrado', cierre_data, room=ticket_room)
                        socketio.emit('ticket_cerrado', cierre_data, room='supervisores')
                        socketio.emit('ticket_cerrado', cierre_data, room='administradores')
                        socketio.emit('ticket_actualizado', cierre_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', cierre_data, room='supervisores')
                        socketio.emit('ticket_estado_changed', cierre_data, room=ticket_room)
                        socketio.emit('global_ticket_update', cierre_data)
                        
                        print(f"📤 TICKET CERRADO POR SUPERVISOR NOTIFICADO")
                    except Exception as ws_error:
                        print(f"Error enviando WebSocket de cierre: {ws_error}")

            elif nuevo_estado_lower == 'reabierto' and (estado_actual in ['cerrado', 'solucionado'] or estado_actual.startswith('cerrado')):
                print(f"✅ SUPERVISOR REABRIENDO TICKET: {id}")
                
                ticket.estado = 'en espera'
                ticket.fecha_cierre = None
                
                if estado_actual == 'solucionado':
                    print(f"🗑️ Eliminando asignaciones del analista anterior")
                    asignaciones_anteriores = Asignacion.query.filter_by(id_ticket=ticket.id).all()
                    for asignacion in asignaciones_anteriores:
                        db.session.delete(asignacion)
                
                texto_reapertura = "Ticket reabierto por supervisor - Listo para nueva asignación" if estado_actual == 'cerrado' else "Supervisor aprobó solicitud de reapertura - Asignaciones anteriores eliminadas, listo para nueva asignación"
                comentario_reapertura = Comentarios(
                    id_ticket=ticket.id,
                    id_supervisor=user['id'],
                    texto=texto_reapertura,
                    fecha_comentario=datetime.now()
                )
                db.session.add(comentario_reapertura)
                
                if socketio:
                    try:
                        reapertura_data = {
                            'ticket_id': ticket.id,
                            'ticket_estado': ticket.estado,
                            'ticket_titulo': ticket.titulo,
                            'ticket_prioridad': ticket.prioridad,
                            'tipo': 'reabierto_por_supervisor',
                            'supervisor_id': user['id'],
                            'estado_anterior': estado_actual,
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        ticket_room = f'room_ticket_{ticket.id}'
                        socketio.emit('ticket_reabierto', reapertura_data, room=ticket_room)
                        socketio.emit('ticket_reabierto', reapertura_data, room='supervisores')
                        socketio.emit('ticket_reabierto', reapertura_data, room='administradores')
                        socketio.emit('ticket_actualizado', reapertura_data, room=ticket_room)
                        socketio.emit('ticket_actualizado', reapertura_data, room='supervisores')
                        socketio.emit('ticket_estado_changed', reapertura_data, room=ticket_room)
                        socketio.emit('global_ticket_update', reapertura_data)
                        
                        if ticket.id_cliente:
                            cliente_room = f'cliente_{ticket.id_cliente}'
                            socketio.emit('ticket_reabierto', reapertura_data, room=cliente_room)
                            socketio.emit('ticket_actualizado', reapertura_data, room=cliente_room)
                        
                        print(f"📤 TICKET REABIERTO POR SUPERVISOR NOTIFICADO")
                    except Exception as ws_error:
                        print(f"Error enviando WebSocket de reapertura: {ws_error}")
            else:
                print(f"❌ TRANSICIÓN NO VÁLIDA PARA SUPERVISOR")
                return jsonify({"message": "Transición de estado no válida para supervisor"}), 400

        # ==================== LÓGICA PARA ADMINISTRADOR ====================
        elif user['role'] == 'administrador':
            ticket.estado = nuevo_estado
            if nuevo_estado_lower == 'cerrado':
                ticket.fecha_cierre = datetime.now()
            elif nuevo_estado_lower == 'reabierto':
                ticket.fecha_cierre = None

        db.session.commit()

        if socketio:
            try:
                estado_data = {
                    'ticket_id': ticket.id,
                    'ticket_estado': ticket.estado,
                    'tipo': 'estado_cambiado',
                    'nuevo_estado': nuevo_estado,
                    'usuario': user['role'],
                    'timestamp': datetime.now().isoformat()
                }

                ticket_room = f'room_ticket_{ticket.id}'
                socketio.emit('ticket_actualizado', estado_data, room=ticket_room)

                print(f"📤 Estado de ticket actualizado enviado al room: {ticket_room}")

            except Exception as e:
                print(f"Error enviando WebSocket: {e}")

        return jsonify(ticket.serialize()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al cambiar estado: {str(e)}"}), 500
