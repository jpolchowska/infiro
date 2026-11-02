export const DELETE_LINK =
  "relative inline-flex items-center gap-1.5 text-sm font-medium text-tone-bad after:absolute after:left-[2.5px] after:right-0 after:bottom-[3px] after:h-px after:bg-current after:opacity-0 hover:after:opacity-100 disabled:pointer-events-none disabled:opacity-40";

export function TrashIcon() {
  return (
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
      <path d="M2.75 4.25h10.5M6.25 4.25V2.75h3.5v1.5M4.25 4.25l.6 8.5a1 1 0 0 0 1 .93h4.3a1 1 0 0 0 1-.93l.6-8.5" />
    </svg>
  );
}
