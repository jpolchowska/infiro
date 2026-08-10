from flask import Flask


def create_app():
    app = Flask(__name__)

    from app.routes.public import public_bp
    from app.routes.student import student_bp

    app.register_blueprint(student_bp)
    app.register_blueprint(public_bp)

    return app