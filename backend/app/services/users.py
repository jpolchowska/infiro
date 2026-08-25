from flask import request

from app.extensions import db
from app.models.users import User


def get_or_create_user(role):
    """Znajduje User po claimie 'sub' z JWT. Jeśli nie ma jeszcze lokalnego
    wiersza, zakłada go z podaną rolą i danymi z tokena (first_name/last_name/email).
    """
    sub = request.user.get("sub")
    user = User.query.filter_by(keycloak_sub=sub).first()

    if user is None:
        user = User(
            keycloak_sub=sub,
            role=role,
            first_name=request.user.get("given_name"),
            last_name=request.user.get("family_name"),
            email=request.user.get("email"),
        )
        db.session.add(user)
        db.session.commit()

    return user
