import { jwtDecode } from "jwt-decode";

const STAFF_ROLES = ["admin", "teacher"];

type KeycloakTokenPayload = {
  realm_access?: {
    roles?: string[];
  };
};

export type AccountType = "student" | "staff";

export function getAccountType(token: string): AccountType {
  const roles = jwtDecode<KeycloakTokenPayload>(token).realm_access?.roles ?? [];
  return roles.some((role) => STAFF_ROLES.includes(role)) ? "staff" : "student";
}
