# 🔐 Sugerencias de Mejora de Seguridad - TiBACK

**Fecha:** 2025-12-30  
**Auditoría:** Análisis completo del proyecto  
**Puntuación actual:** 6.5/10  

---

## 🔴 PRIORIDAD CRÍTICA

### 1. ✅ IMPLEMENTADO: Hashing de Contraseñas (2025-12-30)
- **Estado:** ✅ COMPLETADO
- **Librería:** `werkzeug.security` (generate_password_hash, check_password_hash)
- **Archivos modificados:**
  - `auth_routes.py` - Login (check_password_hash) + Register/Update (generate_password_hash)
  - `administrador_routes.py` - Create/Update con hash
  - `analista_routes.py` - Create/Update con hash
  - `supervisor_routes.py` - Create/Update con hash
  - `cliente_routes.py` - Create/Update con hash
  - `commands.py` - Test data con hash
- **Impacto:** Contraseñas ahora se almacenan hasheadas en BD (pbkdf2:sha256)

> ⚠️ **IMPORTANTE:** Usuarios existentes con contraseñas en texto plano NO podrán hacer login.
> Ejecutar `flask reset-test-data` para recrear usuarios de prueba con contraseñas hasheadas.


### 2. Restringir CORS a Dominios Específicos
- **Problema:** `origins="*"` permite requests desde cualquier sitio web
- **Archivo:** `app.py` líneas 32 y 40
- **Solución:** Definir lista de dominios permitidos en `.env`
- **Impacto:** ALTO - Vulnerable a ataques CSRF y robo de datos

### 3. Eliminar Fallback de JWT Secret Key
- **Problema:** Si `.env` no tiene `JWT_SECRET_KEY`, usa valor hardcodeado público
- **Archivo:** `jwt_utils.py` línea 12, `app.py` línea 35
- **Solución:** Forzar error si no existe la variable de entorno
- **Impacto:** ALTO - Tokens pueden ser generados por atacantes

---

## 🟠 PRIORIDAD ALTA

### 4. Implementar Rate Limiting
- **Problema:** No hay límite de requests por IP/usuario
- **Endpoints críticos:** `/login`, `/register`, todas las rutas de API
- **Solución:** Usar Flask-Limiter
- **Impacto:** MEDIO - Vulnerable a fuerza bruta y DoS

### 5. Validación y Sanitización de Inputs
- **Problema:** Inputs de usuario no se validan consistentemente
- **Archivos:** Todos los `*_routes.py`
- **Solución:** Usar Marshmallow o Pydantic para schemas de validación
- **Impacto:** MEDIO - Posible XSS, SQL injection, data corruption

### 6. Implementar HTTPS Obligatorio
- **Problema:** No hay redirección forzada a HTTPS
- **Solución:** Configurar Flask-Talisman o nginx para forzar HTTPS
- **Impacto:** MEDIO - Tokens y datos sensibles pueden ser interceptados

---

## 🟡 PRIORIDAD MEDIA

### 7. Remover Logs de Debugging en Producción
- **Problema:** Múltiples `print()` statements con datos sensibles
- **Archivos:** `websocket_auth.py`, `chat_routes.py`, otros
- **Solución:** Usar logging con niveles (DEBUG solo en desarrollo)
- **Impacto:** BAJO - Exposición de información en logs de producción

### 8. Implementar Content Security Policy (CSP)
- **Problema:** No hay headers de seguridad HTTP
- **Solución:** Configurar Flask-Talisman con CSP headers
- **Impacto:** BAJO - Protección contra XSS y clickjacking

### 9. Agregar Timeout a Sesiones JWT
- **Problema:** Tokens válidos por 24 horas sin refresh
- **Archivo:** `jwt_utils.py` línea 14
- **Solución:** Implementar refresh tokens con expiración corta
- **Impacto:** BAJO - Tokens robados válidos por mucho tiempo

### 10. Implementar Auditoría de Accesos
- **Problema:** No hay logs de quién accede a qué recursos
- **Solución:** Crear tabla de audit_logs en BD
- **Impacto:** BAJO - Dificulta detección de accesos no autorizados

---

## 🔵 PRIORIDAD BAJA (Mejoras Opcionales)

### 11. Implementar 2FA (Two-Factor Authentication)
- **Solución:** Usar TOTP (Google Authenticator) para roles críticos
- **Beneficio:** Capa adicional de seguridad para supervisores/administradores

### 12. Encriptación End-to-End de Chats
- **Solución:** Implementar E2EE para mensajes privados
- **Beneficio:** Privacidad total de comunicaciones

### 13. Implementar IP Whitelisting para Administradores
- **Solución:** Restringir acceso de administradores a IPs específicas
- **Beneficio:** Protección contra acceso no autorizado a cuentas admin

### 14. Agregar Detección de Anomalías
- **Solución:** Monitorear patrones de uso anormales
- **Beneficio:** Detección temprana de cuentas comprometidas

### 15. Implementar Password Policies
- **Solución:** Forzar contraseñas fuertes (mínimo 8 caracteres, mayúsculas, números)
- **Beneficio:** Reducir éxito de ataques de fuerza bruta

---

## 📊 Resumen de Impacto

| Prioridad | Cantidad | Tiempo Estimado | Impacto en Seguridad |
|-----------|----------|-----------------|----------------------|
| 🔴 Crítica | 3 | 8-12 horas | +2.5 puntos (6.5 → 9.0) |
| 🟠 Alta | 3 | 6-8 horas | +0.5 puntos (9.0 → 9.5) |
| 🟡 Media | 4 | 4-6 horas | +0.3 puntos (9.5 → 9.8) |
| 🔵 Baja | 5 | 10-15 horas | +0.2 puntos (9.8 → 10.0) |

**Total estimado para 9.0/10:** 14-20 horas  
**Total estimado para 10.0/10:** 28-41 horas

---

## 🎯 Roadmap Recomendado

### Fase 1: Seguridad Básica (2-3 días)
1. Implementar bcrypt para contraseñas
2. Restringir CORS
3. Forzar JWT_SECRET_KEY desde .env

### Fase 2: Protección de API (1-2 días)
4. Implementar rate limiting
5. Validación de inputs
6. HTTPS obligatorio

### Fase 3: Hardening (1-2 días)
7. Limpiar logs de debugging
8. CSP headers
9. Refresh tokens

### Fase 4: Auditoría y Monitoreo (1 día)
10. Audit logs

### Fase 5: Mejoras Avanzadas (Opcional, 2-3 semanas)
11-15. Características de seguridad avanzadas

---

**Creado:** 2025-12-30  
**Autor:** Auditoría de Seguridad TiBACK  
**Próxima revisión:** Después de implementar Fase 1
