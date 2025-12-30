"""
Sistema de logging para auditoría de seguridad WebSocket.
Registra TODOS los accesos y decisiones de autorización.

COMPLIANCE: Este sistema permite:
- Investigar incidentes de seguridad
- Detectar patrones de acceso anormales
- Cumplir con requisitos de auditoría (GDPR, SOC2, etc.)
- Evidencia para acciones legales

Autor: TiBACK Security Team
Fecha: 2025-12-30
"""

import logging
import json
from datetime import datetime
from logging.handlers import TimedRotatingFileHandler
import os

# Crear directorio de logs si no existe
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Configurar logger de auditoría
audit_logger = logging.getLogger("websocket_audit")
audit_logger.setLevel(logging.INFO)
audit_logger.propagate = False  # No propagar a loggers padres

# Handler para archivo rotativo diario
handler = TimedRotatingFileHandler(
    filename=os.path.join(LOG_DIR, "websocket_audit.log"),
    when="midnight",        # Rotar a medianoche
    interval=1,             # Cada día
    backupCount=30,         # Mantener últimos 30 días
    encoding="utf-8"
)

# Formato: Solo el mensaje (JSON)
handler.setFormatter(logging.Formatter('%(message)s'))
audit_logger.addHandler(handler)

# Handler para consola (solo en desarrollo)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.WARNING)  # Solo warnings y errors en consola
console_handler.setFormatter(logging.Formatter(
    '%(levelname)s - %(message)s'
))
audit_logger.addHandler(console_handler)


def log_evento_permitido(usuario, evento_nombre, evento_data, razon):
    """
    Registra un evento que fue permitido (usuario autorizado).
    
    Args:
        usuario: dict con información del usuario (de validar_jwt_socket)
        evento_nombre: str - Nombre del evento
        evento_data: dict - Datos del evento
        razon: str - Razón por la cual se permitió
    """
    try:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "nivel": "INFO",
            "tipo": "evento_permitido",
            "usuario": {
                "user_id": usuario["user_id"],
                "role": usuario["role"],
                "email": usuario["email"]
            },
            "evento": {
                "nombre": evento_nombre,
                "ticket_id": evento_data.get("ticket_id"),
                "accion": evento_data.get("_permissions", {}).get("accion") if evento_data.get("_permissions") else None
            },
            "decision": "PERMITIR",
            "razon": razon
        }
        
        # Log en formato JSON Lines (un JSON por línea)
        audit_logger.info(json.dumps(log_entry, ensure_ascii=False))
        
    except Exception as e:
        # Si falla el logging, no detener el flujo
        logging.error(f"Error en log_evento_permitido: {e}")


def log_evento_denegado(usuario, evento_nombre, evento_data, metadata, razon):
    """
    Registra un evento que fue denegado (usuario NO autorizado).
    
    ALERTA: Los eventos denegados son críticos para seguridad.
    Pueden indicar:
    - Bug en el código de permisos
    - Intento malicioso de acceso no autorizado
    - Cliente comprometido
    
    Args:
        usuario: dict con información del usuario
        evento_nombre: str - Nombre del evento
        evento_data: dict - Datos del evento
        metadata: dict - Metadata de permisos del evento
        razon: str - Razón por la cual se denegó
    """
    try:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "nivel": "WARNING",
            "tipo": "evento_denegado",
            "usuario": {
                "user_id": usuario["user_id"],
                "role": usuario["role"],
                "email": usuario["email"],
                "nombre_completo": f"{usuario.get('nombre', '')} {usuario.get('apellido', '')}".strip()
            },
            "evento": {
                "nombre": evento_nombre,
                "ticket_id": evento_data.get("ticket_id"),
                "accion": metadata.get("accion") if metadata else None
            },
            "decision": "DENEGAR",
            "razon": razon,
            "metadata_evento": {
                "cliente_id": metadata.get("cliente_id") if metadata else None,
                "analista_id": metadata.get("analista_id") if metadata else None,
                "supervisor_id": metadata.get("supervisor_id") if metadata else None,
                "roles_permitidos": metadata.get("roles_permitidos") if metadata else None,
                "tipo_permiso": metadata.get("tipo_permiso") if metadata else None
            },
            "alerta": "POSIBLE_INTENTO_NO_AUTORIZADO",
            "severidad": "HIGH"
        }
        
        # Log en formato JSON Lines
        audit_logger.warning(json.dumps(log_entry, ensure_ascii=False))
        
        # TODO: Implementar alertas automáticas
        # - Si mismo usuario tiene > 5 eventos denegados en 1 minuto → Alerta critica
        # - Si usuario intenta acceder a tickets de múltiples clientes → Alerta
        
    except Exception as e:
        logging.error(f"Error en log_evento_denegado: {e}")


def log_token_invalido(socket_id, razon="JWT inválido o expirado"):
    """
    Registra intento de conexión con JWT inválido.
    
    Args:
        socket_id: ID del socket
        razon: Razón de invalidez
    """
    try:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "nivel": "WARNING",
            "tipo": "token_invalido",
            "socket_id": socket_id,
            "decision": "RECHAZAR_CONEXION",
            "razon": razon,
            "alerta": "POSIBLE_ATAQUE_REPLAY_O_FALSIFICACION",
            "severidad": "MEDIUM"
        }
        
        audit_logger.warning(json.dumps(log_entry, ensure_ascii=False))
        
    except Exception as e:
        logging.error(f"Error en log_token_invalido: {e}")


def log_error_middleware(error, evento_nombre, socket_id):
    """
    Registra error en el middleware de autorización.
    
    Args:
        error: Excepción capturada
        evento_nombre: Nombre del evento que causó el error
        socket_id: ID del socket
    """
    try:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "nivel": "ERROR",
            "tipo": "error_middleware",
            "evento_nombre": evento_nombre,
            "socket_id": socket_id,
            "error": str(error),
            "error_tipo": type(error).__name__,
            "decision": "DENEGAR_POR_ERROR",
            "severidad": "HIGH"
        }
        
        audit_logger.error(json.dumps(log_entry, ensure_ascii=False))
        
    except Exception as e:
        logging.error(f"Error en log_error_middleware: {e}")


# ==================== ANÁLISIS DE LOGS ====================

def analizar_intentos_sospechosos(user_id, ventana_minutos=1):
    """
    Analiza logs recientes para detectar patrones sospechosos.
    
    TODO: Implementar análisis en tiempo real
    - Contar eventos denegados por usuario
    - Detectar patrones de acceso anómalos
    - Generar alertas automáticas
    
    Args:
        user_id: ID del usuario a analizar
        ventana_minutos: Ventana de tiempo para análisis
    
    Returns:
        dict: Resultado del análisis
    """
    # Placeholder - implementar lectura y análisis de logs
    pass


def generar_reporte_seguridad(fecha_inicio, fecha_fin):
    """
    Genera reporte de seguridad para un período.
    
    TODO: Implementar generación de reportes
    - Total de eventos procesados
    - Eventos permitidos vs denegados (ratio)
    - Usuarios con más eventos denegados
    - Tipos de eventos más denegados
    
    Args:
        fecha_inicio: datetime
        fecha_fin: datetime
    
    Returns:
        dict: Reporte de seguridad
    """
    # Placeholder - implementar análisis de logs
    pass
