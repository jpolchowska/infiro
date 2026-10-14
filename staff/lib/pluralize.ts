export type PluralForms =
  | readonly [one: string, few: string, many: string]
  | readonly [one: string, few: string, many: string, compoundFew: string];

export const WORDS = {
  task: ["zadanie", "zadania", "zadań"],
  subsection: ["podsekcja", "podsekcje", "podsekcji"],
  section: ["dział", "działy", "działów"],
  question: ["pytanie", "pytania", "pytań"],
  attempt: ["próba", "próby", "prób"],
  testAttempt: ["podejście", "podejścia", "podejść"],
  student: ["uczeń", "uczniowie", "uczniów", "uczniów"],
} as const satisfies Record<string, PluralForms>;

export function pluralForm(count: number, forms: PluralForms): string {
  const [one, few, many] = forms;
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (count === 1) return one;
  if (lastDigit < 2 || lastDigit > 4 || (lastTwoDigits >= 12 && lastTwoDigits <= 14)) return many;
  return count <= 4 ? few : (forms[3] ?? few);
}

export function pluralize(count: number, forms: PluralForms): string {
  return `${count} ${pluralForm(count, forms)}`;
}
