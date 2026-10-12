type JsonObject = Record<string, unknown>;

type ItemType = "single_choice" | "short_answer" | "memory";

const TASK_TYPES: readonly ItemType[] = ["single_choice", "short_answer", "memory"];
const FINAL_TEST_TYPES: readonly ItemType[] = ["single_choice", "short_answer"];
const THEMES = new Set(["default", "sport", "gry", "lego", "zwierzeta", "rysowanie", "muzyka", "jedzenie"]);
const OPTION_COUNT = 3;
const PAIR_COUNTS = [3, 6];
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 3;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidDifficulty(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= MIN_DIFFICULTY && (value as number) <= MAX_DIFFICULTY;
}

function validateOptions(options: unknown, label: string, errors: string[]) {
  if (!Array.isArray(options) || options.length !== OPTION_COUNT) {
    errors.push(`${label}: 'options' musi być listą dokładnie ${OPTION_COUNT} elementów.`);
    return;
  }

  options.forEach((option, index) => {
    if (!isObject(option) || !isNonEmptyString(option.text)) {
      errors.push(`${label} opcja #${index + 1}: 'text' musi być niepustym tekstem.`);
    }
  });

  const correctCount = options.filter((option) => isObject(option) && option.correct === true).length;
  if (correctCount !== 1) {
    errors.push(`${label}: dokładnie jedna opcja musi mieć "correct": true.`);
  }
}

function validateAnswers(answers: unknown, label: string, errors: string[]) {
  if (!Array.isArray(answers) || answers.length === 0 || !answers.every(isNonEmptyString)) {
    errors.push(`${label}: 'answers' musi być niepustą listą niepustych tekstów.`);
  }
}

function validatePairs(pairs: unknown, label: string, errors: string[]) {
  if (!Array.isArray(pairs) || !PAIR_COUNTS.includes(pairs.length)) {
    errors.push(`${label}: 'pairs' musi być listą długości 3 albo 6.`);
    return;
  }

  pairs.forEach((pair, index) => {
    if (!isObject(pair) || !isNonEmptyString(pair.a) || !isNonEmptyString(pair.b)) {
      errors.push(`${label} para #${index + 1}: 'a' i 'b' muszą być niepustymi tekstami.`);
    }
  });
}

const ANSWER_FIELDS: Record<ItemType, { field: string; validate: typeof validateOptions }> = {
  single_choice: { field: "options", validate: validateOptions },
  short_answer: { field: "answers", validate: validateAnswers },
  memory: { field: "pairs", validate: validatePairs },
};

function validateThemes(themes: JsonObject, type: ItemType, label: string, errors: string[]) {
  if (!("default" in themes)) {
    errors.push(`${label}: themes musi zawierać 'default'.`);
  }

  const { field, validate } = ANSWER_FIELDS[type];
  for (const [key, variant] of Object.entries(themes)) {
    const variantLabel = `${label} motyw '${key}'`;
    if (!THEMES.has(key)) {
      errors.push(`${label}: nieznany klucz motywu '${key}'.`);
    }
    if (!isObject(variant)) {
      errors.push(`${variantLabel}: musi być obiektem.`);
      continue;
    }
    if (!isNonEmptyString(variant.prompt)) {
      errors.push(`${variantLabel}: 'prompt' musi być niepustym tekstem.`);
    }
    if (key === "default" || field in variant) {
      validate(variant[field], variantLabel, errors);
    }
  }
}

function validateContentKey(
  item: JsonObject,
  label: string,
  contentKeys: Set<string>,
  errors: string[],
  required: boolean,
) {
  const contentKey = item.content_key;
  if ((contentKey === undefined || contentKey === null) && !required) return;

  if (!isNonEmptyString(contentKey)) {
    errors.push(`${label}: 'content_key' musi być niepustym tekstem.`);
  } else if (contentKeys.has(contentKey)) {
    errors.push(`${label}: 'content_key' "${contentKey}" powtarza się w pliku.`);
  } else {
    contentKeys.add(contentKey);
  }
}

function validateItemThemes(item: JsonObject, label: string, allowedTypes: readonly ItemType[], errors: string[]) {
  const type = item.type;
  if (typeof type !== "string" || !allowedTypes.includes(type as ItemType)) {
    errors.push(`${label}: 'type' musi być jednym z: ${allowedTypes.join(", ")}.`);
    return;
  }

  if (!isObject(item.themes)) {
    errors.push(`${label}: 'themes' musi być obiektem.`);
    return;
  }

  validateThemes(item.themes, type as ItemType, label, errors);
}

function validateTask(task: unknown, label: string, contentKeys: Set<string>, errors: string[]) {
  if (!isObject(task)) {
    errors.push(`${label}: musi być obiektem.`);
    return;
  }

  validateContentKey(task, label, contentKeys, errors, true);

  const hasKnownType = typeof task.type === "string" && TASK_TYPES.includes(task.type as ItemType);
  if (hasKnownType && task.type !== "memory" && !isValidDifficulty(task.difficulty)) {
    errors.push(`${label}: 'difficulty' musi być liczbą całkowitą ${MIN_DIFFICULTY}-${MAX_DIFFICULTY}.`);
  }

  validateItemThemes(task, label, TASK_TYPES, errors);
}

function validateQuestion(question: unknown, label: string, contentKeys: Set<string>, errors: string[]) {
  if (!isObject(question)) {
    errors.push(`${label}: musi być obiektem.`);
    return;
  }

  validateContentKey(question, label, contentKeys, errors, false);
  validateItemThemes(question, label, FINAL_TEST_TYPES, errors);
}

function validateSubsection(subsection: unknown, label: string, contentKeys: Set<string>, errors: string[]) {
  if (!isObject(subsection)) {
    errors.push(`${label}: musi być obiektem.`);
    return;
  }

  if (!isNonEmptyString(subsection.subsection)) {
    errors.push(`${label}: 'subsection' musi być niepustym tekstem.`);
  }

  if (!Array.isArray(subsection.tasks)) {
    errors.push(`${label}: 'tasks' musi być listą.`);
    return;
  }

  subsection.tasks.forEach((task, index) => {
    validateTask(task, `${label} / zadanie #${index + 1}`, contentKeys, errors);
  });
}

type ChildValidator = (child: unknown, label: string, contentKeys: Set<string>, errors: string[]) => void;

function validateSections(data: unknown, childrenField: string, childName: string, validateChild: ChildValidator) {
  if (!Array.isArray(data)) {
    return ["Plik musi zawierać tablicę JSON sekcji."];
  }
  if (data.length === 0) {
    return ["Plik nie zawiera żadnych sekcji."];
  }

  const errors: string[] = [];
  const contentKeys = new Set<string>();

  data.forEach((section, sectionIndex) => {
    const label = `sekcja #${sectionIndex + 1}`;
    if (!isObject(section)) {
      errors.push(`${label}: musi być obiektem.`);
      return;
    }

    if (!isNonEmptyString(section.section)) {
      errors.push(`${label}: 'section' musi być niepustym tekstem.`);
    }

    const children = section[childrenField];
    if (!Array.isArray(children)) {
      errors.push(`${label}: '${childrenField}' musi być listą.`);
      return;
    }

    children.forEach((child, childIndex) => {
      validateChild(child, `${label} / ${childName} #${childIndex + 1}`, contentKeys, errors);
    });
  });

  return errors;
}

export function validateTaskImport(data: unknown): string[] {
  return validateSections(data, "subsections", "podsekcja", validateSubsection);
}

export function validateFinalTestImport(data: unknown): string[] {
  return validateSections(data, "questions", "pytanie", validateQuestion);
}
