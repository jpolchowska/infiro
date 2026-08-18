const STUDENT_THEME_IDS = new Set(["default", "lol", "mario", "roblox"]);

type Unknown = Record<string, unknown>;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// Mirrors backend/app.py's validate_import_payload — keep in sync with it
// once the real import endpoint exists.
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

    for (const field of ["section", "subsection", "difficulty", "variants"]) {
      if (!(field in item)) errors.push(`${label}: brak pola '${field}'.`);
    }
    if ("section" in item && !isNonEmptyString(item.section)) {
      errors.push(`${label}: 'section' musi być niepustym tekstem.`);
    }
    if ("subsection" in item && !isNonEmptyString(item.subsection)) {
      errors.push(`${label}: 'subsection' musi być niepustym tekstem.`);
    }

    const difficulty = item.difficulty;
    if (
      typeof difficulty !== "number" ||
      !Number.isInteger(difficulty) ||
      difficulty < 1 ||
      difficulty > 5
    ) {
      errors.push(`${label}: 'difficulty' musi być liczbą całkowitą 1-5.`);
    }

    const variants = item.variants;
    if (typeof variants !== "object" || variants === null || Array.isArray(variants)) {
      errors.push(`${label}: 'variants' musi być obiektem.`);
      return;
    }
    const variantsObj = variants as Unknown;
    if (!("default" in variantsObj)) {
      errors.push(`${label}: warianty muszą zawierać wpis 'default'.`);
    }
    const unknownThemes = Object.keys(variantsObj).filter((t) => !STUDENT_THEME_IDS.has(t));
    if (unknownThemes.length > 0) {
      errors.push(`${label}: nieznane motywy: ${unknownThemes.join(", ")}.`);
    }

    for (const [theme, rawVariant] of Object.entries(variantsObj)) {
      if (!STUDENT_THEME_IDS.has(theme)) continue;
      const vlabel = `${label} [${theme}]`;
      if (typeof rawVariant !== "object" || rawVariant === null || Array.isArray(rawVariant)) {
        errors.push(`${vlabel}: musi być obiektem.`);
        continue;
      }
      const variant = rawVariant as Unknown;

      for (const field of ["title", "question", "options"]) {
        if (!(field in variant)) errors.push(`${vlabel}: brak pola '${field}'.`);
      }
      if ("title" in variant && !isNonEmptyString(variant.title)) {
        errors.push(`${vlabel}: 'title' musi być niepustym tekstem.`);
      }
      if ("question" in variant && !isNonEmptyString(variant.question)) {
        errors.push(`${vlabel}: 'question' musi być niepustym tekstem.`);
      }

      const options = variant.options;
      if (!Array.isArray(options) || options.length < 2) {
        errors.push(`${vlabel}: 'options' musi być listą z co najmniej 2 elementami.`);
        continue;
      }
      let correctCount = 0;
      options.forEach((rawOpt, j) => {
        const olabel = `${vlabel} opcja #${j + 1}`;
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
          `${vlabel}: dokładnie jedna opcja musi mieć "correct": true (znaleziono ${correctCount}).`
        );
      }
    }
  });

  return errors;
}
