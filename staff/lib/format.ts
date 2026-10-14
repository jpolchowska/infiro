export function formatRelativeDate(iso: string | null): string {
  if (!iso) return "—";

  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "dzisiaj";
  if (diffDays === 1) return "wczoraj";
  if (diffDays < 7) return `${diffDays} dni temu`;
  return date.toLocaleDateString("pl-PL");
}

export function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("pl-PL") : "—";
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

export function ratioPercent(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}
