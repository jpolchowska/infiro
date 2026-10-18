"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { keycloak } from "@/lib/keycloak";
import { REALM_ROLES, type StaffRole } from "@/lib/roles";

const TOKEN_MIN_VALIDITY_SECONDS = 30;

type AuthContextValue = {
  authenticated: boolean;
  initialized: boolean;
  role: StaffRole | null;
  firstName: string | null;
  getToken: () => Promise<string | undefined>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

function currentRole(): StaffRole | null {
  if (keycloak.hasRealmRole(REALM_ROLES.admin)) return "admin";
  if (keycloak.hasRealmRole(REALM_ROLES.teacher)) return "teacher";
  return null;
}

function currentFirstName(): string | null {
  const givenName = keycloak.tokenParsed?.given_name;
  return typeof givenName === "string" && givenName.trim() ? givenName.trim() : null;
}

function logout() {
  keycloak.logout({ redirectUri: `${window.location.origin}/login` });
}

async function getToken(): Promise<string | undefined> {
  if (!keycloak.authenticated) return undefined;
  try {
    await keycloak.updateToken(TOKEN_MIN_VALIDITY_SECONDS);
    return keycloak.token;
  } catch {
    logout();
    return undefined;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
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
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);
        if (mounted) setInitialized(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(TOKEN_MIN_VALIDITY_SECONDS).catch(() => {
        console.error("Token refresh failed, logging out");
        logout();
      });
    };

    return () => {
      keycloak.onTokenExpired = undefined;
    };
  }, [authenticated]);

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        initialized,
        role: authenticated ? currentRole() : null,
        firstName: authenticated ? currentFirstName() : null,
        getToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
