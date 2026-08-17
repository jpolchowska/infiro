export function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-6 py-5">
      <div className="text-2xl font-semibold text-infiro-navy">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
    </div>
  );
}
