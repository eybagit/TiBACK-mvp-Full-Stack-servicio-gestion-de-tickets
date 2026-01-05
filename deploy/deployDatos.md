# Deploy en Railway - Documentación Técnica Completa

## 🔗 URLs de Producción
- **Frontend:** https://tiback-mvp-full-stack-servicio-gestion-de-ticket-production.up.railway.app/
- **Backend:** https://web-production-9ea7.up.railway.app/
- **Fecha:** 5 de Enero 2026

---

## 📁 Archivos Modificados/Creados

### 1. `src/wsgi.py` (Líneas 11-17)
**Cambio:** Agregado alias `application` para compatibilidad con Gunicorn

```python
from app import app

# Gunicorn expects 'application' by default
application = app

if __name__ == "__main__":
    app.run()
```

**Razón:** Gunicorn busca por defecto un objeto llamado `application`, pero el archivo exportaba `app`. Sin este cambio, el error era: `Failed to find attribute 'application' in 'wsgi'`

---

### 2. `nixpacks.toml` (Archivo nuevo - 11 líneas)
**Propósito:** Configurar Nixpacks para el frontend (Node.js)

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve -s dist -p $PORT"
```

**Razón:** Railway detectaba Python en lugar de Node.js porque el repositorio tiene ambos. Este archivo fuerza el uso de Node.js 20 para el servicio frontend.

---

### 3. `start.sh` (Archivo nuevo - 13 líneas)
**Propósito:** Script de inicio que ejecuta migraciones antes de Gunicorn

```bash
#!/bin/bash

# Ejecutar migraciones
echo "Running database migrations..."
flask db upgrade

# Insertar datos de prueba
echo "Inserting test data..."
flask insert-test-data || echo "Test data already exists or command failed"

# Iniciar Gunicorn
echo "Starting Gunicorn..."
exec gunicorn --worker-class gevent -w 1 wsgi:application --chdir ./src/ --bind 0.0.0.0:$PORT
```

**Razón:** 
- Las migraciones (`flask db upgrade`) no pueden ejecutarse durante el build porque no hay acceso a la base de datos en esa fase
- Los datos de prueba se insertan automáticamente
- Se usa `gevent` como worker para WebSockets

---

### 4. `Pipfile` (Líneas 30-32)
**Cambio:** Agregado gevent y gevent-websocket

```toml
eventlet = "==0.36.1"
gevent = "*"
gevent-websocket = "*"
```

**Razón:** Gevent es necesario para WebSockets con Gunicorn en Python 3.13 (eventlet no es compatible con Python 3.13)

---

### 5. `Procfile` (Línea 1)
**Cambio:** Comentado el comando `release`

```
# release: pipenv run upgrade
web: gunicorn wsgi --chdir ./src/
```

**Razón:** El comando release causaba error en el servicio frontend porque intentaba ejecutar `pipenv` en un entorno Node.js

---

## 🏗️ Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────────┐
│                      Railway Project                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  PostgreSQL │  │   Backend   │  │      Frontend       │ │
│  │  (Database) │  │   (Flask)   │  │   (React/Vite)      │ │
│  │             │  │             │  │                     │ │
│  │ Auto-gen    │  │ Railpack    │  │ Nixpacks            │ │
│  │ DATABASE_URL│  │ Python 3.13 │  │ Node.js 20          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuración de Servicios

### Backend (Flask)
| Setting | Valor |
|---------|-------|
| **Builder** | Railpack |
| **Build Command** | `pipenv install --deploy --system` |
| **Start Command** | `bash start.sh` |
| **Python Version** | 3.13 (auto-detectado) |

### Frontend (React/Vite)
| Setting | Valor |
|---------|-------|
| **Builder** | Nixpacks |
| **Build Command** | `npm run build` |
| **Start Command** | `npx serve -s dist -p $PORT` |
| **Node Version** | 20 (vía nixpacks.toml) |

---

## 🔐 Variables de Entorno

### Backend
```bash
DATABASE_URL=postgresql://postgres:xxx@postgres.railway.internal:xxxx/railway
FLASK_APP=src/app.py
FLASK_DEBUG=0
DEBUG=FALSE
FLASK_APP_KEY=<generar con: openssl rand -hex 32>
JWT_SECRET_KEY=<generar con: openssl rand -hex 64>
```

### Frontend
```bash
VITE_BACKEND_URL=https://web-production-9ea7.up.railway.app
VITE_BASENAME=/
NODE_VERSION=20
```

---

## 🔄 Workers de Gunicorn Evaluados

| Worker | Puntuación | Compatibilidad Python 3.13 | WebSockets | Resultado |
|--------|------------|---------------------------|------------|-----------|
| **sync** | 4/10 | ✅ Sí | ❌ Lento | Funcionó pero lento |
| **eventlet** | 9/10 | ❌ No | ✅ Excelente | Error: `start_joinable_thread` |
| **gevent** | 8/10 | ✅ Sí | ✅ Excelente | **✅ SELECCIONADO** |

**Error de Eventlet con Python 3.13:**
```
AttributeError: module 'eventlet.green.thread' has no attribute 'start_joinable_thread'
```

---

## 🐛 Errores Resueltos

### Error 1: `Failed to find attribute 'application' in 'wsgi'`
**Causa:** Gunicorn busca `application`, el archivo tenía `app`
**Solución:** Agregar `application = app` en `wsgi.py`

### Error 2: `npx: command not found`
**Causa:** Railway detectó Python en lugar de Node.js para el frontend
**Solución:** Crear `nixpacks.toml` especificando Node.js 20

### Error 3: `pipenv: command not found` (en frontend)
**Causa:** El `Procfile` tenía `release: pipenv run upgrade` que se ejecutaba en ambos servicios
**Solución:** Comentar la línea release en `Procfile`

### Error 4: `could not translate host name "postgres.railway.internal"`
**Causa:** `flask db upgrade` se ejecutaba durante el build (sin acceso a red)
**Solución:** Mover migraciones al `start.sh` que se ejecuta después del build

### Error 5: `Pipfile.lock is out of date`
**Causa:** Se agregaron dependencias sin regenerar el lock
**Solución:** Ejecutar `pipenv lock` localmente y hacer push

### Error 6: Eventlet incompatible con Python 3.13
**Causa:** Eventlet no soporta Python 3.13
**Solución:** Usar `gevent` en lugar de `eventlet`

---

## 📋 Flujo de Deployment

### Paso 1: Preparación Local
```bash
# 1. Modificar archivos necesarios
# 2. Regenerar Pipfile.lock si hay cambios en Pipfile
pipenv lock

# 3. Commit y push
git add .
git commit -m "Configure Railway deployment"
git push origin develop
```

### Paso 2: Railway Detecta y Despliega
1. Railway detecta el push automáticamente
2. Ejecuta el Build Command
3. Ejecuta el Start Command
4. El servicio está online

### Paso 3: Verificación
- Backend: Revisar logs para `[INFO] Starting gunicorn`
- Frontend: Revisar logs para `INFO  Accepting connections`
- WebSockets: Verificar conexiones en logs del backend

---

## 📝 Commits Realizados

1. `fix deploy 1` - Archivos railway.json y wsgi.py
2. `fix in nicpack` - Corrección nombre paquete nodejs_20
3. `datos de prueba pre-cargados` - Agregado insert-test-data a start.sh
4. `velocidad de sockets en produccion con eventlet` - Intento fallido
5. `put sockets de sync a gevent` - Solución final para WebSockets
6. `add link a produccion` - Documentación
7. `actualizado TiBACK.md` - Referencias a versión anterior

---

## ✅ Estado Final

| Componente | Estado | Notas |
|------------|--------|-------|
| Backend | ✅ Online | Gunicorn + gevent |
| Frontend | ✅ Online | serve + Vite build |
| PostgreSQL | ✅ Online | Conexión interna |
| WebSockets | ✅ Funcionando | Con gevent worker |
| Migraciones | ✅ Ejecutadas | En start.sh |
| Datos de prueba | ✅ Cargados | Usuarios de test disponibles |

---

## 🔧 Comandos Útiles

```bash
# Forzar redeploy sin cambios
git commit --allow-empty -m "trigger deploy"
git push

# Ver logs en Railway
# Usar Railway CLI o dashboard web

# Regenerar Pipfile.lock
pipenv lock
git add Pipfile.lock
git commit -m "Update Pipfile.lock"
git push
```

---

## 📚 Archivos de Configuración Finales

### nixpacks.toml (Frontend)
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npx serve -s dist -p $PORT"
```

### start.sh (Backend)
```bash
#!/bin/bash
flask db upgrade
flask insert-test-data || echo "Test data already exists"
exec gunicorn --worker-class gevent -w 1 wsgi:application --chdir ./src/ --bind 0.0.0.0:$PORT
```

### Procfile
```
# release: pipenv run upgrade
web: gunicorn wsgi --chdir ./src/
```
