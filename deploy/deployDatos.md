# Deploy en Railway - Datos Requeridos

## Arquitectura
- **3 servicios:** PostgreSQL + Backend (Flask) + Frontend (React)
- **Mismo repositorio** para Backend y Frontend

---

## 1. PostgreSQL

**Tipo:** Database → Add PostgreSQL

**Variables generadas automáticamente:**
- `DATABASE_URL`

---

## 2. Backend (Flask)

**Repositorio:** Mismo repo del proyecto

### Variables de entorno:
```bash
DATABASE_URL=<copiar desde servicio PostgreSQL>
FLASK_APP_KEY=<generar con: openssl rand -hex 32>
JWT_SECRET_KEY=<generar con: openssl rand -hex 64>
FLASK_APP=src/app.py
FLASK_DEBUG=0
DEBUG=FALSE
```

### Settings → Build:
- **Builder:** Railpack
- **Build Command:** `pipenv install --deploy --system`
- **Start Command:** `bash start.sh`

### Archivos requeridos:
- `src/wsgi.py` debe tener: `application = app`
- `start.sh` en raíz (ejecuta migraciones + gunicorn)
- `Procfile` sin comando `release` (comentado)

---

## 3. Frontend (React/Vite)

**Repositorio:** Mismo repo del proyecto

### Variables de entorno:
```bash
VITE_BACKEND_URL=https://web-production-xxx.up.railway.app
VITE_BASENAME=/
NODE_VERSION=20
```

### Settings → Build:
- **Builder:** Nixpacks
- **Build Command:** `npm run build`
- **Start Command:** `npx serve -s dist -p $PORT`

### Archivos requeridos:
- `nixpacks.toml` en raíz (configura Node.js)

---

## Archivos del Proyecto

### `nixpacks.toml`
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

### `start.sh`
```bash
#!/bin/bash
flask db upgrade
exec gunicorn wsgi:application --chdir ./src/ --bind 0.0.0.0:$PORT
```

### `Procfile`
```
# release: pipenv run upgrade
web: gunicorn wsgi --chdir ./src/
```

---

## Comandos Git

```bash
git add .
git commit -m "Configure Railway deployment"
git push
```

Railway despliega automáticamente al detectar cambios en GitHub.
