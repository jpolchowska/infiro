"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { HeaderNav } from "@/components/HeaderNav";
import { LogoutButton } from "@/components/LogoutButton";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { initialized, authenticated, keycloak, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Sprawdzamy, czy zalogowany użytkownik ma przypisaną rolę "admin" w Realm
  const isAdmin = authenticated && keycloak?.hasRealmRole("admin");

  useEffect(() => {
    if (!initialized) return;

    if (authenticated && pathname === "/login") {
      router.replace("/");
    } else if (!authenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [authenticated, initialized, pathname, router]);

  if (!initialized) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-gray-500">
        Ładowanie...
      </div>
    );
  }

  if (!authenticated && pathname !== "/login") {
    return null;
  }

  if (!authenticated && pathname === "/login") {
    return <>{children}</>;
  }

  // ⛔ Zalogowany, ale bez roli admina -> Blokada 403
  if (authenticated && !isAdmin) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Brak dostępu (403)</h1>
        <p className="mt-2 text-sm text-gray-600">
          Twoje konto nie posiada uprawnień administratora do tego panelu.
        </p>
        <button
          onClick={logout}
          className="mt-6 rounded bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Wyloguj się
        </button>
      </div>
    );
  }

  // ✅ Zalogowany administrator -> Pełny panel
  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-infiro-navy">Panel administratora</span>
          <div className="flex items-center gap-8">
            <HeaderNav />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </>
  );
}