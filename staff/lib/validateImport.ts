type Unknown = Record<string, unknown>;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// Mirrors backend/app/routes/admin_import.py's validate_import_payload — keep in sync with it.
export function validateImportPayload(data: unknown): string[] {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return ["Plik musi zawierać tablicę JSON zadań."];
  }
  if (data.length === 0) {
    return ["Plik nie zawiera żadnych zadań."];
  }

  data.forEach((rawItem, i) => {
    if (typeof rawItem !== "object" || rawItem === null || Array.isArray(rawItem)) {
      errors.push(`zadanie #${i + 1}: musi być obiektem.`);
      return;
    }
    const item = rawItem as Unknown;
    const label = `zadanie #${i + 1} (${String(item.section ?? "?")} / ${String(item.subsection ?? "?")})`;

    for (const field of ["section", "subsection", "difficulty", "title", "question", "options"]) {
      if (!(field in item)) errors.push(`${label}: brak pola '${field}'.`);
    }
    if ("section" in item && !isNonEmptyString(item.section)) {
      errors.push(`${label}: 'section' musi być niepustym tekstem.`);
    }
    if ("subsection" in item && !isNonEmptyString(item.subsection)) {
      errors.push(`${label}: 'subsection' musi być niepustym tekstem.`);
    }
    if ("title" in item && !isNonEmptyString(item.title)) {
      errors.push(`${label}: 'title' musi być niepustym tekstem.`);
    }
    if ("question" in item && !isNonEmptyString(item.question)) {
      errors.push(`${label}: 'question' musi być niepustym tekstem.`);
    }

    const difficulty = item.difficulty;
    if (
      typeof difficulty !== "number" ||
      !Number.isInteger(difficulty) ||
      difficulty < 1 ||
      difficulty > 3
    ) {
      errors.push(`${label}: 'difficulty' musi być liczbą całkowitą 1-3.`);
    }

    const options = item.options;
    if (!Array.isArray(options) || options.length < 2) {
      errors.push(`${label}: 'options' musi być listą z co najmniej 2 elementami.`);
      return;
    }
    let correctCount = 0;
    options.forEach((rawOpt, j) => {
      const olabel = `${label} opcja #${j + 1}`;
      if (typeof rawOpt !== "object" || rawOpt === null || Array.isArray(rawOpt)) {
        errors.push(`${olabel}: musi być obiektem.`);
        return;
      }
      const opt = rawOpt as Unknown;
      if (!isNonEmptyString(opt.text)) {
        errors.push(`${olabel}: 'text' musi być niepustym tekstem.`);
      }
      if (typeof opt.correct !== "boolean") {
        errors.push(`${olabel}: 'correct' musi być wartością true/false.`);
      } else if (opt.correct) {
        correctCount += 1;
      }
    });
    if (correctCount !== 1) {
      errors.push(
        `${label}: dokładnie jedna opcja musi mieć "correct": true (znaleziono ${correctCount}).`
      );
    }
  });

  return errors;
}
