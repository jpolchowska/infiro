"use client";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-sm border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-infiro-navy">Panel administratora</h1>
        <p className="mt-2 text-sm text-gray-600">Zaloguj się, aby zarządzać treścią aplikacji.</p>
        <button
          type="button"
          onClick={() => console.log("login via keycloak")}
          className="mt-6 w-full rounded-sm bg-infiro-navy px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Zaloguj się
        </button>
      </div>
    </div>
  );
}
