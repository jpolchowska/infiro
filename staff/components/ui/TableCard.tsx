export const COLUMN_HEADER = "whitespace-nowrap px-6 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500";

export const TABLE_ROW = "border-b border-gray-100 last:border-0 hover:bg-background/40";

export function TableCard({
  title,
  count,
  children,
}: {
  title: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-sm border border-infiro-border bg-white">
      <div className="flex items-baseline gap-3 border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-infiro-navy">{title}</h2>
        {count && <span className="text-sm text-gray-500">{count}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </section>
  );
}
