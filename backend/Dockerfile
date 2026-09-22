FROM python:3.12-slim AS base

WORKDIR /app

# PYTHONUNBUFFERED - logi lecą od razu na stdout, nie czekają w buforze.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

FROM base AS dev

ENV FLASK_DEBUG=1

CMD ["sh", "-c", "flask db upgrade && python run.py"]

FROM base AS prod

ENV FLASK_DEBUG=0

CMD ["sh", "-c", "flask db upgrade && gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile - run:app"]