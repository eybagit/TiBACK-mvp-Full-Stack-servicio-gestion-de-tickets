# 🔄 Plan de Migración: Unificación de APIs de IA con Gemini

> **Estado:** ✅ IMPLEMENTADO  
> **Fecha de implementación:** 02 de Enero, 2026

---

## 📋 Resumen de Cambios Realizados

### Variables Eliminadas:
| Variable | Uso Anterior | Servicio Anterior |
|----------|------------|----------|
| `CLOUD_VISION_API` | Análisis de imágenes | Google Cloud Vision |
| `API_KEY_IA` | Recomendaciones de tickets | OpenAI GPT-3.5-turbo |

### Nueva Variable Unificada:
```bash
GOOGLE_API_KEY=tu-google-api-key
```

### Modelos Gemini Implementados:
```python
IMAGE_MODEL = "gemini-2.5-flash-image"  # Para análisis de imágenes
TEXT_MODEL = "gemini-2.5-flash"          # Para generación de texto/recomendaciones
```

---

## ✅ Archivos Modificados

### 1. `src/api/services/ia_service.py`
- ✅ Agregado import `google.generativeai as genai`
- ✅ Agregado import `base64` para codificación de imágenes
- ✅ Definidas constantes `IMAGE_MODEL` y `TEXT_MODEL`
- ✅ `generar_recomendacion_openai()` → `generar_recomendacion_gemini()`
- ✅ `get_cloud_vision_status()` → `get_gemini_status()`
- ✅ `analizar_imagen_cloud_vision()` → `analizar_imagen_gemini()`

### 2. `src/api/routes/ia_routes.py`
- ✅ Línea 111: `API_KEY_IA` → `GOOGLE_API_KEY`
- ✅ Línea 123: Llamada a `generar_recomendacion_gemini`
- ✅ Línea 147: Llamada a `get_gemini_status`
- ✅ Línea 172: Llamada a `analizar_imagen_gemini`

### 3. `mapaDeDatos/env.md`
- ✅ Eliminadas secciones de `CLOUD_VISION_API` y `API_KEY_IA`
- ✅ Agregada nueva sección de `GOOGLE_API_KEY` con documentación de modelos
- ✅ Actualizada tabla resumen
- ✅ Actualizadas configuraciones de desarrollo y producción
- ✅ Actualizada sección de referencias

### 4. `Pipfile`
- ✅ `google-cloud-vision = "*"` → `google-generativeai = "*"`

---

## ⏳ Pasos Pendientes

### Instalar nueva dependencia:
```bash
pipenv install
```

### Configurar variable de entorno:
Agregar a tu archivo `.env`:
```bash
GOOGLE_API_KEY=tu-google-api-key
```

> **Nota:** Puedes obtener una API key de Gemini en: https://ai.google.dev/

---

## 🔄 Funciones Nuevas

### `generar_recomendacion_gemini(ticket, api_key)`
Genera recomendaciones para tickets usando el modelo `gemini-2.5-flash`.

### `get_gemini_status()`
Retorna el estado de configuración de la API de Gemini.

### `analizar_imagen_gemini(image_content, ticket_id=None)`
Analiza imágenes usando el modelo `gemini-2.5-flash-image`.

---

## ⚠️ Consideraciones

1. **Una sola API key:** Ahora solo necesitas `GOOGLE_API_KEY` en lugar de dos variables separadas
2. **Misma API, dos modelos:** El análisis de imágenes y texto usan la misma autenticación pero diferentes modelos
3. **Rate limits:** Revisa los límites de Gemini en https://ai.google.dev/pricing
4. **Compatibilidad:** Los endpoints mantienen sus nombres y estructura de respuesta
