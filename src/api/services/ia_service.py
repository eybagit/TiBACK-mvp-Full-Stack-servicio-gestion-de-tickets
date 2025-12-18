"""
IAService - Lógica de negocio para IA y análisis
Según documentacion/modular.md: Servicios contienen lógica de negocio pura.
"""
import os
import json
import re
import requests
from difflib import SequenceMatcher


class IAService:
    """Servicio para operaciones de IA y análisis de tickets"""

    PALABRAS_VACIAS = {
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 
        'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 
        'las', 'una', 'como', 'pero', 'sus', 'muy', 'sin', 'sobre', 'entre', 
        'hasta', 'desde', 'durante', 'mediante', 'según', 'ante', 'bajo', 
        'contra', 'hacia', 'tras', 'excepto', 'salvo', 'menos', 'más', 'todo', 
        'todos', 'toda', 'todas', 'este', 'esta', 'estos', 'estas', 'ese', 
        'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas', 
        'mi', 'mis', 'tu', 'tus', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 
        'vuestro', 'vuestra', 'vuestros', 'vuestras'
    }

    @staticmethod
    def limpiar_texto(texto):
        """Limpiar y normalizar texto para análisis"""
        if not texto:
            return ""
        texto_limpio = re.sub(r'[^\w\s]', ' ', str(texto).lower())
        texto_limpio = re.sub(r'\s+', ' ', texto_limpio).strip()
        return texto_limpio

    @staticmethod
    def calcular_similitud_robusta(titulo1, descripcion1, titulo2, descripcion2):
        """Calcular similitud semántica entre dos tickets"""
        texto1 = IAService.limpiar_texto(titulo1) + " " + IAService.limpiar_texto(descripcion1)
        texto2 = IAService.limpiar_texto(titulo2) + " " + IAService.limpiar_texto(descripcion2)
        
        if not texto1 or not texto2:
            return 0
        
        palabras1 = set([p for p in texto1.split() if len(p) > 2 and p not in IAService.PALABRAS_VACIAS])
        palabras2 = set([p for p in texto2.split() if len(p) > 2 and p not in IAService.PALABRAS_VACIAS])
        
        if not palabras1 or not palabras2:
            return 0
        
        # Similitud Jaccard
        interseccion = palabras1.intersection(palabras2)
        union = palabras1.union(palabras2)
        jaccard = len(interseccion) / len(union) if union else 0
        
        # Similitud por secuencia
        palabras1_list = list(palabras1)
        palabras2_list = list(palabras2)
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
        
        # Similitud de título y descripción
        titulo1_limpio = IAService.limpiar_texto(titulo1)
        titulo2_limpio = IAService.limpiar_texto(titulo2)
        similitud_titulo = SequenceMatcher(None, titulo1_limpio, titulo2_limpio).ratio()
        
        desc1_limpio = IAService.limpiar_texto(descripcion1)
        desc2_limpio = IAService.limpiar_texto(descripcion2)
        similitud_descripcion = SequenceMatcher(None, desc1_limpio, desc2_limpio).ratio()
        
        # Ponderación final
        similitud_final = (
            jaccard * 0.3 +
            similitud_secuencia * 0.2 +
            similitud_titulo * 0.3 +
            similitud_descripcion * 0.2
        )
        
        return min(1.0, similitud_final)

    @staticmethod
    def obtener_nivel_similitud(similitud):
        """Obtener nivel de similitud textual"""
        if similitud > 0.3:
            return 'Alta'
        elif similitud > 0.15:
            return 'Media'
        return 'Baja'

    @staticmethod
    def buscar_tickets_similares(ticket_actual, tickets_cerrados, umbral=0.05, limite=8):
        """Buscar tickets similares al ticket actual"""
        if not ticket_actual.titulo or not ticket_actual.descripcion:
            return [], "Ticket sin contenido suficiente para análisis"
        
        tickets_con_similitud = []
        
        for ticket in tickets_cerrados:
            try:
                if not ticket.titulo or not ticket.descripcion:
                    continue
                
                similitud = IAService.calcular_similitud_robusta(
                    ticket_actual.titulo, ticket_actual.descripcion,
                    ticket.titulo, ticket.descripcion
                )
                
                if similitud > umbral:
                    ticket_data = ticket.serialize()
                    ticket_data['similitud'] = round(similitud, 4)
                    ticket_data['nivel_similitud'] = IAService.obtener_nivel_similitud(similitud)
                    tickets_con_similitud.append(ticket_data)
                    
            except Exception as e:
                print(f"Error calculando similitud para ticket {ticket.id}: {str(e)}")
                continue
        
        tickets_con_similitud.sort(key=lambda x: x['similitud'], reverse=True)
        return tickets_con_similitud[:limite], None

    @staticmethod
    def generar_recomendacion_basica(ticket):
        """Generar recomendación básica sin API de IA"""
        return {
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
            "recomendaciones_adicionales": "Para obtener recomendaciones más específicas con IA, configure una API Key válida de OpenAI."
        }

    @staticmethod
    def generar_recomendacion_openai(ticket, api_key):
        """Generar recomendación usando OpenAI"""
        prompt = f"""
        Como experto en soporte técnico, analiza el siguiente ticket y proporciona una recomendación detallada.
        
        Título del ticket: {ticket.titulo}
        Descripción: {ticket.descripcion}
        Prioridad: {ticket.prioridad}
        Estado actual: {ticket.estado}
        
        Proporciona una recomendación estructurada en formato JSON con:
        - diagnostico: Análisis del problema identificado
        - pasos_solucion: Array de pasos específicos para resolver
        - tiempo_estimado: Tiempo estimado en horas
        - recursos_necesarios: Lista de recursos o herramientas
        - nivel_dificultad: Baja, Media o Alta
        - recomendaciones_adicionales: Consejos adicionales
        
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
                    'content': 'Eres un experto en soporte técnico. Responde siempre en formato JSON válido.'
                },
                {'role': 'user', 'content': prompt}
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
            error_msg = f"Error en la API de OpenAI: {response.status_code}"
            try:
                error_data = response.json()
                if 'error' in error_data:
                    error_msg += f" - {error_data['error'].get('message', 'Error desconocido')}"
            except:
                error_msg += f" - {response.text}"
            return None, error_msg

        try:
            openai_response = response.json()
            if 'choices' not in openai_response or len(openai_response['choices']) == 0:
                return None, "Respuesta de OpenAI sin contenido"

            recomendacion_texto = openai_response['choices'][0]['message']['content'].strip()
            if not recomendacion_texto:
                return None, "Respuesta de OpenAI vacía"
        except (KeyError, ValueError, IndexError) as e:
            return None, f"Error procesando respuesta de OpenAI: {str(e)}"

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

        return recomendacion_json, None

    @staticmethod
    def get_cloud_vision_status():
        """Obtener estado de configuración de Cloud Vision"""
        cloud_vision_api_key = os.getenv('CLOUD_VISION_API')
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        
        return {
            "cloud_vision_configured": bool(cloud_vision_api_key),
            "cloudinary_configured": bool(cloudinary_url),
            "cloud_vision_key_length": len(cloud_vision_api_key) if cloud_vision_api_key else 0,
            "cloudinary_url_length": len(cloudinary_url) if cloudinary_url else 0
        }

    @staticmethod
    def analizar_imagen_cloud_vision(image_content, ticket_id=None):
        """Analizar imagen usando Google Cloud Vision API"""
        from google.cloud import vision
        
        cloud_vision_api_key = os.getenv('CLOUD_VISION_API')
        if not cloud_vision_api_key:
            return None, "Cloud Vision API no configurada"
        
        try:
            client = vision.ImageAnnotatorClient(
                client_options={'api_key': cloud_vision_api_key}
            )
        except Exception as e:
            return None, f"Error configurando Cloud Vision API: {str(e)}"
        
        image = vision.Image(content=image_content)
        
        features = [
            vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION),
            vision.Feature(type_=vision.Feature.Type.TEXT_DETECTION),
            vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION),
            vision.Feature(type_=vision.Feature.Type.IMAGE_PROPERTIES)
        ]
        
        response = client.annotate_image({'image': image, 'features': features})
        
        # Procesar labels
        labels = []
        if response.label_annotations:
            labels = [
                {'description': label.description, 'score': label.score, 'mid': label.mid}
                for label in response.label_annotations
            ]
        
        # Procesar texto detectado
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
        
        # Procesar objetos
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
        
        # Generar análisis
        analysis_text = f"Análisis de la imagen para el ticket #{ticket_id}. " if ticket_id else "Análisis de imagen. "
        
        if labels:
            top_labels = sorted(labels, key=lambda x: x['score'], reverse=True)[:5]
            elements = [label['description'] for label in top_labels]
            analysis_text += f"Elementos detectados: {', '.join(elements)}. "
        
        if text_detections:
            analysis_text += "Se detectó texto en la imagen. "
        
        return {
            "analysis": analysis_text,
            "labels": labels,
            "text_detections": text_detections,
            "objects": objects,
            "ticket_id": ticket_id
        }, None
