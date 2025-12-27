# 🔐 Variables de Entorno - TiBACK

> **Última actualización:** 19 de Diciembre, 2025  
> **Propósito:** Documentación de todas las variables de API y configuración usadas en el proyecto

---

## 📋 RESUMEN

Este documento lista todas las variables de entorno que deben configurarse en el archivo `.env` para el correcto funcionamiento del proyecto TiBACK.

---

## 🎯 VARIABLES REQUERIDAS

### Backend (Flask/Python)

#### Base de Datos
```bash
DATABASE_URL=postgres://usuario:password@localhost:5432/tiback_db
```
- **Uso:** Conexión a PostgreSQL
- **Ubicación:** `src/api/models.py`
- **Requerido:** ✅ Sí

#### Flask
```bash
FLASK_APP=src/app.py
FLASK_APP_KEY="clave-secreta-para-sesiones-flask"
FLASK_DEBUG=1
DEBUG=TRUE
```
- **Uso:** Configuración de Flask
- **Ubicación:** `src/app.py`
- **Requerido:** ✅ Sí

#### JWT (Autenticación)
```bash
JWT_SECRET_KEY="clave-super-secreta-jwt-cambiar-en-produccion"
```
- **Uso:** Firma de tokens JWT para autenticación
- **Ubicación:** `src/api/jwt_utils.py`
- **Requerido:** ✅ Sí

---

### Servicios de Terceros

#### Cloudinary (Almacenamiento de Imágenes)
```bash
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```
- **Uso:** Upload y gestión de imágenes de tickets
- **Ubicación:** 
  - `src/api/services/image_service.py`
  - `src/api/routes/utils_routes.py`
- **Requerido:** ✅ Sí

#### Google Cloud Vision (Reconocimiento de Imágenes)
```bash
CLOUD_VISION_API=tu-google-cloud-vision-api-key
```
- **Uso:** Análisis de imágenes con IA (detección de objetos, texto, etiquetas)
- **Ubicación:** `src/api/services/ia_service.py` (líneas 238, 253)
- **Requerido:** ⚠️ Opcional (funcionalidad de IA)

#### OpenAI (Inteligencia Artificial)
```bash
API_KEY_IA=sk-tu-openai-api-key
```
- **Uso:** Generación de recomendaciones inteligentes para tickets
- **Ubicación:** 
  - `src/api/routes/ia_routes.py` (línea 110)
  - `src/api/services/ia_service.py` (método `generar_recomendacion_openai`)
- **Requerido:** ⚠️ Opcional (funcionalidad de IA)

---

### Frontend (Vite/React)

#### Backend URL
```bash
VITE_BACKEND_URL=http://localhost:3001
```
- **Uso:** URL del backend para todas las llamadas API
- **Ubicación:** Usado en ~200+ archivos del frontend
- **Requerido:** ✅ Sí

#### Google Maps
```bash
VITE_GOOGLE_MAPS_API_KEY=tu-google-maps-api-key
```
- **Uso:** Mapas de calor y geolocalización de tickets
- **Ubicación:** `src/front/hooks/useGoogleMaps.jsx` (línea 41)
- **Requerido:** ⚠️ Opcional (funcionalidad de mapas)

#### Google Speech-to-Text
```bash
VITE_GOOGLE_SPEECH_API_KEY=tu-google-speech-api-key
```
- **Uso:** Transcripción de voz a texto en comentarios
- **Ubicación:** `src/front/hooks/useSpeechToText.jsx` (línea 226)
- **Requerido:** ⚠️ Opcional (funcionalidad de voz)

#### EmailJS (Formulario de Contacto)
```bash
VITE_EMAILJS_PUBLIC_KEY=tu-emailjs-public-key
```
- **Uso:** Envío de emails desde el formulario de contacto
- **Ubicación:** `src/front/pages/ContactView.jsx` (línea 10)
- **Requerido:** ⚠️ Opcional (formulario de contacto)

#### Vite Base Path
```bash
VITE_BASENAME=/
```
- **Uso:** Ruta base para el router de React
- **Ubicación:** Configuración de React Router
- **Requerido:** ✅ Sí (usar `/` por defecto)

---

## 📊 TABLA RESUMEN

| Variable | Servicio | Requerido | Ubicación Principal |
|----------|----------|-----------|---------------------|
| `DATABASE_URL` | PostgreSQL | ✅ | Backend |
| `FLASK_APP_KEY` | Flask | ✅ | Backend |
| `JWT_SECRET_KEY` | JWT Auth | ✅ | Backend |
| `CLOUDINARY_URL` | Cloudinary | ✅ | Backend |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | ✅ | Backend |
| `CLOUDINARY_API_KEY` | Cloudinary | ✅ | Backend |
| `CLOUDINARY_API_SECRET` | Cloudinary | ✅ | Backend |
| `CLOUD_VISION_API` | Google Vision | ⚠️ | Backend IA |
| `API_KEY_IA` | OpenAI | ⚠️ | Backend IA |
| `VITE_BACKEND_URL` | Backend API | ✅ | Frontend |
| `VITE_BASENAME` | React Router | ✅ | Frontend |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps | ⚠️ | Frontend |
| `VITE_GOOGLE_SPEECH_API_KEY` | Speech-to-Text | ⚠️ | Frontend |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS | ⚠️ | Frontend |

---

## 🔧 CONFIGURACIÓN RECOMENDADA

### Desarrollo Local
```bash
# Backend
DATABASE_URL=postgres://gitpod:postgres@localhost:5432/tiback_dev
FLASK_APP_KEY="dev-secret-key"
JWT_SECRET_KEY="dev-jwt-secret"
FLASK_DEBUG=1
DEBUG=TRUE

# Cloudinary (requerido)
CLOUDINARY_URL=cloudinary://key:secret@cloud
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-key
CLOUDINARY_API_SECRET=tu-secret

# Frontend
VITE_BACKEND_URL=http://localhost:3001
VITE_BASENAME=/

# Opcional - IA y servicios externos
# CLOUD_VISION_API=
# API_KEY_IA=
# VITE_GOOGLE_MAPS_API_KEY=
# VITE_GOOGLE_SPEECH_API_KEY=
# VITE_EMAILJS_PUBLIC_KEY=
```

### Producción
```bash
# Backend
DATABASE_URL=postgres://user:pass@prod-host:5432/tiback_prod
FLASK_APP_KEY="clave-produccion-super-segura-cambiar"
JWT_SECRET_KEY="jwt-produccion-super-seguro-cambiar"
FLASK_DEBUG=0
DEBUG=FALSE

# Cloudinary (requerido)
CLOUDINARY_URL=cloudinary://prod-key:prod-secret@prod-cloud
CLOUDINARY_CLOUD_NAME=prod-cloud-name
CLOUDINARY_API_KEY=prod-api-key
CLOUDINARY_API_SECRET=prod-api-secret

# Frontend
VITE_BACKEND_URL=https://api.tudominio.com
VITE_BASENAME=/

# IA y servicios (configurar según necesidad)
CLOUD_VISION_API=prod-vision-key
API_KEY_IA=sk-prod-openai-key
VITE_GOOGLE_MAPS_API_KEY=prod-maps-key
VITE_GOOGLE_SPEECH_API_KEY=prod-speech-key
VITE_EMAILJS_PUBLIC_KEY=prod-emailjs-key
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Nunca commitear el archivo `.env`** - Está en `.gitignore` por seguridad
2. **Usar `.env.example`** como plantilla para nuevos desarrolladores
3. **Rotar claves en producción** regularmente
4. **Variables opcionales** - El sistema funciona sin las variables de IA/Maps, pero con funcionalidad reducida
5. **VITE_* variables** - Solo disponibles en el frontend (prefijo `VITE_` es requerido por Vite)

---

## 📚 REFERENCIAS

- **Cloudinary:** https://cloudinary.com/documentation
- **Google Cloud Vision:** https://cloud.google.com/vision/docs
- **OpenAI API:** https://platform.openai.com/docs
- **Google Maps API:** https://developers.google.com/maps/documentation
- **Google Speech API:** https://cloud.google.com/speech-to-text/docs
- **EmailJS:** https://www.emailjs.com/docs

---

*Generado automáticamente mediante análisis del código fuente*
