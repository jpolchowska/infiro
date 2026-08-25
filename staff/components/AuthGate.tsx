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

  // Sprawdzamy role realmowe -- panel obsługuje zarówno admina, jak i nauczyciela.
  const isAdmin = authenticated && keycloak?.hasRealmRole("admin");
  const isTeacher = authenticated && keycloak?.hasRealmRole("ROLE_TEACHER");
  const role: "admin" | "teacher" | null = isAdmin ? "admin" : isTeacher ? "teacher" : null;

  useEffect(() => {
    if (!initialized) return;

    if (authenticated && pathname === "/login") {
      router.replace("/");
    } else if (!authenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [authenticated, initialized, pathname, router]);

  useEffect(() => {
    if (role) {
      document.title = role === "admin" ? "Panel administratora" : "Panel nauczyciela";
    }
  }, [role, pathname]);

  // Favicon zależny od roli -- admin zostaje przy statycznym /icon.svg (litera "A"),
  // nauczyciel dostaje wersję z "N" wygenerowaną w tym samym stylu.
  useEffect(() => {
    if (!role) return;

    const link =
      document.querySelector<HTMLLinkElement>("link[rel='icon'][type='image/svg+xml']") ??
      document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) return;

    if (role === "teacher") {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#142284"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="500" fill="#fff">N</text></svg>`;
      link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    } else {
      link.href = "/icon.svg";
    }
  }, [role, pathname]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="-mt-16 h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
  }

  if (!authenticated && pathname !== "/login") {
    return null;
  }

  if (!authenticated && pathname === "/login") {
    return <>{children}</>;
  }

  // Zalogowany, ale bez roli admina ani nauczyciela -> Blokada 403
  if (authenticated && role === null) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Brak dostępu (403)</h1>
        <p className="mt-2 text-sm text-gray-600">
          Twoje konto nie posiada uprawnień do tego panelu.
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

  // Zalogowany administrator lub nauczyciel -> Pełny panel
  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-infiro-navy">
            {role === "admin" ? "Panel administratora" : "Panel nauczyciela"}
          </span>
          <div className="flex items-center gap-8">
            <HeaderNav role={role as "admin" | "teacher"} />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </>
  );
}