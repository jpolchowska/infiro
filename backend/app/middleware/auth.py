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

        request.user = {
            "roles": ["STUDENT"]
        }

        print(f"Received token: {token}")

        return f(*args, **kwargs)

    return decorated

def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user_roles = getattr(request, "user", {}).get("roles", [])

            if role not in user_roles:
                return jsonify({
                    "message": f"Brak wymaganej roli: {role}"
                }), 403

            return f(*args, **kwargs)

        return decorated

    return decorator