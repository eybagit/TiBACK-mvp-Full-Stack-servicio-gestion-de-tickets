"""
Middleware de autorización para WebSocket basado en JWT.
Valida permisos ANTES de enviar eventos a clientes.

SEGURIDAD: JWT como única fuente de verdad
- Intercepta TODOS los eventos salientes
- Valida JWT del cliente destino
- Compara permisos del evento vs permisos del usuario
- Solo envía si está autorizado

Autor: TiBACK Security Team
Fecha: 2025-12-30
"""


import jwt  # PyJWT library (already installed)
import logging
from datetime import datetime

# Usar configuración JWT del proyecto (NO flask_jwt_extended)
from api.jwt_utils import JWT_SECRET_KEY, JWT_ALGORITHM

# Importar sistema de auditoría
from api.utils.audit_logger import (
    log_evento_permitido,
    log_evento_denegado,
    log_token_invalido,
    log_error_middleware
)

logger = logging.getLogger(__name__)


def validar_jwt_socket(socket_id, socketio):
    """
    Valida JWT del socket y extrae información del usuario.
    """
    print(f"        [JWT] Validando socket: {socket_id[:12]}...")
    try:
        # Importar el diccionario de sesiones desde app
        from app import socket_sessions
        
        # Obtener datos de sesión (guardados en connect después de validar JWT)
        print(f"        [JWT] Accediendo a socket_sessions...")
        session_data = socket_sessions.get(socket_id)
        
        if not session_data:
            print(f"        [JWT] ❌ socket_sessions['{socket_id[:12]}'] = None")
            print(f"        [JWT] Sessions disponibles ({len(socket_sessions)}): {list(socket_sessions.keys())[:3]}...")
            return None
        
        print(f"        [JWT] ✅ Sesión encontrada: user_id={session_data.get('user_id')}, role={session_data.get('role')}")
        
        # Extraer información del usuario de la sesión
        usuario = {
            "user_id": session_data.get("user_id"),
            "role": session_data.get("role"),
            "email": session_data.get("email", ""),
            "nombre": session_data.get("nombre", ""),
            "apellido": session_data.get("apellido", "")
        }
        
        print(f"        [JWT] Usuario extraído: user_id={usuario['user_id']}, role={usuario['role']}")
        
        # Validar que todos los campos críticos existen
        if not usuario["user_id"] or not usuario["role"]:
            print(f"        [JWT] ❌ Campos faltantes en usuario: {usuario}")
            return None
        
        print(f"        [JWT] ✅ Validación exitosa")
        return usuario
        
    except Exception as e:
        print(f"        [JWT] ❌ EXCEPCIÓN: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def validar_permiso(usuario, metadata_evento):
    """
    Valida si un usuario tiene permiso para ver un evento específico.
    
    ALGORITMO DE DECISIÓN:
    1. Eventos sin metadata → PUBLIC (permitir)
    2. Administrador → PERMITIR TODO
    3. Rol no en roles_permitidos → DENEGAR
    4. Validación específica por rol:
       - Cliente: Solo si cliente_id coincide
       - Analista: Solo si analista_id coincide
       - Supervisor: Si supervisor_id coincide O tipo_permiso="team"
    5. Default → DENEGAR
    
    Args:
        usuario: dict con información del usuario (de validar_jwt_socket)
        metadata_evento: dict con metadata de permisos del evento
                        Estructura:
                        {
                            "cliente_id": int | None,
                            "analista_id": int | None,
                            "supervisor_id": int | None,
                            "roles_permitidos": list[str],
                            "tipo_permiso": "assigned" | "team" | "admin_only",
                            "ticket_id": int,
                            "entidad_tipo": "ticket" | "comentario",
                            "accion": str
                        }
    
    Returns:
        tuple: (bool permitir, str razon)
               permitir: True si el usuario puede ver el evento
               razon: Descripción de por qué se permitió o denegó
    """
    # Caso 1: Evento sin metadata (público o sistema)
    if not metadata_evento:
        return True, "evento_sin_metadata_publico"
    
    # Caso 2: Administrador siempre tiene acceso total
    if usuario["role"] == "administrador":
        return True, "rol_administrador_acceso_total"
    
    # Caso 3: Verificar si el rol del usuario está permitido
    roles_permitidos = metadata_evento.get("roles_permitidos", [])
    if usuario["role"] not in roles_permitidos:
        return False, f"rol_{usuario['role']}_no_en_lista_permitidos_{roles_permitidos}"
    
    # Caso 4: Validación específica por rol
    # Cada rol tiene reglas diferentes de autorización
    
    if usuario["role"] == "cliente":
        # Cliente solo ve eventos de SUS propios tickets
        cliente_id_evento = metadata_evento.get("cliente_id")
        if cliente_id_evento == usuario["user_id"]:
            return True, f"cliente_id_coincide_{usuario['user_id']}"
        else:
            return False, f"cliente_id_no_coincide_esperado_{cliente_id_evento}_recibido_{usuario['user_id']}"
    
    elif usuario["role"] == "analista":
        # Analista solo ve eventos de tickets ASIGNADOS a él
        analista_id_evento = metadata_evento.get("analista_id")
        if analista_id_evento == usuario["user_id"]:
            return True, f"analista_id_coincide_{usuario['user_id']}"
        else:
            return False, f"analista_id_no_coincide_esperado_{analista_id_evento}_recibido_{usuario['user_id']}"
    
    elif usuario["role"] == "supervisor":
        # Supervisor tiene dos formas de acceso:
        # 1. Si es el supervisor que asignó el ticket
        supervisor_id_evento = metadata_evento.get("supervisor_id")
        if supervisor_id_evento == usuario["user_id"]:
            return True, f"supervisor_id_coincide_{usuario['user_id']}"
        
        # 2. Si el evento es tipo "team" (todos los supervisores)
        #    Ejemplo: tickets nuevos que necesitan asignación
        tipo_permiso = metadata_evento.get("tipo_permiso")
        if tipo_permiso == "team":
            return True, "supervisor_permisos_de_equipo_team"
        
        # Si no cumple ninguna condición, denegar
        return False, "supervisor_no_asigno_ni_tipo_team"
    
    # Caso por defecto: Si llegamos aquí, algo está mal
    # Denegar por seguridad
    logger.warning(f"Caso no manejado en validación: role={usuario['role']}, metadata={metadata_evento}")
    return False, "caso_no_manejado_denegar_por_seguridad"


def middleware_autorizacion_websocket(evento_nombre, evento_data, socket_id, socketio):
    """
    Middleware principal que intercepta eventos ANTES de enviarlos.
    """
    print(f"      [MW] Iniciando validación para socket {socket_id[:12]}...")
    try:
        # Validar sesión del cliente
        print(f"      [MW] Obteniendo datos de sesión...")
        usuario = validar_jwt_socket(socket_id, socketio)
        
        if not usuario:
            print(f"      [MW] ❌ Usuario None - sesión inválida")
            return False
        
        print(f"      [MW] ✅ Usuario validado: ID={usuario.get('user_id')}, Role={usuario.get('role')}")
        
        # Obtener metadata de permisos del evento
        print(f"      [MW] Obteniendo metadata de permisos...")
        metadata = evento_data.get("_permissions")
        
        if not metadata:
            print(f"      [MW] ⚠️ Sin metadata, permitiendo por defecto")
            return True
        
        print(f"      [MW] Metadata obtenida, llamando validar_permiso...")
        # Validar permisos
        permitir, razon = validar_permiso(usuario, metadata)
        
        print(f"      [MW] Resultado: {permitir} - Razón: {razon}")
        
        # Logging de la decisión
        if permitir:
            log_evento_permitido(usuario, evento_nombre, evento_data, razon)
        else:
            log_evento_denegado(usuario, evento_nombre, evento_data, metadata, razon)
        
        return permitir
        
    except Exception as e:
        print(f"      [MW] ❌ EXCEPCIÓN: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        log_error_middleware(e, evento_nombre, socket_id)
        return False


# ==================== FUNCIONES AUXILIARES ====================

def obtener_sockets_en_room(socketio, room_name):
    """
    Obtiene lista de sockets conectados a un room específico.
    
    Args:
        socketio: Instancia de Flask-SocketIO
        room_name: Nombre del room (ej: "global_tickets")
    
    Returns:
        list: Lista de objetos socket conectados al room
    """
    try:
        # Obtener SIDs (Session IDs) en el room usando el namespace correcto
        sids = socketio.server.manager.rooms.get('/', {}).get(room_name, set())
        
        print(f"🔍 DEBUG: Room '{room_name}' tiene {len(sids)} sockets conectados")
        print(f"🔍 DEBUG: SIDs en room: {list(sids)}")
        
        # Convertir SIDs a objetos socket
        sockets = []
        for sid in sids:
            try:
                # Obtener socket desde el servidor
                socket_dict = socketio.server.eio.sockets.get(sid)
                if socket_dict:
                    sockets.append(type('Socket', (), {
                        'id': sid,
                        'emit': lambda event, data, s=sid: socketio.emit(event, data, room=s),
                        'handshake': getattr(socket_dict, 'handshake', {})
                    })())
            except Exception as e:
                print(f"⚠️ Error obteniendo socket {sid}: {e}")
                continue
        
        print(f"✅ DEBUG: Obtenidos {len(sockets)} objetos socket válidos")
        return sockets
    except Exception as e:
        print(f"❌ ERROR en obtener_sockets_en_room: {e}")
        import traceback
        traceback.print_exc()
        return []


def emit_con_autorizacion(socketio, evento_nombre, evento_data, room="global_tickets"):
    """
    Emite un evento aplicando el middleware de autorización.
    """
    try:
        print(f"\n{'='*60}")
        print(f"🔒 [MIDDLEWARE START] Evento: {evento_nombre}")
        print(f"🔒 [MIDDLEWARE] Room: {room}")
        
        # Verificar metadata
        if '_permissions' not in evento_data:
            print(f"⚠️ [MIDDLEWARE] Sin metadata '_permissions', emitiendo a todos")
            socketio.emit(evento_nombre, evento_data, room=room)
            print(f"✅ [MIDDLEWARE END] Emitido sin filtrado")
            return 1
        
        metadata = evento_data['_permissions']
        print(f"🔒 [MIDDLEWARE] Metadata presente:")
        print(f"   - cliente_id: {metadata.get('cliente_id')}")
        print(f"   - analista_id: {metadata.get('analista_id')}")
        print(f"   - supervisor_id: {metadata.get('supervisor_id')}")
        print(f"   - roles: {metadata.get('roles_permitidos')}")
        print(f"   - tipo_permiso: {metadata.get('tipo_permiso')}")
        
        # Obtener SIDs en el room
        print(f"🔍 [MIDDLEWARE] Obteniendo SIDs del room '{room}'...")
        try:
            room_sids = list(socketio.server.manager.rooms.get('/', {}).get(room, set()))
            print(f"✅ [MIDDLEWARE] {len(room_sids)} sockets en room")
            for i, sid in enumerate(room_sids, 1):
                print(f"   {i}. SID: {sid[:12]}...")
        except Exception as e:
            print(f"❌ [MIDDLEWARE] Error obteniendo SIDs: {e}")
            print(f"⚠️ [MIDDLEWARE] Fallback: emitiendo sin filtrar")
            socketio.emit(evento_nombre, evento_data, room=room)
            print(f"✅ [MIDDLEWARE END] Emitido con fallback")
            return 1
        
        if not room_sids:
            print(f"⚠️ [MIDDLEWARE] No hay sockets en room")
            print(f"✅ [MIDDLEWARE END] Ningún destinatario")
            return 0
        
        enviados = 0
        denegados = 0
        errores = 0
        
        print(f"\n🔄 [MIDDLEWARE] Iniciando validación por socket...")
        for i, sid in enumerate(room_sids, 1):
            print(f"\n--- Socket {i}/{len(room_sids)}: {sid[:12]}... ---")
            try:
                print(f"  ➤ Llamando middleware_autorizacion_websocket...")
                permitido = middleware_autorizacion_websocket(evento_nombre, evento_data, sid, socketio)
                print(f"  ➤ Resultado: {'✅ PERMITIDO' if permitido else '🚫 DENEGADO'}")
                
                if permitido:
                    print(f"  ➤ Emitiendo a SID {sid[:12]}...")
                    socketio.emit(evento_nombre, evento_data, room=sid)
                    enviados += 1
                    print(f"  ✅ Enviado exitosamente")
                else:
                    denegados += 1
                    print(f"  🚫 Evento bloqueado")
                    
            except Exception as e:
                errores += 1
                print(f"  ❌ ERROR procesando socket: {type(e).__name__}: {str(e)}")
                import traceback
                print(f"  📋 Traceback:")
                traceback.print_exc()
                continue
        
        print(f"\n{'='*60}")
        print(f"📊 [RESUMEN FINAL]")
        print(f"   - Enviados: {enviados}")
        print(f"   - Denegados: {denegados}")
        print(f"   - Errores: {errores}")
        print(f"   - Total procesados: {len(room_sids)}")
        print(f"✅ [MIDDLEWARE END]")
        print(f"{'='*60}\n")
        
        return enviados
        
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"❌ [MIDDLEWARE CRITICAL ERROR]")
        print(f"   Error: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"📋 Traceback completo:")
        traceback.print_exc()
        print(f"⚠️ Fallback: emitiendo sin filtrado")
        try:
            socketio.emit(evento_nombre, evento_data, room=room)
            print(f"✅ Emitido con fallback de emergencia")
        except Exception as e2:
            print(f"❌ Fallback también falló: {e2}")
        print(f"{'='*60}\n")
        return 1
