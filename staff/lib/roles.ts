export const REALM_ROLES = {
  admin: "admin",
  teacher: "ROLE_TEACHER",
} as const;

export type StaffRole = keyof typeof REALM_ROLES;
