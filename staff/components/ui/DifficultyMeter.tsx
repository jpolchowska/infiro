import { difficultyLabel, type Tone } from "@/lib/labels";
import type { TaskDifficulty } from "@/lib/types";

const LEVELS: TaskDifficulty[] = [1, 2, 3];

const FILLS: Record<Tone, string> = {
  easy: "bg-tone-good",
  mid: "bg-tone-warn",
  hard: "bg-tone-bad",
  neutral: "bg-gray-300",
};

const TEXTS: Record<Tone, string> = {
  easy: "text-tone-good",
  mid: "text-tone-warn",
  hard: "text-tone-bad",
  neutral: "text-gray-500",
};

export function DifficultyMeter({ level }: { level: TaskDifficulty | null }) {
  const { label, variant } = difficultyLabel(level);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {LEVELS.map((step) => (
          <span
            key={step}
            className={`w-1.5 rounded-full ${level !== null && step <= level ? FILLS[variant] : "bg-gray-200"}`}
            style={{ height: `${6 + step * 3}px` }}
          />
        ))}
      </span>
      <span className={`font-medium ${TEXTS[variant]}`}>{label}</span>
    </span>
  );
}
