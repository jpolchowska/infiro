const VARIANTS = {
  easy: "bg-green-50 text-green-700",
  mid: "bg-amber-50 text-amber-700",
  hard: "bg-red-50 text-red-700",
  neutral: "bg-gray-100 text-gray-600",
} as const;

export function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
