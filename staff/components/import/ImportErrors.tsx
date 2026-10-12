const MAX_ERRORS_SHOWN = 20;

export function ImportErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="mt-6 max-w-xl rounded-sm border border-red-300 bg-red-50 p-5">
      <h2 className="text-sm font-semibold text-red-700">Popraw przed importem</h2>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-700">
        {errors.slice(0, MAX_ERRORS_SHOWN).map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
      {errors.length > MAX_ERRORS_SHOWN && (
        <p className="mt-2 text-xs text-red-600">…i {errors.length - MAX_ERRORS_SHOWN} więcej.</p>
      )}
    </div>
  );
}
