from app.constants import INTERESTS, UserRole
from app.extensions import db
from app.models.users import User


def _profile_from_claims(claims, role):
    username = claims.get("preferred_username")
    name = claims.get("given_name") if role == UserRole.TEACHER else None
    return username, name


def get_or_create_user(claims, role):
    sub = claims.get("sub")
    user = User.query.filter_by(keycloak_sub=sub).first()
    username, name = _profile_from_claims(claims, role)

    if user is None:
        user = User(keycloak_sub=sub, role=role, username=username, name=name)
        db.session.add(user)
        db.session.commit()
    elif (user.username, user.name) != (username, name):
        user.username = username
        user.name = name
        db.session.commit()

    return user


def update_interest(user, interest):
    if interest is not None and interest not in INTERESTS:
        raise ValueError("Invalid interest")

    user.interest = interest
    db.session.commit()
