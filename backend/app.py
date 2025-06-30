import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, jsonify, request
from config import config
from extensions import db, migrate, jwt, bcrypt, mail, cache, limiter
import os

def create_app(config_name=None):
    app = Flask(__name__)
    config_name = config_name or os.getenv('FLASK_ENV', 'default')
    app.config.from_object(config[config_name])

    # Initialisation des extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    cache.init_app(app)
    limiter.init_app(app)
    
    # Configure CORS
    from flask_cors import CORS
    CORS(app, 
         resources={r"/*": {"origins": "*"}}, 
         supports_credentials=True, 
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         expose_headers=["Content-Type", "Authorization"])

    # Import et enregistrement des blueprints
    from routes.auth import auth_bp
    from routes.problems import problems_bp
    from routes.admin import admin_bp
    from routes.notifications import notifications_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(problems_bp, url_prefix='/api/problems')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    # --- LOGGING SETUP ---
    log_level = logging.INFO if os.getenv('FLASK_ENV') == 'production' else logging.DEBUG
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    handler = RotatingFileHandler('app.log', maxBytes=1_000_000, backupCount=3)
    handler.setFormatter(formatter)
    handler.setLevel(log_level)
    logging.getLogger().setLevel(log_level)
    if not logging.getLogger().handlers:
        logging.getLogger().addHandler(handler)
    # --- END LOGGING SETUP ---

    # Gestion centralisée des erreurs
    @app.errorhandler(404)
    def not_found(error):
        app.logger.warning(f"404 Not Found: {request.path}")
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(400)
    def bad_request(error):
        app.logger.warning(f"400 Bad Request: {request.path}")
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"500 Internal Server Error: {request.path}")
        return jsonify({"error": "Internal server error"}), 500

    @app.route('/')
    def index():
        return jsonify({"message": "Welcome to the Student Feedback API"})

    print('--- ROUTES ACTIVES ---')
    for rule in app.url_map.iter_rules():
        print(rule)
    print('----------------------')
    return app

# Pour le développement local
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
