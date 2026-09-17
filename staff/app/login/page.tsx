"use client";

import { keycloak } from "@/lib/keycloak";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="-mt-16 w-full max-w-sm rounded-sm bg-white p-10 text-center shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/infiro-logo.png" alt="Infiro" className="mx-auto h-[60px] w-auto" />
        <p className="mt-5 text-sm text-gray-600">
          Zaloguj się, aby zarządzać treścią aplikacji lub przeglądać postępy uczniów.
        </p>
        <button
          type="button"
          onClick={() => keycloak.login({ redirectUri: `${window.location.origin}/` })}
          className="mt-6 w-full rounded-sm bg-infiro-navy px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Zaloguj się jako nauczyciel
        </button>
        <button
          type="button"
          onClick={() => keycloak.login({ redirectUri: `${window.location.origin}/` })}
          className="mt-3 w-full rounded-sm border border-infiro-navy px-4 py-2.5 text-sm font-medium text-infiro-navy hover:bg-infiro-navy/5"
        >
          Zaloguj się jako administrator
        </button>
      </div>
    </div>
  );
}
