import type { Tone } from "@/lib/labels";

const FILLS: Record<Tone, string> = {
  easy: "bg-tone-good",
  mid: "bg-tone-warn",
  hard: "bg-tone-bad",
  neutral: "bg-infiro-navy",
};

export function ProgressBar({ percent, tone = "neutral" }: { percent: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${FILLS[tone]}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
