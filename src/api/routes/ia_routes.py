"""
Rutas de IA: tickets similares, recomendaciones IA y análisis de imágenes con Cloud Vision
Refactorizado para usar IAService según documentacion/modular.md
"""
import os
import requests
from flask import Blueprint, request, jsonify

from api.models import Ticket
from api.jwt_utils import require_auth, require_role, get_user_from_token
from api.services import IAService
from api.constants.ticket_enums import TicketState

ia_bp = Blueprint('ia', __name__)


@ia_bp.route('/tickets/<int:ticket_id>/recomendaciones-similares', methods=['GET'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def obtener_tickets_similares(ticket_id):
    """Obtener tickets similares basados en similitud semántica"""
    try:
        if not ticket_id or ticket_id <= 0:
            return jsonify({"message": "ID de ticket inválido"}), 400
            
        ticket_actual = Ticket.query.get(ticket_id)
        if not ticket_actual:
            return jsonify({"message": "Ticket no encontrado"}), 404
        
        if not ticket_actual.titulo or not ticket_actual.descripcion:
            return jsonify({
                "tickets_similares": [],
                "total_encontrados": 0,
                "ticket_actual": ticket_actual.serialize(),
                "mensaje": "Ticket sin contenido suficiente para análisis"
            }), 200
        
        # Obtener tickets cerrados para comparación
        tickets_cerrados = Ticket.query.filter(
            Ticket.estado == TicketState.CERRADO.value,
            Ticket.id != ticket_id,
            Ticket.titulo.isnot(None),
            Ticket.descripcion.isnot(None),
            Ticket.titulo != '',
            Ticket.descripcion != ''
        ).all()
        
        if not tickets_cerrados:
            return jsonify({
                "tickets_similares": [],
                "total_encontrados": 0,
                "ticket_actual": ticket_actual.serialize(),
                "mensaje": "No hay tickets cerrados disponibles para comparación"
            }), 200
        
        # Usar servicio para buscar similares
        tickets_similares, mensaje = IAService.buscar_tickets_similares(
            ticket_actual, tickets_cerrados
        )
        
        if mensaje:
            return jsonify({
                "tickets_similares": [],
                "total_encontrados": 0,
                "ticket_actual": ticket_actual.serialize(),
                "mensaje": mensaje
            }), 200
        
        if not tickets_similares:
            return jsonify({
                "tickets_similares": [],
                "total_encontrados": 0,
                "ticket_actual": ticket_actual.serialize(),
                "mensaje": "No se encontraron tickets con similitud suficiente"
            }), 200
        
        return jsonify({
            "tickets_similares": tickets_similares,
            "total_encontrados": len(tickets_similares),
            "ticket_actual": ticket_actual.serialize(),
            "algoritmo": "similitud_semantica_robusta_v2",
            "umbral_minimo": 0.05
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_tickets_similares: {str(e)}")
        return jsonify({"message": f"Error al obtener tickets similares: {str(e)}"}), 500


@ia_bp.route('/tickets/<int:ticket_id>/recomendacion-ia', methods=['POST'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def generar_recomendacion_ia(ticket_id):
    """Generar recomendación usando OpenAI"""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        user = get_user_from_token()
        if not user:
            return jsonify({"message": "Token inválido o expirado"}), 401

        # Verificar permisos
        user_id = user['id']
        user_role = user['role']

        if (user_role == 'cliente' and ticket.id_cliente != user_id) and \
           (user_role == 'analista' and not any(a.id_analista == user_id for a in ticket.asignaciones)) and \
           user_role not in ['supervisor', 'administrador']:
            return jsonify({"message": "No tienes permisos para ver este ticket"}), 403

        api_key = os.getenv('GOOGLE_API_KEY')
        
        # Si no hay API key, usar recomendación básica
        if not api_key or api_key.strip() == '':
            recomendacion = IAService.generar_recomendacion_basica(ticket)
            return jsonify({
                "message": "Recomendación generada (modo básico)",
                "recomendacion": recomendacion,
                "ticket_id": ticket_id
            }), 200

        # Usar Gemini
        recomendacion, error = IAService.generar_recomendacion_gemini(ticket, api_key)
        
        if error:
            return jsonify({"message": error, "error": error}), 500

        return jsonify({
            "message": "Recomendación generada exitosamente",
            "recomendacion": recomendacion,
            "ticket_id": ticket_id
        }), 200

    except requests.exceptions.Timeout:
        return jsonify({"message": "Timeout en la solicitud a OpenAI"}), 408
    except requests.exceptions.RequestException as e:
        return jsonify({"message": f"Error de conexión con OpenAI: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"message": f"Error interno: {str(e)}"}), 500


@ia_bp.route('/cloud-vision-status', methods=['GET'])
@require_auth
def cloud_vision_status():
    """Verificar estado de configuración de Cloud Vision API"""
    try:
        status = IAService.get_gemini_status()
        status["message"] = "Configuración verificada"
        return jsonify(status), 200
    except Exception as e:
        return jsonify({
            "message": "Error verificando configuración",
            "error": str(e)
        }), 500


@ia_bp.route('/analyze-image', methods=['POST'])
@require_role(['cliente', 'analista', 'supervisor', 'administrador'])
def analyze_image():
    """Analizar imagen usando Gemini API con contexto del ticket"""
    try:
        # Obtener datos del request
        ticket_id = request.form.get('ticket_id')
        ticket_title = request.form.get('ticket_title')
        ticket_description = request.form.get('ticket_description')
        additional_details = request.form.get('additional_details')
        
        # Verificar si hay imagen en archivos o usar imagen del ticket
        image_content = None
        
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                image_content = file.read()
        
        # Si no hay imagen subida, intentar usar la del ticket
        if not image_content and ticket_id:
            from api.models import Ticket
            ticket = Ticket.query.get(ticket_id)
            if ticket and ticket.url_imagen:
                # Descargar imagen desde Cloudinary
                import requests as http_requests
                try:
                    response = http_requests.get(ticket.url_imagen, timeout=10)
                    if response.status_code == 200:
                        image_content = response.content
                except Exception as e:
                    return jsonify({
                        "message": f"Error al descargar imagen del ticket: {str(e)}"
                    }), 500
        
        # Verificar que tenemos una imagen
        if not image_content:
            return jsonify({
                "message": "No se encontró imagen. El ticket no tiene imagen y no se subió ninguna."
            }), 400
        
        # Analizar imagen con contexto completo
        result, error = IAService.analizar_imagen_gemini(
            image_content, 
            ticket_id,
            ticket_title,
            ticket_description,
            additional_details
        )
        
        if error:
            return jsonify({"message": error, "error": error}), 500
        
        result["message"] = "Análisis completado exitosamente"
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "message": "Error al analizar la imagen",
            "error": str(e)
        }), 500
