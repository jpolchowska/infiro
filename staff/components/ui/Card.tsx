export function Card({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-infiro-border bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-infiro-navy">{title}</h2>
        {aside && <div className="text-sm text-gray-500">{aside}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
