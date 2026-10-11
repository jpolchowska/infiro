from app.models.task_answer_options import TaskAnswerOption


def resolve_theme(item, interest):
    themes = item.themes if isinstance(item.themes, dict) else {}
    default = themes.get("default", {})
    selected = themes.get(interest, {}) if interest else {}

    if not isinstance(default, dict):
        default = {}
    if not isinstance(selected, dict):
        selected = {}

    return {**default, **selected}


def themed_options(options, theme_options):
    if isinstance(theme_options, list) and len(theme_options) == len(options):
        return [
            {
                "id": option.id,
                "text": option_data["text"],
                "is_correct": option_data.get("correct") is True,
            }
            for option, option_data in zip(options, theme_options)
        ]
    return [
        {
            "id": option.id,
            "text": option.option_text,
            "is_correct": option.is_correct,
        }
        for option in options
    ]


def task_options(task, interest):
    options = (
        TaskAnswerOption.query
        .filter_by(task_id=task.id)
        .order_by(TaskAnswerOption.order_index)
        .all()
    )
    return themed_options(options, resolve_theme(task, interest).get("options"))


def merge_theme_variants(themes):
    default = themes["default"]
    return {
        key: {**default, **variant}
        for key, variant in themes.items()
    }
