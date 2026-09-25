"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Keycloak from "keycloak-js";
import { keycloak } from "@/lib/keycloak";

interface AuthContextType {
  authenticated: boolean;
  initialized: boolean;
  token: string | undefined;
  keycloak: Keycloak;
  getToken: () => Promise<string | undefined>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    initializeKeycloak()
      .then((isAuth) => {
        if (mounted) {
          setAuthenticated(isAuth);
          setToken(keycloak.token);
          setInitialized(true);
        }
      })
      .catch((err) => {
        console.error("Keycloak init error:", err);
        if (mounted) {
          setInitialized(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            setToken(keycloak.token);
          }
        })
        .catch(() => {
          console.error("Nie udało się odświeżyć tokena - wylogowywanie");
          keycloak.logout();
        });
    };

    const interval = setInterval(() => {
      keycloak
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed) {
            setToken(keycloak.token);
          }
        })
        .catch((err) => {
          console.error("Błąd podczas automatycznego odświeżania tokena:", err);
        });
    }, 20000);

    return () => {
      clearInterval(interval);
      keycloak.onTokenExpired = undefined;
    };
  }, [authenticated]);

  const getToken = async (): Promise<string | undefined> => {
    if (!keycloak.authenticated) return undefined;
    try {
      await keycloak.updateToken(30);
      setToken(keycloak.token);
      return keycloak.token;
    } catch {
      keycloak.logout();
      return undefined;
    }
  };

  const logout = () => {
    keycloak.logout({ redirectUri: window.location.origin + "/login" });
  };

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        initialized,
        token,
        keycloak,
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
    throw new Error("useAuth musi być użyte wewnątrz AuthProvider");
  }
  return context;
}
