import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold text-infiro-navy">Nie znaleziono strony</h1>
      <p className="mt-2 text-sm text-gray-600">Ta strona nie istnieje albo została usunięta.</p>
      <Link
        href="/"
        className="mt-6 rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Wróć do panelu
      </Link>
    </div>
  );
}
