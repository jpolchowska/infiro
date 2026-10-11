from app.constants import INTERESTS
from app.extensions import db
from app.models.users import User


def get_or_create_user(claims, role):
    sub = claims.get("sub")
    user = User.query.filter_by(keycloak_sub=sub).first()

    first_name = claims.get("given_name")
    last_name = claims.get("family_name")
    email = claims.get("email")

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


def update_interest(user, interest):
    if interest is not None and interest not in INTERESTS:
        raise ValueError("Invalid interest")

    user.interest = interest
    db.session.commit()
