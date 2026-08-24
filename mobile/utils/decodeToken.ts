// utils/decodeToken.ts
import { jwtDecode } from "jwt-decode";

interface KeycloakTokenPayload {
  user_role_test?: "Uczeń" | "Nauczyciel";
}

export function getAccountType(token: string): "Uczeń" | "Nauczyciel" | null {
  const decoded = jwtDecode<KeycloakTokenPayload>(token);
    
  // Wariant A: masz custom claim (zalecane, patrz punkt 2)
  if (decoded.user_role_test) return decoded.user_role_test;

  return null;
}