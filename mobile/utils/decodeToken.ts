import { jwtDecode } from "jwt-decode";

const STAFF_ROLES = ["admin", "teacher"];
const STUDENT_ROLE = "student";

type KeycloakTokenPayload = {
  realm_access?: {
    roles?: string[];
  };
};

export type AccountType = "student" | "staff" | "unassigned";

export function getAccountType(token: string): AccountType {
  const roles = jwtDecode<KeycloakTokenPayload>(token).realm_access?.roles ?? [];
  if (roles.some((role) => STAFF_ROLES.includes(role))) return "staff";
  if (roles.includes(STUDENT_ROLE)) return "student";
  return "unassigned";
}
