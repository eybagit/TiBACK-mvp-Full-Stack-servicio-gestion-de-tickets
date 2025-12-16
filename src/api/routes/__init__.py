"""
Blueprint principal de rutas para la API
Registra todos los sub-blueprints de entidades
"""
from flask import Blueprint

# Crear blueprint principal
api = Blueprint('api', __name__)

# Importar sub-blueprints
from api.routes.utils_routes import utils_bp
from api.routes.cliente_routes import cliente_bp
from api.routes.analista_routes import analista_bp
from api.routes.supervisor_routes import supervisor_bp
from api.routes.administrador_routes import administrador_bp
from api.routes.comentario_routes import comentario_bp
from api.routes.asignacion_routes import asignacion_bp
from api.routes.gestion_routes import gestion_bp
from api.routes.auth_routes import auth_bp
from api.routes.ticket_routes import ticket_bp
from api.routes.ticket_estado_routes import ticket_estado_bp
from api.routes.chat_routes import chat_bp
from api.routes.ia_routes import ia_bp
from api.routes.dashboard_routes import dashboard_bp

# Registrar sub-blueprints sin prefijo adicional (ya están bajo /api)
api.register_blueprint(utils_bp)
api.register_blueprint(cliente_bp)
api.register_blueprint(analista_bp)
api.register_blueprint(supervisor_bp)
api.register_blueprint(administrador_bp)
api.register_blueprint(comentario_bp)
api.register_blueprint(asignacion_bp)
api.register_blueprint(gestion_bp)
api.register_blueprint(auth_bp)
api.register_blueprint(ticket_bp)
api.register_blueprint(ticket_estado_bp)
api.register_blueprint(chat_bp)
api.register_blueprint(ia_bp)
api.register_blueprint(dashboard_bp)
