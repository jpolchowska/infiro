type Unknown = Record<string, unknown>;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// Mirrors backend/app/routes/admin_import.py's validate_import_payload — keep in sync with it.
export function validateImportPayload(data: unknown): string[] {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    return ["Plik musi zawierać tablicę JSON sekcji."];
  }
  if (data.length === 0) {
    return ["Plik nie zawiera żadnych sekcji."];
  }

  data.forEach((rawItem, i) => {
    if (typeof rawItem !== "object" || rawItem === null || Array.isArray(rawItem)) {
      errors.push(`zadanie #${i + 1}: musi być obiektem.`);
      return;
    }
    const section = rawItem as Unknown;
    const sectionLabel = `sekcja #${i + 1}`;
    if (!isNonEmptyString(section.section)) errors.push(`${sectionLabel}: 'section' musi być niepustym tekstem.`);
    if (!Array.isArray(section.subsections)) {
      errors.push(`${sectionLabel}: 'subsections' musi być listą.`);
      return;
    }
    section.subsections.forEach((rawSubsection, j) => {
      const subsectionLabel = `${sectionLabel} / podsekcja #${j + 1}`;
      if (typeof rawSubsection !== "object" || rawSubsection === null || Array.isArray(rawSubsection)) {
        errors.push(`${subsectionLabel}: musi być obiektem.`);
        return;
      }
      const subsection = rawSubsection as Unknown;
      if (!isNonEmptyString(subsection.subsection)) errors.push(`${subsectionLabel}: 'subsection' musi być niepustym tekstem.`);
      if (!Array.isArray(subsection.tasks)) {
        errors.push(`${subsectionLabel}: 'tasks' musi być listą.`);
        return;
      }
      subsection.tasks.forEach((rawTask, k) => validateTask(rawTask, `${subsectionLabel} / zadanie #${k + 1}`, errors));
    });
  });

  return errors;
}

const ALLOWED_TYPES = new Set(["single_choice", "short_answer", "memory"]);
const ALLOWED_THEMES = new Set(["default", "sport", "gry", "lego", "zwierzeta", "rysowanie", "muzyka", "jedzenie"]);

function validateTask(rawTask: unknown, label: string, errors: string[]) {
  if (typeof rawTask !== "object" || rawTask === null || Array.isArray(rawTask)) {
    errors.push(`${label}: musi być obiektem.`);
    return;
  }
  const task = rawTask as Unknown;
  if (typeof task.content_key !== "undefined" && !isNonEmptyString(task.content_key)) errors.push(`${label}: 'content_key' musi być niepustym tekstem.`);
  const type = task.type;
  if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
    errors.push(`${label}: 'type' musi być jednym z: single_choice, short_answer, memory.`);
    return;
  }
  if (type !== "memory" && (!Number.isInteger(task.difficulty) || (task.difficulty as number) < 1 || (task.difficulty as number) > 3)) errors.push(`${label}: 'difficulty' musi być liczbą całkowitą 1-3.`);
  if (typeof task.themes !== "object" || task.themes === null || Array.isArray(task.themes)) {
    errors.push(`${label}: 'themes' musi być obiektem.`);
    return;
  }
  const themes = task.themes as Unknown;
  if (!("default" in themes)) errors.push(`${label}: themes musi zawierać 'default'.`);
  for (const [key, rawVariant] of Object.entries(themes)) {
    if (!ALLOWED_THEMES.has(key)) errors.push(`${label}: nieznany klucz motywu '${key}'.`);
    if (typeof rawVariant !== "object" || rawVariant === null || Array.isArray(rawVariant)) {
      errors.push(`${label} motyw '${key}': musi być obiektem.`);
      continue;
    }
    const variant = rawVariant as Unknown;
    if (!isNonEmptyString(variant.prompt)) errors.push(`${label} motyw '${key}': 'prompt' musi być niepustym tekstem.`);
    if (type === "single_choice" && (key === "default" || "options" in variant)) validateOptions(variant.options, `${label} motyw '${key}'`, errors);
    if (type === "short_answer" && (key === "default" || "answers" in variant)) validateAnswers(variant.answers, `${label} motyw '${key}'`, errors);
    if (type === "memory" && (key === "default" || "pairs" in variant)) validatePairs(variant.pairs, `${label} motyw '${key}'`, errors);
  }
}

function validateOptions(value: unknown, label: string, errors: string[]) {
  if (!Array.isArray(value) || value.length !== 3) { errors.push(`${label}: 'options' musi być listą dokładnie 3 elementów.`); return; }
  const correct = value.filter((option) => typeof option === "object" && option !== null && !Array.isArray(option) && (option as Unknown).correct === true);
  value.forEach((option, i) => { if (typeof option !== "object" || option === null || Array.isArray(option) || !isNonEmptyString((option as Unknown).text)) errors.push(`${label} opcja #${i + 1}: 'text' musi być niepustym tekstem.`); });
  if (correct.length !== 1) errors.push(`${label}: dokładnie jedna opcja musi mieć "correct": true.`);
}

function validateAnswers(value: unknown, label: string, errors: string[]) {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyString)) errors.push(`${label}: 'answers' musi być niepustą listą niepustych tekstów.`);
}

function validatePairs(value: unknown, label: string, errors: string[]) {
  if (!Array.isArray(value) || ![3, 6].includes(value.length)) { errors.push(`${label}: 'pairs' musi być listą długości 3 albo 6.`); return; }
  value.forEach((pair, i) => { if (typeof pair !== "object" || pair === null || Array.isArray(pair) || !isNonEmptyString((pair as Unknown).a) || !isNonEmptyString((pair as Unknown).b)) errors.push(`${label} para #${i + 1}: 'a' i 'b' muszą być niepustymi tekstami.`); });
}
