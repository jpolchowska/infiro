import { jwtDecode } from "jwt-decode";

interface KeycloakTokenPayload {
  realm_access?: {
    roles?: string[];
  };
  user_role_test?: "Nauczyciel" | "Uczeń";
}

export function getAccountType(token: string): "Nauczyciel" | "Uczeń" | null {
  const decoded = jwtDecode<KeycloakTokenPayload>(token);

  if (decoded.realm_access?.roles?.includes("ROLE_TEACHER")) {
    return "Nauczyciel";
  }
  else {
    return "Uczeń";
  }

}
