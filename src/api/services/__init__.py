"""
Capa de Servicios - TiBACK
Según documentacion/modular.md: La lógica de negocio debe estar en servicios, no en rutas.
"""

from .ticket_service import TicketService
from .image_service import ImageService
from .ia_service import IAService
from .ticket_estado_service import TicketEstadoService

__all__ = ['TicketService', 'ImageService', 'IAService', 'TicketEstadoService']
