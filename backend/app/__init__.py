from flask import Flask

from app.config import Config
from app.extensions import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    from app.routes.public import public_bp
    from app.routes.student import student_bp

    app.register_blueprint(student_bp)
    app.register_blueprint(public_bp)

    return app