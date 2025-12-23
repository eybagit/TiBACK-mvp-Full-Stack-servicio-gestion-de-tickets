"""
Rutas de cambio de estado para tickets
Refactorizado para usar TicketEstadoService según documentacion/modular.md
"""
from flask import Blueprint, request, jsonify

from api.jwt_utils import require_role, get_user_from_token
from api.services import TicketEstadoService
from api.routes.utils_routes import get_socketio

ticket_estado_bp = Blueprint('ticket_estado', __name__)


def emit_websocket_event(socketio, event_name, data, rooms=None):
    """
    Helper para emitir eventos WebSocket a múltiples rooms
    SIMPLIFICADO: Ignora rooms específicas y SIEMPRE emite a global_tickets
    """
    if not socketio:
        return
    try:
        # SOLO global_tickets - TODOS escuchan TODO
        socketio.emit(event_name, data, room='global_tickets')
    except Exception as e:
        print(f"Error enviando WebSocket {event_name}: {e}")



@ticket_estado_bp.route('/tickets/<int:id>/estado', methods=['PUT'])
@require_role(['analista', 'supervisor', 'cliente', 'administrador'])
def cambiar_estado_ticket(id):
    """Cambiar el estado de un ticket"""
    body = request.get_json(silent=True) or {}
    user = get_user_from_token()
    
    nuevo_estado = body.get('estado')
    if not nuevo_estado:
        return jsonify({"message": "Estado requerido"}), 400

    try:
        ticket = TicketEstadoService.get_ticket(id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        # Verificar permisos de cliente
        if user['role'] == 'cliente' and not TicketEstadoService.verificar_permisos_cliente(ticket, user['id']):
            return jsonify({"message": "No tienes permisos para modificar este ticket"}), 403

        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        nuevo_estado_lower = TicketEstadoService.normalizar_estado(nuevo_estado)
        
        socketio = get_socketio()
        ticket_room = f'room_ticket_{ticket.id}'
        result = None
        error = None

        # ==================== CLIENTE ====================
        if user['role'] == 'cliente':
            if nuevo_estado_lower == 'cerrado' and estado_actual == 'solucionado':
                result, error = TicketEstadoService.cliente_cerrar_ticket(
                    ticket, user['id'], 
                    body.get('calificacion'), 
                    body.get('comentario', '')
                )
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'cerrado')
                    data['calificacion'] = body.get('calificacion')
                    emit_websocket_event(socketio, 'ticket_cerrado', data, 
                        ['supervisores', 'administradores', ticket_room])
                    emit_websocket_event(socketio, 'ticket_actualizado', data, 
                        [ticket_room, 'supervisores'])
                    emit_websocket_event(socketio, 'global_ticket_update', data, [''])

            elif nuevo_estado_lower == 'solicitud reapertura' and estado_actual == 'solucionado':
                result, error = TicketEstadoService.cliente_solicitar_reapertura(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'solicitud_reapertura')
                    emit_websocket_event(socketio, 'solicitud_reapertura', data, 
                        ['supervisores', 'administradores', ticket_room])
                    emit_websocket_event(socketio, 'ticket_actualizado', data, 
                        [ticket_room, 'supervisores'])
                    emit_websocket_event(socketio, 'global_ticket_update', data, [''])

            elif nuevo_estado_lower == 'reabierto' and estado_actual == 'cerrado':
                result, error = TicketEstadoService.cliente_reabrir_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'reabierto')
                    emit_websocket_event(socketio, 'ticket_reabierto', data, 
                        ['supervisores', 'administradores', ticket_room])
            else:
                return jsonify({"message": "Transición de estado no válida para cliente"}), 400

        # ==================== ANALISTA ====================
        elif user['role'] == 'analista':
            if nuevo_estado_lower == 'en proceso' and estado_actual == 'en espera':
                result, error = TicketEstadoService.analista_iniciar_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'en_proceso', user['id'], 'analista')
                    emit_websocket_event(socketio, 'ticket_actualizado', data, 
                        [ticket_room, 'supervisores', 'role_supervisor', 'administradores'])
                    emit_websocket_event(socketio, 'ticket_estado_changed', data, [ticket_room])
                    emit_websocket_event(socketio, 'global_ticket_update', data, [''])

            elif nuevo_estado_lower == 'solucionado' and estado_actual == 'en proceso':
                result, error = TicketEstadoService.analista_solucionar_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'solucionado', user['id'], 'analista')
                    emit_websocket_event(socketio, 'ticket_solucionado', data, 
                        [ticket_room, 'supervisores', 'role_supervisor', 'administradores'])
                    emit_websocket_event(socketio, 'ticket_actualizado', data, 
                        [ticket_room, 'role_supervisor'])
                    emit_websocket_event(socketio, 'ticket_estado_changed', data, [ticket_room])
                    emit_websocket_event(socketio, 'global_ticket_update', data, [''])
                    if ticket.id_cliente:
                        cliente_room = f'cliente_{ticket.id_cliente}'
                        emit_websocket_event(socketio, 'ticket_solucionado', data, [cliente_room])
                        emit_websocket_event(socketio, 'ticket_actualizado', data, [cliente_room])

            elif nuevo_estado_lower == 'en espera' and estado_actual in ['en espera', 'en proceso']:
                result, error = TicketEstadoService.analista_escalar_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'escalado', user['id'], 'analista')
                    emit_websocket_event(socketio, 'ticket_escalado', data, 
                        ['supervisores', 'administradores', 'role_supervisor', ticket_room])
                    emit_websocket_event(socketio, 'ticket_actualizado', data, 
                        [ticket_room, 'supervisores', 'role_supervisor'])
                    emit_websocket_event(socketio, 'ticket_estado_changed', data, [ticket_room])
                    emit_websocket_event(socketio, 'global_ticket_update', data, [''])
                    emit_websocket_event(socketio, 'nuevo_ticket_disponible', data, 
                        ['supervisores', 'role_supervisor'])
            else:
                return jsonify({"message": "Transición de estado no válida para analista"}), 400

        # ==================== SUPERVISOR ====================
        elif user['role'] == 'supervisor':
            if nuevo_estado_lower == 'cerrado' and estado_actual in ['solucionado', 'reabierto']:
                result, error = TicketEstadoService.supervisor_cerrar_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(
                        ticket, 'cerrado_por_supervisor', user['id'], 'supervisor', estado_actual
                    )
                    emit_websocket_event(socketio, 'ticket_cerrado', data, 
                        [ticket_room, 'supervisores', 'administradores'])
                    emit_websocket_event(socketio, 'ticket_actualizado', data, 
                        [ticket_room, 'supervisores'])
                    emit_websocket_event(socketio, 'ticket_estado_changed', data, [ticket_room])
                    emit_websocket_event(socketio, 'global_ticket_update', data, [''])

            elif nuevo_estado_lower == 'reabierto' and (estado_actual in ['cerrado', 'solucionado'] or estado_actual.startswith('cerrado')):
                result, error = TicketEstadoService.supervisor_reabrir_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(
                        ticket, 'reabierto_por_supervisor', user['id'], 'supervisor', estado_actual
                    )
                    emit_websocket_event(socketio, 'ticket_reabierto', data, 
                        [ticket_room, 'supervisores', 'administradores'])
                    emit_websocket_event(socketio, 'ticket_actualizado', data, 
                        [ticket_room, 'supervisores'])
                    emit_websocket_event(socketio, 'ticket_estado_changed', data, [ticket_room])
                    emit_websocket_event(socketio, 'global_ticket_update', data, [''])
                    if ticket.id_cliente:
                        cliente_room = f'cliente_{ticket.id_cliente}'
                        emit_websocket_event(socketio, 'ticket_reabierto', data, [cliente_room])
                        emit_websocket_event(socketio, 'ticket_actualizado', data, [cliente_room])
            else:
                return jsonify({"message": "Transición de estado no válida para supervisor"}), 400

        # ==================== ADMINISTRADOR ====================
        elif user['role'] == 'administrador':
            result, error = TicketEstadoService.admin_cambiar_estado(ticket, nuevo_estado)

        # Manejar errores del servicio
        if error:
            return jsonify({"message": error}), 400

        # Emitir evento genérico de actualización
        if socketio and result:
            data = TicketEstadoService.build_ticket_event_data(ticket, 'estado_cambiado')
            data['nuevo_estado'] = nuevo_estado
            data['usuario'] = user['role']
            emit_websocket_event(socketio, 'ticket_actualizado', data, [ticket_room])

        return jsonify(ticket.serialize()), 200

    except Exception as e:
        return jsonify({"message": f"Error al cambiar estado: {str(e)}"}), 500
