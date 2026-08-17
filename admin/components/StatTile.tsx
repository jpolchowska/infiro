const ACCENT_BORDER = {
  navy: "border-l-infiro-navy",
  coral: "border-l-infiro-coral",
  peach: "border-l-infiro-peach",
  purple: "border-l-infiro-purple",
} as const;

export function StatTile({
  value,
  label,
  accent = "navy",
}: {
  value: string | number;
  label: string;
  accent?: keyof typeof ACCENT_BORDER;
}) {
  return (
    <div
      className={`rounded-sm border border-gray-200 border-l-4 bg-white px-6 py-5 ${ACCENT_BORDER[accent]}`}
    >
      <div className="text-2xl font-semibold text-infiro-navy">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
    </div>
  );
}
