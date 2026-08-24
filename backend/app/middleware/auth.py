from functools import wraps
from flask import request, jsonify
import jwt
from jwt import PyJWKClient

KEYCLOAK_JWKS_URI = "http://keycloak:8080/realms/matematyka-app/protocol/openid-connect/certs"
KEYCLOAK_ISSUER_PATH = "/realms/matematyka-app"

jwks_client = PyJWKClient(KEYCLOAK_JWKS_URI)

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

            # Host w 'iss' zależy od tego, jak klient dotarł do Keycloaka
            # (localhost w przeglądarce, adres LAN/10.0.2.2 z telefonu/emulatora)
            # -- sprawdzamy tylko, że to token z naszego realmu, nie z jakiegoś innego.
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


def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(request, "user", {})
            user_role = user.get("user_role_test")

            if role != user_role:
                return jsonify({"message": f"Missing required role: {role}"}), 403

            return f(*args, **kwargs)

        return decorated

    return decorator


def require_realm_role(role):
    """Sprawdza natywną rolę realmową Keycloaka (realm_access.roles) -- ten sam
    mechanizm co keycloak.hasRealmRole() już używany w AuthGate panelu admina.
    Inaczej niż require_role(), który sprawdza custom claim 'user_role_test'
    używany przez aplikację mobilną.
    """
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
