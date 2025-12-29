"""
TicketEstadoService - Lógica de negocio para cambios de estado de tickets
Según documentacion/modular.md: Servicios contienen lógica de negocio pura.
"""
import time
from datetime import datetime

from api.models import db, Ticket, Asignacion, Comentarios
from api.constants.ticket_enums import TicketState, TicketEvent, ESCALATION_STATES
from api.utils.normalize import normalize_to_backend, normalize_to_frontend, states_match


class TicketEstadoService:
    """Servicio para operaciones de cambio de estado de tickets"""

    # Estados válidos del sistema - Usar enum centralizado
    ESTADOS_VALIDOS = TicketState.values()

    @staticmethod
    def normalizar_estado(estado):
        """Normalizar estado para comparaciones - usa función centralizada"""
        return normalize_to_backend(estado)

    @staticmethod
    def get_ticket(ticket_id):
        """Obtener ticket por ID"""
        return db.session.get(Ticket, ticket_id)

    @staticmethod
    def verificar_permisos_cliente(ticket, user_id):
        """Verificar si el cliente tiene permisos sobre el ticket"""
        return ticket.id_cliente == user_id

    @staticmethod
    def crear_comentario(ticket_id, texto, id_cliente=None, id_analista=None, id_supervisor=None):
        """Crear comentario en el ticket"""
        comentario = Comentarios(
            id_ticket=ticket_id,
            id_cliente=id_cliente,
            id_analista=id_analista,
            id_supervisor=id_supervisor,
            texto=texto,
            fecha_comentario=datetime.now()
        )
        db.session.add(comentario)
        return comentario

    # ==================== ACCIONES DE CLIENTE ====================
    @staticmethod
    def cliente_cerrar_ticket(ticket, user_id, calificacion=None, comentario=''):
        """Cliente cierra un ticket solucionado"""
        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        
        if estado_actual != 'solucionado':
            return None, "Solo se pueden cerrar tickets solucionados"
        
        ticket.estado = TicketState.CERRADO.value
        ticket.fecha_cierre = datetime.now()
        
        if calificacion and 1 <= calificacion <= 5:
            ticket.calificacion = calificacion
            ticket.comentario = comentario
            ticket.fecha_evaluacion = datetime.now()
        
        TicketEstadoService.crear_comentario(
            ticket.id, "Ticket cerrado por cliente", id_cliente=user_id
        )
        
        db.session.commit()
        return ticket, None

    @staticmethod
    def cliente_solicitar_reapertura(ticket, user_id):
        """Cliente solicita reapertura de ticket solucionado"""
        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        
        if estado_actual != 'solucionado':
            return None, "Solo se puede solicitar reapertura de tickets solucionados"
        
        TicketEstadoService.crear_comentario(
            ticket.id,
            "Cliente solicitó reapertura del ticket - Pendiente de decisión del supervisor",
            id_cliente=user_id
        )
        
        db.session.commit()
        return ticket, None

    @staticmethod
    def cliente_reabrir_ticket(ticket, user_id):
        """Cliente reabre un ticket cerrado"""
        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        
        if estado_actual != 'cerrado':
            return None, "Solo se pueden reabrir tickets cerrados"
        
        ticket.estado = TicketState.EN_ESPERA.value
        ticket.fecha_cierre = None
        
        TicketEstadoService.crear_comentario(
            ticket.id,
            "Ticket reabierto por cliente - Listo para nueva asignación",
            id_cliente=user_id
        )
        
        db.session.commit()
        return ticket, None

    # ==================== ACCIONES DE ANALISTA ====================
    @staticmethod
    def analista_iniciar_ticket(ticket, user_id):
        """Analista inicia trabajo en un ticket"""
        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        
        if estado_actual != 'en espera':
            return None, "Solo se pueden iniciar tickets en espera"
        
        ticket.estado = TicketState.EN_PROCESO.value
        
        TicketEstadoService.crear_comentario(
            ticket.id, "Analista inició trabajo en el ticket", id_analista=user_id
        )
        
        db.session.commit()
        time.sleep(0.1)
        return ticket, None

    @staticmethod
    def analista_solucionar_ticket(ticket, user_id):
        """Analista marca ticket como solucionado"""
        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        
        if estado_actual != 'en proceso':
            return None, "Solo se pueden solucionar tickets en proceso"
        
        ticket.estado = TicketState.SOLUCIONADO.value
        
        TicketEstadoService.crear_comentario(
            ticket.id, "Ticket solucionado por analista", id_analista=user_id
        )
        
        db.session.commit()
        time.sleep(0.1)
        return ticket, None

    @staticmethod
    def analista_escalar_ticket(ticket, user_id):
        """Analista escala ticket al supervisor"""
        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        
        if estado_actual not in [TicketState.EN_ESPERA.value, TicketState.EN_PROCESO.value]:
            return None, "Solo se pueden escalar tickets en espera o en proceso"
        
        ticket.estado = TicketState.EN_ESPERA.value
        
        # Eliminar asignaciones del analista solo si existen
        asignaciones_analista = Asignacion.query.filter_by(
            id_ticket=ticket.id,
            id_analista=user_id
        ).all()
        
        if asignaciones_analista:
            for asignacion in asignaciones_analista:
                db.session.delete(asignacion)
        
        texto = "Ticket escalado al supervisor" if estado_actual == TicketState.EN_ESPERA.value else "Ticket escalado al supervisor - Analista no pudo resolver"
        TicketEstadoService.crear_comentario(ticket.id, texto, id_analista=user_id)
        
        db.session.commit()
        time.sleep(0.1)
        return ticket, None

    # ==================== ACCIONES DE SUPERVISOR ====================
    @staticmethod
    def supervisor_cerrar_ticket(ticket, user_id):
        """Supervisor cierra un ticket"""
        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        
        if estado_actual not in [TicketState.SOLUCIONADO.value, TicketState.REABIERTO.value]:
            return None, "Solo se pueden cerrar tickets solucionados o reabiertos"
        
        ticket.estado = TicketState.CERRADO.value
        ticket.fecha_cierre = datetime.now()
        
        TicketEstadoService.crear_comentario(
            ticket.id,
            f"Ticket cerrado por supervisor desde estado '{estado_actual}'",
            id_supervisor=user_id
        )
        
        db.session.commit()
        return ticket, None

    @staticmethod
    def supervisor_reabrir_ticket(ticket, user_id):
        """Supervisor reabre un ticket"""
        estado_actual = TicketEstadoService.normalizar_estado(ticket.estado)
        
        estados_permitidos = [TicketState.CERRADO.value, TicketState.SOLUCIONADO.value]
        if estado_actual not in estados_permitidos and not estado_actual.startswith(TicketState.CERRADO.value):
            return None, "Solo se pueden reabrir tickets cerrados o solucionados"
        
        ticket.estado = TicketState.EN_ESPERA.value
        ticket.fecha_cierre = None
        
        # CRÍTICO: Limpiar el flag de solicitud de reapertura
        ticket.tiene_solicitud_reapertura_pendiente = False
        
        # Si estaba solucionado, eliminar asignaciones anteriores
        asignaciones_eliminadas = 0
        if estado_actual == TicketState.SOLUCIONADO.value:
            asignaciones_anteriores = Asignacion.query.filter_by(id_ticket=ticket.id).all()
            asignaciones_eliminadas = len(asignaciones_anteriores)
            for asignacion in asignaciones_anteriores:
                db.session.delete(asignacion)
        
        texto = "Ticket reabierto por supervisor - Listo para nueva asignación" if estado_actual == TicketState.CERRADO.value else "Supervisor aprobó solicitud de reapertura - Asignaciones anteriores eliminadas, listo para nueva asignación"
        TicketEstadoService.crear_comentario(ticket.id, texto, id_supervisor=user_id)
        
        print(f"[DEBUG] Supervisor reabriendo ticket {ticket.id}, estado actual: {estado_actual}")
        print(f"[DEBUG] Asignaciones eliminadas: {asignaciones_eliminadas}")
        print(f"[DEBUG] Flag tiene_solicitud_reapertura_pendiente limpiado: {ticket.tiene_solicitud_reapertura_pendiente}")
        
        db.session.commit()
        return ticket, None

    # ==================== ACCIONES DE ADMINISTRADOR ====================
    @staticmethod
    def admin_cambiar_estado(ticket, nuevo_estado):
        """Administrador cambia estado de ticket (sin restricciones)"""
        ticket.estado = nuevo_estado
        
        nuevo_estado_lower = TicketEstadoService.normalizar_estado(nuevo_estado)
        if nuevo_estado_lower == TicketState.CERRADO.value:
            ticket.fecha_cierre = datetime.now()
        elif nuevo_estado_lower == TicketState.REABIERTO.value:
            ticket.fecha_cierre = None
        
        db.session.commit()
        return ticket, None

    # ==================== HELPERS PARA WEBSOCKET ====================
    @staticmethod
    def build_ticket_event_data(ticket, tipo, user_id=None, user_role=None, estado_anterior=None):
        """
        Construir datos para evento WebSocket.
        SIEMPRE incluye ticket completo para mantener consistencia.
        """
        data = {
            'ticket_id': ticket.id,
            'ticket': ticket.serialize(),  # SIEMPRE incluir ticket completo
            'ticket_estado': ticket.estado,
            'ticket_titulo': ticket.titulo,
            'ticket_prioridad': ticket.prioridad,
            'cliente_id': ticket.id_cliente,
            'tipo': tipo,
            'timestamp': datetime.now().isoformat()
        }
        
        if user_id:
            if user_role == 'analista':
                data['analista_id'] = user_id
            elif user_role == 'supervisor':
                data['supervisor_id'] = user_id
        
        if estado_anterior:
            data['estado_anterior'] = estado_anterior
        
        return data
