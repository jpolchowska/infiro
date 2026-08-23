"use client";

import { keycloak } from "@/lib/keycloak";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="-mt-16 w-full max-w-sm rounded-sm bg-white p-10 text-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="mx-auto h-14 w-14">
          <circle cx="32" cy="32" r="32" fill="#142284" />
          <text
            x="32"
            y="33"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="36"
            fontWeight="500"
            fill="#fff"
          >
            A
          </text>
        </svg>
        <h1 className="mt-4 text-xl font-semibold text-infiro-navy">Panel administratora</h1>
        <p className="mt-2 text-sm text-gray-600">Zaloguj się, aby zarządzać treścią aplikacji.</p>
        <button
          type="button"
          onClick={() => keycloak.login({ redirectUri: `${window.location.origin}/` })}
          className="mt-6 w-full rounded-sm bg-infiro-navy px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Zaloguj się
        </button>
      </div>
    </div>
  );
}
