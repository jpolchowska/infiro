ALLOWED_TASK_TYPES = ("single_choice", "short_answer", "memory")
ALLOWED_SECTION_TEST_TYPES = ("single_choice", "short_answer")
ALLOWED_THEMES = {
    "default", "sport", "gry", "lego", "zwierzeta",
    "rysowanie", "muzyka", "jedzenie",
}
OPTION_COUNT = 3
MEMORY_DIFFICULTY_BY_PAIRS = {3: 2, 6: 3}
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 3


def _is_non_empty_string(value):
    return isinstance(value, str) and value.strip() != ""


def _is_valid_difficulty(value):
    return (
        isinstance(value, int)
        and not isinstance(value, bool)
        and MIN_DIFFICULTY <= value <= MAX_DIFFICULTY
    )


def _validate_options(options, label, errors):
    if not isinstance(options, list) or len(options) != OPTION_COUNT:
        errors.append(f"{label}: 'options' must be a list of exactly {OPTION_COUNT} items")
        return

    for index, option in enumerate(options, start=1):
        if not isinstance(option, dict) or not _is_non_empty_string(option.get("text")):
            errors.append(f"{label} option #{index}: 'text' must be a non-empty string")

    correct_count = sum(
        1 for option in options
        if isinstance(option, dict) and option.get("correct") is True
    )
    if correct_count != 1:
        errors.append(f"{label}: exactly one option must have \"correct\": true")


def _validate_answers(answers, label, errors):
    if (
        not isinstance(answers, list)
        or not answers
        or not all(_is_non_empty_string(answer) for answer in answers)
    ):
        errors.append(f"{label}: 'answers' must be a non-empty list of non-empty strings")


def _validate_pairs(pairs, label, errors):
    if not isinstance(pairs, list) or len(pairs) not in MEMORY_DIFFICULTY_BY_PAIRS:
        errors.append(f"{label}: 'pairs' must be a list of 3 or 6 items")
        return

    for index, pair in enumerate(pairs, start=1):
        if (
            not isinstance(pair, dict)
            or not _is_non_empty_string(pair.get("a"))
            or not _is_non_empty_string(pair.get("b"))
        ):
            errors.append(f"{label} pair #{index}: 'a' and 'b' must be non-empty strings")


ANSWER_FIELD_BY_TYPE = {
    "single_choice": ("options", _validate_options),
    "short_answer": ("answers", _validate_answers),
    "memory": ("pairs", _validate_pairs),
}


def _validate_themes(themes, task_type, label, errors):
    if "default" not in themes:
        errors.append(f"{label}: 'themes' must contain 'default'")

    field, validate_field = ANSWER_FIELD_BY_TYPE[task_type]
    for key, variant in themes.items():
        variant_label = f"{label} theme '{key}'"
        if key not in ALLOWED_THEMES:
            errors.append(f"{label}: unknown theme key '{key}'")
        if not isinstance(variant, dict):
            errors.append(f"{variant_label}: must be an object")
            continue
        if not _is_non_empty_string(variant.get("prompt")):
            errors.append(f"{variant_label}: 'prompt' must be a non-empty string")
        if key == "default" or field in variant:
            validate_field(variant.get(field), variant_label, errors)


def _validate_content_key(item, label, content_keys, errors, required):
    content_key = item.get("content_key")
    if content_key is None and not required:
        return

    if not _is_non_empty_string(content_key):
        errors.append(f"{label}: 'content_key' must be a non-empty string")
    elif content_key in content_keys:
        errors.append(f"{label}: duplicate content_key '{content_key}'")
    else:
        content_keys.add(content_key)


def _validate_item_themes(item, label, allowed_types, errors):
    item_type = item.get("type")
    if item_type not in allowed_types:
        errors.append(f"{label}: 'type' must be one of: {', '.join(allowed_types)}")
        return

    themes = item.get("themes")
    if not isinstance(themes, dict):
        errors.append(f"{label}: 'themes' must be an object")
        return

    _validate_themes(themes, item_type, label, errors)


def _validate_task(task, label, content_keys, errors):
    if not isinstance(task, dict):
        errors.append(f"{label}: must be an object")
        return

    _validate_content_key(task, label, content_keys, errors, required=True)

    if (
        task.get("type") in ALLOWED_TASK_TYPES
        and task["type"] != "memory"
        and not _is_valid_difficulty(task.get("difficulty"))
    ):
        errors.append(
            f"{label}: 'difficulty' must be an integer {MIN_DIFFICULTY}-{MAX_DIFFICULTY}"
        )

    _validate_item_themes(task, label, ALLOWED_TASK_TYPES, errors)


def _validate_question(question, label, content_keys, errors):
    if not isinstance(question, dict):
        errors.append(f"{label}: must be an object")
        return

    _validate_content_key(question, label, content_keys, errors, required=False)
    _validate_item_themes(question, label, ALLOWED_SECTION_TEST_TYPES, errors)


def _validate_subsection(subsection, label, content_keys, errors):
    if not isinstance(subsection, dict):
        errors.append(f"{label}: must be an object")
        return

    if not _is_non_empty_string(subsection.get("subsection")):
        errors.append(f"{label}: 'subsection' must be a non-empty string")

    tasks = subsection.get("tasks")
    if not isinstance(tasks, list):
        errors.append(f"{label}: 'tasks' must be a list")
        return

    for index, task in enumerate(tasks, start=1):
        _validate_task(task, f"{label} / task #{index}", content_keys, errors)


def _validate_sections(data, children_field, validate_child, child_name):
    if not isinstance(data, list):
        return ["payload must be a JSON array of sections"]
    if not data:
        return ["payload does not contain any sections"]

    errors = []
    content_keys = set()

    for section_index, section in enumerate(data, start=1):
        label = f"section #{section_index}"
        if not isinstance(section, dict):
            errors.append(f"{label}: must be an object")
            continue

        if not _is_non_empty_string(section.get("section")):
            errors.append(f"{label}: 'section' must be a non-empty string")

        children = section.get(children_field)
        if not isinstance(children, list):
            errors.append(f"{label}: '{children_field}' must be a list")
            continue

        for child_index, child in enumerate(children, start=1):
            validate_child(child, f"{label} / {child_name} #{child_index}", content_keys, errors)

    return errors


def validate_task_import(data):
    return _validate_sections(data, "subsections", _validate_subsection, "subsection")


def validate_section_test_import(data):
    return _validate_sections(data, "questions", _validate_question, "question")
