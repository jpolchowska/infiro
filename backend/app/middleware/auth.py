from functools import wraps
from flask import request, jsonify
import jwt
from jwt import PyJWKClient

KEYCLOAK_JWKS_URI = "http://keycloak:8080/realms/matematyka-app/protocol/openid-connect/certs"
KEYCLOAK_ISSUER = "http://localhost/realms/matematyka-app"

jwks_client = PyJWKClient(KEYCLOAK_JWKS_URI)

def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"message": "Brak tokena autoryzacyjnego"}), 401

        if not auth_header.startswith("Bearer "):
            return jsonify({"message": "Nieprawidłowy format tokena"}), 401

        token = auth_header.split(" ", 1)[1]

        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            decoded = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=KEYCLOAK_ISSUER,
                options={"verify_aud": False}
            )
            print("🔓 Rozszyfrowany JWT payload:", decoded, flush=True)
            request.user = decoded

        except jwt.ExpiredSignatureError:
            print("❌ BŁĄD: Token wygasł! Pobierz nowy token w Postmanie.", flush=True)
            return jsonify({"message": "Token wygasł"}), 403
            
        except jwt.InvalidIssuerError as e:
            print(f"❌ BŁĄD ISSUERA: Token ma inny 'iss' niż KEYCLOAK_ISSUER={KEYCLOAK_ISSUER}. Treść: {e}", flush=True)
            return jsonify({"message": "Nieprawidłowy issuer"}), 403
            
        except Exception as e:
            print(f"❌ INNY BŁĄD ({type(e).__name__}): {str(e)}", flush=True)
            return jsonify({"message": f"Błąd weryfikacji: {str(e)}"}), 403

        return f(*args, **kwargs)

    return decorated


def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = getattr(request, "user", {})
            user_role = user.get("user_role_test")

            if role != user_role:
                return jsonify({"message": f"Brak wymaganej roli: {role}"}), 403

            return f(*args, **kwargs)

        return decorated

    return decorator