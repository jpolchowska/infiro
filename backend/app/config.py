import os


def _build_database_uri():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "postgres")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "infiro")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


class Config:
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False