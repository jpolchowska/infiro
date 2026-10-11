from flask import request


def json_body():
    return request.get_json(silent=True)


def json_object():
    body = json_body()
    return body if isinstance(body, dict) else None
