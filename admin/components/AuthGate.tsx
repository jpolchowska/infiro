"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { HeaderNav } from "@/components/HeaderNav";
import { LogoutButton } from "@/components/LogoutButton";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { initialized, authenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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

  // Niezalogowany na innej stronie -> blokada (null), czekamy na router.replace("/login")
  if (!authenticated && pathname !== "/login") {
    return null;
  }

  // Niezalogowany na /login -> czyste children bez layoutu admina
  if (!authenticated && pathname === "/login") {
    return <>{children}</>;
  }

  // Zalogowany użytkownik -> pełny layout panelu
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