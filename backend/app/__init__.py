from flask import Flask

from app import models  # noqa: F401
from app.config import Config
from app.extensions import db, migrate
from app.routes import register_blueprints


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config is not None:
        app.config.from_mapping(config)

    db.init_app(app)
    migrate.init_app(app, db)
    register_blueprints(app)

    return app
