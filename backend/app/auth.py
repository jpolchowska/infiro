from functools import wraps

import jwt
from flask import jsonify, request
from jwt import PyJWKClient

from app.constants import RealmRole
from app.models.users import User

KEYCLOAK_JWKS_URI = "http://keycloak:8080/realms/infiro/protocol/openid-connect/certs"
KEYCLOAK_ISSUER_PATH = "/realms/infiro"

jwks_client = PyJWKClient(KEYCLOAK_JWKS_URI)

STAFF_ROLES = {RealmRole.ADMIN, RealmRole.TEACHER}


def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"message": "Missing authorization token"}), 401

        if not auth_header.startswith("Bearer "):
            return jsonify({"message": "Invalid token format"}), 401

        token = auth_header.split(" ", 1)[1]

        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decoded = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False, "verify_iss": False}
            )

            issuer = decoded.get("iss", "")
            if not issuer.endswith(KEYCLOAK_ISSUER_PATH):
                return jsonify({"message": "Invalid issuer"}), 403

            request.user = decoded

        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired"}), 403

        except Exception as e:
            return jsonify({"message": f"Token verification failed: {str(e)}"}), 403

        return f(*args, **kwargs)

    return decorated


def require_any_realm_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(request, "user", {})
            realm_roles = set(user.get("realm_access", {}).get("roles", []))

            if not realm_roles.intersection(roles):
                return jsonify({"message": f"Missing required role: one of {roles}"}), 403

            return f(*args, **kwargs)

        return decorated

    return decorator


def require_realm_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(request, "user", {})
            realm_roles = user.get("realm_access", {}).get("roles", [])

            if role not in realm_roles:
                return jsonify({"message": f"Missing required role: {role}"}), 403

            return f(*args, **kwargs)

        return decorated

    return decorator


def _realm_roles():
    return set(getattr(request, "user", {}).get("realm_access", {}).get("roles", []))


def require_student_account(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        realm_roles = _realm_roles()
        if RealmRole.STUDENT not in realm_roles or realm_roles & STAFF_ROLES:
            return jsonify({"message": "Student account required"}), 403

        return f(*args, **kwargs)

    return decorated


def current_user():
    sub = request.user.get("sub")
    return User.query.filter_by(keycloak_sub=sub).first()


def require_student(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        student = current_user()
        if student is None:
            return jsonify({"error": "User not found"}), 404

        return f(student, *args, **kwargs)

    return authenticate_token(require_student_account(decorated))
