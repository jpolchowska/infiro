import jsonschema
from flask import current_app

from app.extensions import db


def matches_schema(data, schema, label):
    try:
        jsonschema.validate(instance=data, schema=schema)
        return True
    except jsonschema.exceptions.ValidationError as err:
        current_app.logger.warning("%s validation failed: %s", label, err.message)
        return False


def sync_answer_options(option_model, owner, options):
    existing = option_model.query.filter_by(**owner).order_by(option_model.order_index).all()
    for index, option_data in enumerate(options, start=1):
        if index <= len(existing):
            option = existing[index - 1]
            option.option_text = option_data["text"].strip()
            option.is_correct = option_data.get("correct") is True
            option.order_index = index
        else:
            db.session.add(option_model(
                **owner,
                option_text=option_data["text"].strip(),
                is_correct=option_data.get("correct") is True,
                order_index=index,
            ))
