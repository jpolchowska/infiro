export const REALM_ROLES = {
  admin: "admin",
  teacher: "teacher",
} as const;

export type StaffRole = keyof typeof REALM_ROLES;
