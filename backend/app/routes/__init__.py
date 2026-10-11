from app.routes import admin, health, student


def register_blueprints(app):
    for blueprint in (health.bp, *admin.blueprints, *student.blueprints):
        app.register_blueprint(blueprint)
