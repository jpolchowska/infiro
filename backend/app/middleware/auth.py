from functools import wraps

from flask import request, jsonify


def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({
                "message": "Brak tokena autoryzacyjnego"
            }), 401

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "message": "Nieprawidłowy format tokena"
            }), 401

        token = auth_header.split(" ", 1)[1]

        print(f"Received token: {token}")

        return f(*args, **kwargs)

    return decorated