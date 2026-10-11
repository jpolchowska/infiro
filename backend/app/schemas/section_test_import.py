ALLOWED_SECTION_TEST_TYPES = {"single_choice", "short_answer"}

SECTION_TEST_IMPORT_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "array",
    "items": {
        "type": "object",
        "required": ["section", "questions"],
        "properties": {
            "section": {"type": "string"},
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["type", "themes"],
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": list(ALLOWED_SECTION_TEST_TYPES),
                        },
                        "content_key": {"type": "string"},
                        "themes": {
                            "type": "object",
                            "required": ["default"],
                            "additionalProperties": {
                                "type": "object",
                                "required": ["prompt"],
                                "properties": {
                                    "prompt": {"type": "string"},
                                    "options": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "required": ["text"],
                                            "properties": {
                                                "text": {"type": "string"},
                                                "correct": {"type": "boolean"}
                                            }
                                        }
                                    },
                                    "answers": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
