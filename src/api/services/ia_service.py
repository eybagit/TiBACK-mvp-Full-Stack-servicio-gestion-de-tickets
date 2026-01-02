"""
IAService - Lógica de negocio para IA y análisis
Según documentacion/modular.md: Servicios contienen lógica de negocio pura.
"""
import os
import json
import re
import base64
import requests
from difflib import SequenceMatcher
import google.generativeai as genai

# Modelos Gemini para IA unificada
IMAGE_MODEL = "gemini-2.5-flash-image"
TEXT_MODEL = "gemini-2.5-flash"


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
    def generar_recomendacion_gemini(ticket, api_key):
        """Generar recomendación usando Google Gemini"""
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(TEXT_MODEL)
            
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
            
            response = model.generate_content(prompt)
            recomendacion_texto = response.text.strip()
            
            # Limpiar posibles marcadores de código markdown
            if recomendacion_texto.startswith('```'):
                lines = recomendacion_texto.split('\n')
                recomendacion_texto = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
            
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
            
        except Exception as e:
            return None, f"Error en Gemini API: {str(e)}"

    @staticmethod
    def get_gemini_status():
        """Obtener estado de configuración de Gemini API"""
        google_api_key = os.getenv('GOOGLE_API_KEY')
        cloudinary_url = os.getenv('CLOUDINARY_URL')
        
        return {
            "gemini_configured": bool(google_api_key),
            "cloudinary_configured": bool(cloudinary_url),
            "gemini_key_length": len(google_api_key) if google_api_key else 0,
            "cloudinary_url_length": len(cloudinary_url) if cloudinary_url else 0,
            "image_model": IMAGE_MODEL,
            "text_model": TEXT_MODEL
        }

    @staticmethod
    def analizar_imagen_gemini(image_content, ticket_id=None, ticket_title=None, ticket_description=None, additional_details=None):
        """Analizar imagen usando Google Gemini API con contexto del ticket"""
        google_api_key = os.getenv('GOOGLE_API_KEY')
        if not google_api_key:
            return None, "Gemini API no configurada (GOOGLE_API_KEY)"
        
        try:
            genai.configure(api_key=google_api_key)
            model = genai.GenerativeModel(IMAGE_MODEL)
            
            # Convertir imagen a base64
            image_data = base64.b64encode(image_content).decode('utf-8')
            
            # Construir contexto
            context = ""
            if ticket_title:
                context += f"Título del problema: {ticket_title}\n"
            if ticket_description:
                context += f"Descripción reportada: {ticket_description}\n"
            if additional_details:
                context += f"Detalles adicionales: {additional_details}\n"
            
            prompt = f"""Eres un asistente técnico experto. Analiza esta imagen en el contexto de un ticket de soporte.

CONTEXTO DEL TICKET:
{context if context else "No hay contexto adicional"}

TAREA:
1. Identifica el problema técnico visible en la imagen
2. Proporciona recomendaciones BREVES y PRÁCTICAS (máximo 3 pasos)
3. Sugiere 2-3 preguntas específicas que el cliente debería hacer al analista

FORMATO DE RESPUESTA (JSON):
{{
    "problema_detectado": "Descripción breve del problema visible (1-2 oraciones)",
    "recomendaciones": [
        "Paso 1 concreto y breve",
        "Paso 2 concreto y breve"
    ],
    "preguntas_para_analista": [
        "¿Pregunta específica 1?",
        "¿Pregunta específica 2?"
    ]
}}

IMPORTANTE: Sé BREVE y ESPECÍFICO. Responde SOLO con el JSON."""
            
            response = model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": image_data}
            ])
            
            response_text = response.text.strip()
            
            # Limpiar posibles marcadores de código markdown
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1] if lines[-1] == '```' else lines[1:])
            
            try:
                result_json = json.loads(response_text)
            except json.JSONDecodeError:
                result_json = {
                    "problema_detectado": response_text,
                    "recomendaciones": [],
                    "preguntas_para_analista": []
                }
            
            return {
                "analysis": result_json.get("problema_detectado", "Análisis no disponible"),
                "recomendaciones": result_json.get("recomendaciones", []),
                "preguntas_para_analista": result_json.get("preguntas_para_analista", []),
                "model_used": IMAGE_MODEL,
                "ticket_id": ticket_id
            }, None
            
        except Exception as e:
            return None, f"Error en Gemini API: {str(e)}"

