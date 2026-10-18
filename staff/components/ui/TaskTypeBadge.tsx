import { taskTypeLabel } from "@/lib/labels";
import type { TaskType } from "@/lib/types";

const ICONS: Record<TaskType, React.ReactNode> = {
  single_choice: (
    <>
      <path d="M3 4.5 4.25 5.75 6.5 3.5" />
      <path d="M8.5 4.5h4.5" />
      <circle cx="4.75" cy="11" r="1.5" />
      <path d="M8.5 11h4.5" />
    </>
  ),
  short_answer: (
    <>
      <path d="M10.5 2.75 13.25 5.5 6 12.75H3.25V10z" />
      <path d="M9 4.25 11.75 7" />
    </>
  ),
  memory: (
    <>
      <path d="M3 5.5h9.5M10 3l2.5 2.5L10 8" />
      <path d="M13 10.5H3.5M6 8l-2.5 2.5L6 13" />
    </>
  ),
};

export function TaskTypeBadge({ type }: { type: TaskType }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-infiro-border bg-white px-2.5 py-1 text-xs font-medium text-infiro-navy">
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[type]}
      </svg>
      {taskTypeLabel(type)}
    </span>
  );
}
