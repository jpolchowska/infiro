from flask import Flask

from app.config import Config
from app.extensions import db, migrate


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    from app import models  # noqa: F401 -- rejestruje modele w db.metadata

    from app.routes.public import public_bp
    from app.routes.student import student_bp
    from app.routes.leveling_test import leveling_test_bp
    from app.routes.tasks import tasks_bp
    from app.routes.admin_sections import admin_sections_bp
    from app.routes.admin_materials import admin_materials_bp
    from app.routes.admin_import import admin_import_bp
    from app.routes.admin_students import admin_students_bp

    app.register_blueprint(student_bp)
    app.register_blueprint(leveling_test_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(admin_sections_bp)
    app.register_blueprint(admin_materials_bp)
    app.register_blueprint(admin_import_bp)
    app.register_blueprint(admin_students_bp)

    return app