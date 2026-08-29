// utils/decodeToken.ts
import { jwtDecode } from "jwt-decode";

interface KeycloakTokenPayload {
  user_role_test?: "Uczeń" | "Nauczyciel";
  given_name?: string;
}

export function getAccountType(token: string): "Uczeń" | "Nauczyciel" | null {
  const decoded = jwtDecode<KeycloakTokenPayload>(token);

  // Wariant A: masz custom claim (zalecane, patrz punkt 2)
  if (decoded.user_role_test) return decoded.user_role_test;

  return null;
}

/** Imię wprost z tokena Keycloaka -- nie wymaga żadnego zapytania do backendu. */
export function getGivenName(token: string): string | null {
  const decoded = jwtDecode<KeycloakTokenPayload>(token);
  return decoded.given_name ?? null;
}