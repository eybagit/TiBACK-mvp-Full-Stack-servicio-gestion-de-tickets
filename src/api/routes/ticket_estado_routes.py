"""
Rutas de cambio de estado para tickets
Refactorizado para usar TicketEstadoService según documentacion/modular.md
"""
from flask import Blueprint, request, jsonify

from api.jwt_utils import require_role, get_user_from_token
from api.services import TicketEstadoService
from api.routes.utils_routes import get_socketio
from api.constants.ticket_enums import TicketState, TicketEvent
from api.utils.normalize import normalize_to_backend, states_match
from api.models import db

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
            if nuevo_estado_lower == TicketState.CERRADO.value and estado_actual == TicketState.SOLUCIONADO.value:
                result, error = TicketEstadoService.cliente_cerrar_ticket(
                    ticket, user['id'], 
                    body.get('calificacion'), 
                    body.get('comentario', '')
                )
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'cerrado')
                    data['calificacion'] = body.get('calificacion')
                    # UNA sola emisión - global_tickets recibe todo
                    emit_websocket_event(socketio, TicketEvent.CERRADO.value, data, None)

            elif nuevo_estado_lower == 'solicitud reapertura' and estado_actual == TicketState.SOLUCIONADO.value:
                result, error = TicketEstadoService.cliente_solicitar_reapertura(ticket, user['id'])
                if result:
                    # CRÍTICO: Refrescar ticket para que serialize() incluya el nuevo comentario
                    db.session.refresh(ticket)
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'solicitud_reapertura')
                    # UNA sola emisión - global_tickets recibe todo
                    emit_websocket_event(socketio, 'solicitud_reapertura', data, None)

            elif nuevo_estado_lower == TicketState.REABIERTO.value and estado_actual == TicketState.CERRADO.value:
                result, error = TicketEstadoService.cliente_reabrir_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'reabierto')
                    # UNA sola emisión - global_tickets recibe todo
                    emit_websocket_event(socketio, TicketEvent.REABIERTO.value, data, None)
            else:
                return jsonify({"message": "Transición de estado no válida para cliente"}), 400

        # ==================== ANALISTA ====================
        elif user['role'] == 'analista':
            if nuevo_estado_lower == TicketState.EN_PROCESO.value and estado_actual == TicketState.EN_ESPERA.value:
                result, error = TicketEstadoService.analista_iniciar_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'en_proceso', user['id'], 'analista')
                    # UNA sola emisión - global_tickets recibe todo
                    emit_websocket_event(socketio, TicketEvent.INICIADO.value, data, None)
                    # IMPORTANTE: Retornar inmediatamente para evitar error 500
                    return jsonify(ticket.serialize()), 200
                else:
                    return jsonify({"message": error}), 400

            elif nuevo_estado_lower == TicketState.SOLUCIONADO.value and estado_actual == TicketState.EN_PROCESO.value:
                result, error = TicketEstadoService.analista_solucionar_ticket(ticket, user['id'])
                if result:
                    data = TicketEstadoService.build_ticket_event_data(ticket, 'solucionado', user['id'], 'analista')
                    data['mensaje'] = 'El analista ha marcado el ticket como solucionado'
                    # UNA sola emisión - global_tickets recibe todo
                    emit_websocket_event(socketio, TicketEvent.SOLUCIONADO.value, data, None)
                    # IMPORTANTE: Retornar inmediatamente para evitar error 500
                    return jsonify(ticket.serialize()), 200
                else:
                    return jsonify({"message": error}), 400

            elif nuevo_estado_lower == TicketState.EN_ESPERA.value and estado_actual in [TicketState.EN_ESPERA.value, TicketState.EN_PROCESO.value, TicketState.REABIERTO.value]:
                print(f"[DEBUG] 🚀 Iniciando escalamiento - ticket_id: {ticket.id}, user_id: {user['id']}")
                print(f"[DEBUG] 📊 Estado actual: {estado_actual}, Nuevo estado: {nuevo_estado_lower}")
                
                result, error = TicketEstadoService.analista_escalar_ticket(ticket, user['id'])
                
                print(f"[DEBUG] ✅ Servicio retornó - result: {result is not None}, error: {error}")
                
                if result:
                    print(f"[DEBUG] 📤 Preparando emisión WebSocket para escalamiento")
                    # IMPORTANTE: NO existe estado "escalado" - se mantiene en "en_espera"
                    # El escalamiento se detecta por comentarios, no por estado
                    
                    try:
                        print(f"[DEBUG] 🔧 Construyendo data del evento...")
                        data = TicketEstadoService.build_ticket_event_data(ticket, 'actualizado', user['id'], 'analista')
                        print(f"[DEBUG] ✅ Data construida exitosamente")
                        
                        data['mensaje'] = 'El analista ha escalado el ticket al supervisor'
                        data['escalado'] = True  # Flag para indicar que fue escalado
                        
                        print(f"[DEBUG] 🔔 Emitiendo evento: {TicketEvent.ESCALADO.value}")
                        # UNA sola emisión - global_tickets recibe todo
                        emit_websocket_event(socketio, TicketEvent.ESCALADO.value, data, None)
                        
                        print(f"[DEBUG] ✅ Evento emitido, serializando ticket para respuesta...")
                        serialized = ticket.serialize()
                        print(f"[DEBUG] ✅ Ticket serializado exitosamente")
                        
                        print(f"[DEBUG] ✅ Retornando respuesta exitosa")
                        # IMPORTANTE: Retornar inmediatamente para evitar error 500
                        return jsonify(serialized), 200
                    except Exception as e:
                        print(f"[DEBUG] 💥 ERROR en emisión/serialización: {type(e).__name__}: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        raise
                else:
                    print(f"[DEBUG] ❌ Error del servicio: {error}")
                    return jsonify({"message": error}), 400
            else:
                return jsonify({"message": "Transición de estado no válida para analista"}), 400

        # ==================== SUPERVISOR ====================
        elif user['role'] == 'supervisor':
            if nuevo_estado_lower == TicketState.CERRADO.value and estado_actual in [TicketState.SOLUCIONADO.value, TicketState.REABIERTO.value]:
                print(f"[DEBUG] 🔒 Supervisor cierra ticket {ticket.id}")
                result, error = TicketEstadoService.supervisor_cerrar_ticket(ticket, user['id'])
                
                if result:
                    print(f"[DEBUG] ✅ Ticket cerrado exitosamente")
                    data = TicketEstadoService.build_ticket_event_data(
                        ticket, 'cerrado_por_supervisor', user['id'], 'supervisor', estado_actual
                    )
                    print(f"[DEBUG] 📤 Emitiendo evento ticket_cerrado para ticket {ticket.id}")
                    print(f"[DEBUG] 📊 Data: ticket_id={data.get('ticket_id')}, id_cliente={ticket.id_cliente}")
                    
                    # UNA sola emisión - global_tickets recibe todo
                    emit_websocket_event(socketio, TicketEvent.CERRADO.value, data, None)
                    
                    print(f"[DEBUG] ✅ Evento ticket_cerrado emitido a global_tickets")
                    # IMPORTANTE: Retornar inmediatamente para evitar error 500
                    return jsonify(ticket.serialize()), 200
                else:
                    print(f"[DEBUG] ❌ Error al cerrar ticket: {error}")
                    return jsonify({"message": error}), 400

            elif nuevo_estado_lower == TicketState.REABIERTO.value and (estado_actual in [TicketState.CERRADO.value, TicketState.SOLUCIONADO.value] or estado_actual.startswith('cerrado')):
                result, error = TicketEstadoService.supervisor_reabrir_ticket(ticket, user['id'])
                if result:
                    # CRÍTICO: Refrescar ticket para que serialize() incluya el comentario de aprobación
                    db.session.refresh(ticket)
                    data = TicketEstadoService.build_ticket_event_data(
                        ticket, 'reabierto_por_supervisor', user['id'], 'supervisor', estado_actual
                    )
                    # UNA sola emisión - global_tickets recibe todo
                    emit_websocket_event(socketio, TicketEvent.REABIERTO.value, data, None)
                    # IMPORTANTE: Retornar inmediatamente para evitar error 500
                    return jsonify(ticket.serialize()), 200
                else:
                    return jsonify({"message": error}), 400
            else:
                return jsonify({"message": "Transición de estado no válida para supervisor"}), 400

        # ==================== ADMINISTRADOR ====================
        elif user['role'] == 'administrador':
            result, error = TicketEstadoService.admin_cambiar_estado(ticket, nuevo_estado)

        # Manejar errores del servicio
        if error:
            return jsonify({"message": error}), 400

        # Emitir evento genérico solo para administrador (otros roles ya emitieron evento específico)
        if socketio and result and user['role'] == 'administrador':
            data = TicketEstadoService.build_ticket_event_data(ticket, 'estado_cambiado')
            data['nuevo_estado'] = nuevo_estado
            data['usuario'] = user['role']
            emit_websocket_event(socketio, 'ticket_actualizado', data, None)

        return jsonify(ticket.serialize()), 200

    except Exception as e:
        return jsonify({"message": f"Error al cambiar estado: {str(e)}"}), 500
