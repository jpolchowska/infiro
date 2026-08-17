import type { TaskDifficulty } from "./types";

export function difficultyLabel(level: TaskDifficulty): { label: string; variant: "easy" | "mid" | "hard" } {
  if (level <= 2) return { label: "Łatwy", variant: "easy" };
  if (level === 3) return { label: "Średni", variant: "mid" };
  return { label: "Trudny", variant: "hard" };
}
