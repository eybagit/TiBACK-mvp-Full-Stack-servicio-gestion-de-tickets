"""
normalize.py - Funciones de normalización
Conversión bidireccional entre formatos de estado Backend/Frontend
"""

from api.constants.ticket_enums import TicketState, TicketEvent


def normalize_to_frontend(estado: str) -> str:
    """
    Normaliza estado del backend (espacios) al frontend (guiones bajos)
    "en espera" → "en_espera"
    
    Args:
        estado: Estado en formato backend
        
    Returns:
        Estado normalizado para frontend
    """
    if not estado:
        return ""
    return estado.lower().strip().replace(' ', '_')


def normalize_to_backend(estado: str) -> str:
    """
    Normaliza estado del frontend (guiones bajos) al backend (espacios)
    "en_espera" → "en espera"
    
    Args:
        estado: Estado en formato frontend
        
    Returns:
        Estado normalizado para backend
    """
    if not estado:
        return ""
    return estado.lower().strip().replace('_', ' ')


def is_valid_state(estado: str) -> bool:
    """
    Valida si un estado es válido
    
    Args:
        estado: Estado a validar
        
    Returns:
        True si el estado es válido
    """
    normalized = normalize_to_backend(estado)
    return normalized in TicketState.values()


def is_valid_event(evento: str) -> bool:
    """
    Valida si un evento es válido
    
    Args:
        evento: Evento a validar
        
    Returns:
        True si el evento es válido
    """
    return evento in TicketEvent.values()


def states_match(estado1: str, estado2: str) -> bool:
    """
    Compara dos estados (ignora formato espacios/guiones)
    
    Args:
        estado1: Primer estado
        estado2: Segundo estado
        
    Returns:
        True si los estados coinciden
    """
    return normalize_to_backend(estado1) == normalize_to_backend(estado2)


def get_state_enum(estado: str) -> TicketState:
    """
    Obtiene el enum de estado a partir de un string
    
    Args:
        estado: Estado como string
        
    Returns:
        TicketState enum o None si no es válido
    """
    normalized = normalize_to_backend(estado)
    try:
        return TicketState(normalized)
    except ValueError:
        return None
