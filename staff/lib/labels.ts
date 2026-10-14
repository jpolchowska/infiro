import type { LevelingTestStatus, TaskDifficulty, TaskType } from "./types";

const TASK_TYPES: Record<TaskType, string> = {
  single_choice: "Zamknięte",
  short_answer: "Otwarte",
  memory: "Memory",
};

const THEMES: Record<string, string> = {
  default: "Bez motywu",
  sport: "Sport",
  gry: "Gry",
  lego: "Klocki",
  zwierzeta: "Zwierzęta",
  rysowanie: "Rysowanie i sztuka",
  muzyka: "Muzyka i taniec",
  jedzenie: "Jedzenie i gotowanie",
};

const LEVELING_TEST_STATUSES: Record<
  LevelingTestStatus,
  { label: string; variant: "easy" | "mid" | "hard" | "neutral" }
> = {
  not_taken: { label: "Nierozwiązany", variant: "neutral" },
  up_to_date: { label: "Aktualny", variant: "easy" },
  due: { label: "Do zrobienia", variant: "mid" },
  overdue: { label: "Zaległy", variant: "hard" },
};

export function taskTypeLabel(type: TaskType): string {
  return TASK_TYPES[type];
}

export function themeLabel(theme: string | null): string {
  if (theme === null) return "—";
  return THEMES[theme] ?? theme;
}

export function levelingTestStatusLabel(status: LevelingTestStatus) {
  return LEVELING_TEST_STATUSES[status];
}

type DifficultyLabel = { label: string; variant: "easy" | "mid" | "hard" | "neutral" };

const DIFFICULTIES: Record<TaskDifficulty, DifficultyLabel> = {
  1: { label: "Łatwy", variant: "easy" },
  2: { label: "Średni", variant: "mid" },
  3: { label: "Trudny", variant: "hard" },
};

export function difficultyLabel(level: TaskDifficulty | null): DifficultyLabel {
  return level === null ? { label: "—", variant: "neutral" } : DIFFICULTIES[level];
}
