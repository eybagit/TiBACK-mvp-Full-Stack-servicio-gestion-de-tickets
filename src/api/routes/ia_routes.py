"""
Rutas de IA: tickets similares, recomendaciones IA y análisis de imágenes con Cloud Vision
"""
import os
import json
import requests
from datetime import datetime
from flask import Blueprint, request, jsonify

from api.models import db, Ticket
from api.jwt_utils import require_auth, get_user_from_token

ia_bp = Blueprint('ia', __name__)


@ia_bp.route('/tickets/<int:ticket_id>/recomendaciones-similares', methods=['GET'])
@require_auth
def obtener_tickets_similares(ticket_id):
    """Obtener tickets similares basados en algoritmo robusto de similitud semántica"""
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
        
        tickets_cerrados = Ticket.query.filter(
            Ticket.estado == 'cerrado',
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
        
        def calcular_similitud_robusta(titulo1, descripcion1, titulo2, descripcion2):
            import re
            from difflib import SequenceMatcher
            
            def limpiar_texto(texto):
                if not texto:
                    return ""
                texto_limpio = re.sub(r'[^\w\s]', ' ', str(texto).lower())
                texto_limpio = re.sub(r'\s+', ' ', texto_limpio).strip()
                return texto_limpio
            
            texto1 = limpiar_texto(titulo1) + " " + limpiar_texto(descripcion1)
            texto2 = limpiar_texto(titulo2) + " " + limpiar_texto(descripcion2)
            
            if not texto1 or not texto2:
                return 0
            
            palabras_vacias = {'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'como', 'pero', 'sus', 'muy', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'durante', 'mediante', 'según', 'ante', 'bajo', 'contra', 'hacia', 'tras', 'durante', 'excepto', 'salvo', 'menos', 'más', 'todo', 'todos', 'toda', 'todas', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras'}
            
            palabras1 = set([p for p in texto1.split() if len(p) > 2 and p not in palabras_vacias])
            palabras2 = set([p for p in texto2.split() if len(p) > 2 and p not in palabras_vacias])
            
            if not palabras1 or not palabras2:
                return 0
            
            interseccion = palabras1.intersection(palabras2)
            union = palabras1.union(palabras2)
            jaccard = len(interseccion) / len(union) if union else 0
            
            palabras1_list = list(palabras1)
            palabras2_list = list(palabras2)
            similitud_secuencia = 0
            coincidencias = 0
            
            for p1 in palabras1_list:
                mejor_similitud = 0
                for p2 in palabras2_list:
                    sim = SequenceMatcher(None, p1, p2).ratio()
                    if sim > mejor_similitud:
                        mejor_similitud = sim
                if mejor_similitud > 0.8:
                    coincidencias += mejor_similitud
            
            similitud_secuencia = coincidencias / len(palabras1_list) if palabras1_list else 0
            
            titulo1_limpio = limpiar_texto(titulo1)
            titulo2_limpio = limpiar_texto(titulo2)
            similitud_titulo = SequenceMatcher(None, titulo1_limpio, titulo2_limpio).ratio()
            
            desc1_limpio = limpiar_texto(descripcion1)
            desc2_limpio = limpiar_texto(descripcion2)
            similitud_descripcion = SequenceMatcher(None, desc1_limpio, desc2_limpio).ratio()
            
            similitud_final = (
                jaccard * 0.3 +
                similitud_secuencia * 0.2 +
                similitud_titulo * 0.3 +
                similitud_descripcion * 0.2
            )
            
            return min(1.0, similitud_final)
        
        tickets_con_similitud = []
        for ticket in tickets_cerrados:
            try:
                if not ticket.titulo or not ticket.descripcion:
                    continue
                
                similitud = calcular_similitud_robusta(
                    ticket_actual.titulo, ticket_actual.descripcion,
                    ticket.titulo, ticket.descripcion
                )
                
                if similitud > 0.05:
                    ticket_data = ticket.serialize()
                    ticket_data['similitud'] = round(similitud, 4)
                    ticket_data['nivel_similitud'] = (
                        'Alta' if similitud > 0.3 else
                        'Media' if similitud > 0.15 else
                        'Baja'
                    )
                    tickets_con_similitud.append(ticket_data)
                    
            except Exception as e:
                print(f"Error calculando similitud para ticket {ticket.id}: {str(e)}")
                continue
        
        tickets_con_similitud.sort(key=lambda x: x['similitud'], reverse=True)
        tickets_similares = tickets_con_similitud[:8]
        
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
@require_auth
def generar_recomendacion_ia(ticket_id):
    """Generar recomendación usando OpenAI basada en el título y descripción del ticket"""
    try:
        ticket = Ticket.query.get(ticket_id)
        if not ticket:
            return jsonify({"message": "Ticket no encontrado"}), 404

        user = get_user_from_token()
        if not user:
            return jsonify({"message": "Token inválido o expirado"}), 401

        user_id = user['id']
        user_role = user['role']

        if (user_role == 'cliente' and ticket.id_cliente != user_id) and \
           (user_role == 'analista' and not any(a.id_analista == user_id for a in ticket.asignaciones)) and \
           user_role not in ['supervisor', 'administrador']:
            return jsonify({"message": "No tienes permisos para ver este ticket"}), 403

        api_key = os.getenv('API_KEY_IA')
        
        if not api_key or api_key.strip() == '' or api_key == 'clave api':
            recomendacion_basica = {
                "diagnostico": f"Análisis del ticket: {ticket.titulo}. {ticket.descripcion[:200]}...",
                "pasos_solucion": [
                    "1. Revisar la descripción del problema detalladamente",
                    "2. Verificar si es un problema conocido en la base de conocimientos",
                    "3. Consultar con el equipo técnico especializado",
                    "4. Probar soluciones estándar según el tipo de problema",
                    "5. Documentar la solución encontrada"
                ],
                "tiempo_estimado": "2-4 horas",
                "recursos_necesarios": [
                    "Acceso a la base de conocimientos",
                    "Herramientas de diagnóstico",
                    "Colaboración con el equipo técnico"
                ],
                "nivel_dificultad": "Media",
                "recomendaciones_adicionales": "Para obtener recomendaciones más específicas con IA, configure una API Key válida de OpenAI en las variables de entorno."
            }

            return jsonify({
                "message": "Recomendación generada (modo básico)",
                "recomendacion": recomendacion_basica,
                "ticket_id": ticket_id
            }), 200

        prompt = f"""
        Como experto en soporte técnico, analiza el siguiente ticket y proporciona una recomendación detallada para resolver el problema.
        
        Título del ticket: {ticket.titulo}
        Descripción: {ticket.descripcion}
        Prioridad: {ticket.prioridad}
        Estado actual: {ticket.estado}
        
        Por favor, proporciona una recomendación estructurada en formato JSON con los siguientes campos:
        - diagnostico: Un análisis del problema identificado
        - pasos_solucion: Array de pasos específicos para resolver el problema
        - tiempo_estimado: Tiempo estimado para resolver (en horas)
        - recursos_necesarios: Lista de recursos o herramientas necesarias
        - nivel_dificultad: Baja, Media o Alta
        - recomendaciones_adicionales: Consejos adicionales o mejores prácticas
        
        Responde únicamente con el JSON, sin texto adicional.
        """

        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        data = {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role': 'system',
                    'content': 'Eres un experto en soporte técnico especializado en resolver problemas de tickets. Responde siempre en formato JSON válido.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'max_tokens': 1000,
            'temperature': 0.7
        }

        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )

        if response.status_code != 200:
            error_message = f"Error en la API de OpenAI: {response.status_code}"
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_message += f" - {error_data['error'].get('message', 'Error desconocido')}"
            except:
                error_message += f" - {response.text}"

            return jsonify({
                "message": error_message,
                "error": response.text
            }), 500

        try:
            openai_response = response.json()
            if 'choices' not in openai_response or len(openai_response['choices']) == 0:
                raise ValueError("Respuesta de OpenAI sin contenido")

            recomendacion_texto = openai_response['choices'][0]['message']['content'].strip()
            if not recomendacion_texto:
                raise ValueError("Respuesta de OpenAI vacía")
        except (KeyError, ValueError, IndexError) as e:
            return jsonify({
                "message": f"Error procesando respuesta de OpenAI: {str(e)}",
                "error": "Respuesta de API inválida"
            }), 500

        try:
            recomendacion_json = json.loads(recomendacion_texto)
        except json.JSONDecodeError:
            recomendacion_json = {
                "diagnostico": "Análisis generado por IA",
                "pasos_solucion": [recomendacion_texto],
                "tiempo_estimado": "No especificado",
                "recursos_necesarios": ["Consultar con el equipo técnico"],
                "nivel_dificultad": "Media",
                "recomendaciones_adicionales": "Revisar la respuesta generada por la IA"
            }

        return jsonify({
            "message": "Recomendación generada exitosamente",
            "recomendacion": recomendacion_json,
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
        cloud_vision_api_key = os.getenv('CLOUD_VISION_API')
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        
        return jsonify({
            "cloud_vision_configured": bool(cloud_vision_api_key),
            "cloudinary_configured": bool(cloudinary_url),
            "cloud_vision_key_length": len(cloud_vision_api_key) if cloud_vision_api_key else 0,
            "cloudinary_url_length": len(cloudinary_url) if cloudinary_url else 0,
            "message": "Configuración verificada"
        }), 200
    except Exception as e:
        return jsonify({
            "message": "Error verificando configuración",
            "error": str(e)
        }), 500


@ia_bp.route('/analyze-image', methods=['POST'])
@require_auth
def analyze_image():
    """Analizar imagen usando Google Cloud Vision API"""
    try:
        from google.cloud import vision
        
        if 'image' not in request.files:
            return jsonify({"message": "No se encontró archivo de imagen"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"message": "No se seleccionó archivo"}), 400
        
        ticket_id = request.form.get('ticket_id')
        use_ticket_context = request.form.get('use_ticket_context', 'true').lower() == 'true'
        ticket_title = request.form.get('ticket_title', '')
        ticket_description = request.form.get('ticket_description', '')
        
        cloud_vision_api_key = os.getenv('CLOUD_VISION_API')
        if not cloud_vision_api_key:
            return jsonify({
                "message": "Cloud Vision API no configurada",
                "error": "CLOUD_VISION_API no está definida en las variables de entorno"
            }), 500
        
        try:
            client = vision.ImageAnnotatorClient(
                client_options={'api_key': cloud_vision_api_key}
            )
        except Exception as e:
            return jsonify({
                "message": "Error configurando Cloud Vision API",
                "error": str(e)
            }), 500
        
        image_content = file.read()
        image = vision.Image(content=image_content)
        
        features = [
            vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION),
            vision.Feature(type_=vision.Feature.Type.TEXT_DETECTION),
            vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION),
            vision.Feature(type_=vision.Feature.Type.IMAGE_PROPERTIES)
        ]
        
        response = client.annotate_image({
            'image': image,
            'features': features
        })
        
        labels = []
        if response.label_annotations:
            labels = [
                {
                    'description': label.description,
                    'score': label.score,
                    'mid': label.mid
                }
                for label in response.label_annotations
            ]
        
        text_detections = []
        if response.text_annotations:
            text_detections = [
                {
                    'description': text.description,
                    'locale': text.locale,
                    'bounding_poly': [
                        {'x': vertex.x, 'y': vertex.y}
                        for vertex in text.bounding_poly.vertices
                    ] if text.bounding_poly else []
                }
                for text in response.text_annotations
            ]
        
        objects = []
        if response.localized_object_annotations:
            objects = [
                {
                    'name': obj.name,
                    'score': obj.score,
                    'bounding_poly': [
                        {'x': vertex.x, 'y': vertex.y}
                        for vertex in obj.bounding_poly.normalized_vertices
                    ]
                }
                for obj in response.localized_object_annotations
            ]
        
        # Generar análisis básico
        analysis_text = f"Análisis de la imagen para el ticket #{ticket_id}. "
        
        if labels:
            top_labels = sorted(labels, key=lambda x: x['score'], reverse=True)[:5]
            elements = [label['description'] for label in top_labels]
            analysis_text += f"Elementos detectados: {', '.join(elements)}. "
        
        if text_detections:
            analysis_text += f"Se detectó texto en la imagen. "
        
        return jsonify({
            "message": "Análisis completado exitosamente",
            "analysis": analysis_text,
            "labels": labels,
            "text_detections": text_detections,
            "objects": objects,
            "ticket_id": ticket_id
        }), 200
        
    except Exception as e:
        return jsonify({
            "message": "Error al analizar la imagen",
            "error": str(e)
        }), 500
