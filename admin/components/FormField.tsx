export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-infiro-navy focus:outline-none focus:ring-1 focus:ring-infiro-navy";
