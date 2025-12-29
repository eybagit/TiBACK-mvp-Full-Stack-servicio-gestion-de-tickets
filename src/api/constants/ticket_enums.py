"""
ticket_enums.py - Fuente única de verdad Backend
Enums para estados, eventos y campos del sistema de tickets
"""

from enum import Enum


class TicketState(str, Enum):
    """
    Estados del Ticket (formato BD con espacios)
    Backend usa espacios, Frontend usa guiones bajos
    """
    CREADO = 'creado'
    EN_ESPERA = 'en espera'
    EN_PROCESO = 'en proceso'
    SOLUCIONADO = 'solucionado'
    CERRADO = 'cerrado'
    REABIERTO = 'reabierto'
    
    @classmethod
    def values(cls):
        """Retorna lista de todos los valores"""
        return [e.value for e in cls]
    
    @classmethod
    def is_valid(cls, estado):
        """Verifica si un estado es válido"""
        return estado in cls.values()


class TicketEvent(str, Enum):
    """Eventos WebSocket del sistema"""
    CREATED = 'ticket_created'
    ASIGNADO = 'ticket_asignado'
    INICIADO = 'ticket_iniciado'
    SOLUCIONADO = 'ticket_solucionado'
    CERRADO = 'ticket_cerrado'
    REABIERTO = 'ticket_reabierto'
    ESCALADO = 'ticket_escalado'
    SOLICITUD_REAPERTURA = 'solicitud_reapertura'
    ELIMINADO = 'ticket_eliminado'
    ASIGNACION_ELIMINADA = 'asignacion_eliminada'
    
    @classmethod
    def values(cls):
        """Retorna lista de todos los valores"""
        return [e.value for e in cls]
    
    @classmethod
    def is_valid(cls, evento):
        """Verifica si un evento es válido"""
        return evento in cls.values()


class TicketFields(str, Enum):
    """Campos especiales del ticket"""
    SOLICITUD_PENDIENTE = 'tiene_solicitud_reapertura_pendiente'


# Mapeo: Evento → Estado resultante
EVENT_TO_STATE = {
    TicketEvent.CREATED: TicketState.CREADO,
    TicketEvent.ASIGNADO: TicketState.EN_ESPERA,
    TicketEvent.INICIADO: TicketState.EN_PROCESO,
    TicketEvent.SOLUCIONADO: TicketState.SOLUCIONADO,
    TicketEvent.CERRADO: TicketState.CERRADO,
    TicketEvent.REABIERTO: TicketState.REABIERTO,
    TicketEvent.ASIGNACION_ELIMINADA: TicketState.CREADO,
}

# Estados que permiten escalamiento
ESCALATION_STATES = [
    TicketState.EN_ESPERA,
    TicketState.EN_PROCESO,
    TicketState.REABIERTO
]

# Estados activos (no cerrados)
ACTIVE_STATES = [
    TicketState.CREADO,
    TicketState.EN_ESPERA,
    TicketState.EN_PROCESO,
    TicketState.SOLUCIONADO,
    TicketState.REABIERTO
]
