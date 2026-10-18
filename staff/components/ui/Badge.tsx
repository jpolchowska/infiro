import type { Tone } from "@/lib/labels";

const VARIANTS: Record<Tone, string> = {
  easy: "bg-tone-good-soft text-tone-good",
  mid: "bg-tone-warn-soft text-tone-warn",
  hard: "bg-tone-bad-soft text-tone-bad",
  neutral: "bg-gray-100 text-gray-600",
};

export function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: Tone }) {
  return (
    <span className={`inline-block rounded-sm px-2.5 py-[5px] text-[11.5px] leading-none font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
