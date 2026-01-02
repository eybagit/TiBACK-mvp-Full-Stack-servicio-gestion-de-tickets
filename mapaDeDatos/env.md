# 🔐 Variables de Entorno - TiBACK

> **Última actualización:** 02 de Enero, 2026  
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
```
- **Formato:** `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
- **Uso:** Upload y gestión de imágenes de tickets
- **Ubicación:** 
  - `src/api/services/image_service.py`
  - `src/api/routes/utils_routes.py`
- **Requerido:** ✅ Sí

#### Google Gemini (Inteligencia Artificial Unificada)
```bash
GOOGLE_API_KEY=tu-google-api-key
```
- **Uso:** Análisis de imágenes y generación de recomendaciones inteligentes para tickets
- **Modelos:** 
  - `gemini-2.5-flash-image` (análisis de imágenes)
  - `gemini-2.5-flash` (generación de texto)
- **Ubicación:** 
  - `src/api/routes/ia_routes.py`
  - `src/api/services/ia_service.py`
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
| `GOOGLE_API_KEY` | Google Gemini | ⚠️ | Backend IA |
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

# Frontend
VITE_BACKEND_URL=http://localhost:3001
VITE_BASENAME=/

# Opcional - IA y servicios externos
# GOOGLE_API_KEY=
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

# Frontend
VITE_BACKEND_URL=https://api.tudominio.com
VITE_BASENAME=/

# IA y servicios (configurar según necesidad)
GOOGLE_API_KEY=prod-google-api-key
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
- **Google Gemini:** https://ai.google.dev/docs
- **Google Maps API:** https://developers.google.com/maps/documentation
- **Google Speech API:** https://cloud.google.com/speech-to-text/docs
- **EmailJS:** https://www.emailjs.com/docs

---

*Generado automáticamente mediante análisis del código fuente*
