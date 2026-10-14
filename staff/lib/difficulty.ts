import type { TaskDifficulty } from "./types";

type DifficultyLabel = { label: string; variant: "easy" | "mid" | "hard" | "neutral" };

const LABELS: Record<TaskDifficulty, DifficultyLabel> = {
  1: { label: "Łatwy", variant: "easy" },
  2: { label: "Średni", variant: "mid" },
  3: { label: "Trudny", variant: "hard" },
};

export function difficultyLabel(level: TaskDifficulty | null): DifficultyLabel {
  return level === null ? { label: "—", variant: "neutral" } : LABELS[level];
}
