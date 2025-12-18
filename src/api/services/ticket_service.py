"""
TicketService - Lógica de negocio para tickets
Según documentacion/modular.md: Servicios contienen lógica de negocio pura.
"""
import time
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from api.models import db, Ticket, Analista, Asignacion, Comentarios, Gestion


class TicketService:
    """Servicio para operaciones de tickets"""

    @staticmethod
    def get_all_tickets():
        """Obtener todos los tickets serializados"""
        tickets = Ticket.query.all()
        serialized = []
        for ticket in tickets:
            try:
                serialized.append(ticket.serialize())
            except Exception as e:
                serialized.append(TicketService._serialize_fallback(ticket))
        return serialized

    @staticmethod
    def _serialize_fallback(ticket):
        """Serialización de respaldo en caso de error"""
        return {
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
        }

    @staticmethod
    def create_ticket_for_cliente(cliente_id, titulo, descripcion, prioridad, url_imagen=None):
        """Crear ticket para un cliente"""
        ticket = Ticket(
            id_cliente=cliente_id,
            estado="en espera",
            titulo=titulo,
            descripcion=descripcion,
            fecha_creacion=datetime.now(),
            prioridad=prioridad,
            url_imagen=url_imagen
        )
        db.session.add(ticket)
        db.session.commit()
        return ticket

    @staticmethod
    def create_ticket_admin(data):
        """Crear ticket como administrador"""
        ticket = Ticket(
            id_cliente=data["id_cliente"],
            estado=data["estado"],
            titulo=data["titulo"],
            descripcion=data["descripcion"],
            fecha_creacion=datetime.fromisoformat(data["fecha_creacion"]),
            prioridad=data["prioridad"],
            url_imagen=data.get("url_imagen")
        )
        db.session.add(ticket)
        db.session.commit()
        return ticket

    @staticmethod
    def get_ticket_by_id(ticket_id):
        """Obtener ticket por ID"""
        return db.session.get(Ticket, ticket_id)

    @staticmethod
    def update_ticket(ticket, data):
        """Actualizar campos de un ticket"""
        date_fields = ["fecha_creacion", "fecha_cierre", "fecha_evaluacion"]
        updatable_fields = [
            "id_cliente", "estado", "titulo", "descripcion",
            "prioridad", "calificacion", "comentario", "url_imagen"
        ] + date_fields

        for field in updatable_fields:
            if field in data:
                value = data[field]
                if field in date_fields and value:
                    value = datetime.fromisoformat(value)
                setattr(ticket, field, value)
        
        db.session.commit()
        return ticket

    @staticmethod
    def delete_ticket(ticket_id):
        """Eliminar ticket y sus relaciones"""
        ticket = db.session.get(Ticket, ticket_id)
        if not ticket:
            return None, "Ticket no encontrado"

        ticket_info = {
            'id': ticket.id,
            'id_cliente': ticket.id_cliente,
            'titulo': ticket.titulo,
            'estado': ticket.estado
        }

        analista_id = TicketService._get_assigned_analista_id(ticket)

        # Eliminar relaciones
        Asignacion.query.filter_by(id_ticket=ticket_id).delete()
        Comentarios.query.filter_by(id_ticket=ticket_id).delete()
        Gestion.query.filter_by(id_ticket=ticket_id).delete()

        db.session.delete(ticket)
        db.session.commit()

        return ticket_info, analista_id

    @staticmethod
    def _get_assigned_analista_id(ticket):
        """Obtener ID del analista asignado"""
        try:
            if hasattr(ticket, 'asignaciones') and ticket.asignaciones:
                asignacion = max(ticket.asignaciones, key=lambda x: x.fecha_asignacion)
                return asignacion.id_analista
        except Exception:
            pass
        return None

    @staticmethod
    def evaluar_ticket(ticket_id, cliente_id, calificacion, comentario=''):
        """Evaluar un ticket cerrado"""
        ticket = db.session.get(Ticket, ticket_id)
        if not ticket:
            return None, "Ticket no encontrado"

        if ticket.id_cliente != cliente_id:
            return None, "No tienes permisos para evaluar este ticket"

        estado_normalizado = ticket.estado.lower().replace('_', ' ')
        if estado_normalizado != 'cerrado':
            return None, "Solo se pueden evaluar tickets cerrados"

        ticket.calificacion = calificacion
        ticket.comentario = comentario
        ticket.fecha_evaluacion = datetime.now()
        db.session.commit()

        return ticket, None

    @staticmethod
    def get_asignacion_status(ticket_id):
        """Obtener estado de asignación de un ticket"""
        ticket = db.session.get(Ticket, ticket_id)
        if not ticket:
            return None, "Ticket no encontrado"

        asignaciones = Asignacion.query.filter_by(id_ticket=ticket_id).all()

        if not asignaciones:
            return {
                "tiene_asignacion": False,
                "accion": "asignar",
                "ticket": ticket.serialize()
            }, None
        else:
            asignacion = max(asignaciones, key=lambda x: x.fecha_asignacion)
            return {
                "tiene_asignacion": True,
                "accion": "reasignar",
                "asignacion_actual": asignacion.serialize(),
                "ticket": ticket.serialize()
            }, None

    @staticmethod
    def asignar_ticket(ticket_id, supervisor_id, analista_id, comentario=None, es_reasignacion=False):
        """Asignar o reasignar ticket a un analista"""
        ticket = db.session.get(Ticket, ticket_id)
        if not ticket:
            return None, None, "Ticket no encontrado"

        analista = db.session.get(Analista, analista_id)
        if not analista:
            return None, None, "Analista no encontrado"

        estados_validos = ['en espera', 'reabierto']
        estado_normalizado = ticket.estado.lower().replace('_', ' ')
        if estado_normalizado not in estados_validos:
            return None, None, f"El ticket no puede ser asignado en estado '{ticket.estado}'"

        # Eliminar asignaciones anteriores
        Asignacion.query.filter_by(id_ticket=ticket_id).delete()

        # Crear nueva asignación
        asignacion = Asignacion(
            id_ticket=ticket_id,
            id_supervisor=supervisor_id,
            id_analista=analista_id,
            fecha_asignacion=datetime.now()
        )
        ticket.estado = 'en espera'
        db.session.add(asignacion)

        # Agregar comentario de asignación
        accion_texto = f"Ticket {'reasignado' if es_reasignacion else 'asignado'} a {analista.nombre} {analista.apellido}"
        comentario_asignacion = Comentarios(
            id_ticket=ticket_id,
            id_supervisor=supervisor_id,
            texto=accion_texto,
            fecha_comentario=datetime.now()
        )
        db.session.add(comentario_asignacion)

        if comentario:
            nuevo_comentario = Comentarios(
                id_ticket=ticket_id,
                id_supervisor=supervisor_id,
                texto=comentario,
                fecha_comentario=datetime.now()
            )
            db.session.add(nuevo_comentario)

        db.session.commit()
        time.sleep(0.1)

        return ticket, asignacion, None
