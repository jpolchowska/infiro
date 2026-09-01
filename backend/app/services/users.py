from flask import request

from app.extensions import db
from app.models.users import User


def get_or_create_user(role):
    """Znajduje User po claimie 'sub' z JWT. Jeśli nie ma jeszcze lokalnego
    wiersza, zakłada go z podaną rolą i danymi z tokena (first_name/last_name/email).
    Jeśli wiersz już istnieje, odświeża te dane z bieżącego tokena -- inaczej
    konta założone zanim zaczęliśmy je zapisywać zostałyby bez imienia na zawsze.
    """
    sub = request.user.get("sub")
    user = User.query.filter_by(keycloak_sub=sub).first()

    first_name = request.user.get("given_name")
    last_name = request.user.get("family_name")
    email = request.user.get("email")

    if user is None:
        user = User(
            keycloak_sub=sub,
            role=role,
            first_name=first_name,
            last_name=last_name,
            email=email,
        )
        db.session.add(user)
        db.session.commit()
    elif (user.first_name, user.last_name, user.email) != (first_name, last_name, email):
        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        db.session.commit()

    return user


def update_interest():
    sub = request.user.get("sub")
    user = User.query.filter_by(keycloak_sub=sub).first()
    interest = request.json.get("interest")

    anivableInterests_options = ["sport", "zwierzeta", "gotowanie", "lego", "gry", "rysowanie"]

    if interest in anivableInterests_options:
        user.interest = interest
    else:
        raise ValueError("Invalid interest")

    db.session.commit()
