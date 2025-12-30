"""
Rutas de Dashboard: mapa de calor y reportes
"""
from flask import Blueprint, jsonify

from api.models import db, Ticket, Cliente
from api.jwt_utils import require_auth, require_role

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/heatmap-data', methods=['GET'])
@require_role(['supervisor', 'administrador'])
def get_heatmap_data():
    """Obtener datos de coordenadas de tickets para el mapa de calor"""
    try:
        tickets = db.session.query(Ticket, Cliente).join(
            Cliente, Ticket.id_cliente == Cliente.id
        ).filter(
            Cliente.latitude.isnot(None),
            Cliente.longitude.isnot(None)
        ).all()
        
        heatmap_data = []
        for ticket, cliente in tickets:
            try:
                lat = float(cliente.latitude)
                lng = float(cliente.longitude)
                
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    heatmap_data.append({
                        'lat': lat,
                        'lng': lng,
                        'ticket_id': ticket.id,
                        'ticket_titulo': ticket.titulo,
                        'ticket_descripcion': ticket.descripcion or 'Sin descripción',
                        'ticket_estado': ticket.estado,
                        'ticket_prioridad': ticket.prioridad,
                        'ticket_fecha_creacion': ticket.fecha_creacion.isoformat() if ticket.fecha_creacion else None,
                        'cliente_nombre': cliente.nombre,
                        'cliente_apellido': cliente.apellido,
                        'cliente_email': cliente.email,
                        'cliente_direccion': cliente.direccion or 'Dirección no disponible',
                        'cliente_telefono': cliente.telefono,
                        'cliente_id': cliente.id
                    })
            except (ValueError, TypeError):
                continue
        
        return jsonify({
            "message": "Datos de mapa de calor de tickets obtenidos exitosamente",
            "data": heatmap_data,
            "total_points": len(heatmap_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Error al obtener datos del mapa de calor",
            "error": str(e)
        }), 500
