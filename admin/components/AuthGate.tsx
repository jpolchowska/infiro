"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { keycloak } from "@/lib/keycloak";
import { HeaderNav } from "@/components/HeaderNav";
import { LogoutButton } from "@/components/LogoutButton";

let keycloakInitPromise: Promise<boolean> | undefined;

function initializeKeycloak() {
  if (!keycloakInitPromise) {
    keycloakInitPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
  }

  return keycloakInitPromise;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    initializeKeycloak()
      .then((isAuthenticated) => {
        if (mounted) {
          setAuthenticated(isAuthenticated);
          setInitialized(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setInitialized(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (authenticated && pathname === "/login") {
      router.replace("/");
    } else if (!authenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [authenticated, initialized, pathname, router]);

  if (!initialized) {
    return <div className="flex min-h-[70vh] items-center justify-center text-sm text-gray-500">Ładowanie...</div>;
  }

  if (!authenticated) {
    return children;
  }

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
