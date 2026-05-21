import type { UserRole } from "@/types/database";

export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  PLANNING: "PLANNING",
  PRODUCTION: "PRODUCTION",
  SUPERVISOR: "SUPERVISOR",
  MAINTENANCE: "MAINTENANCE",
  QUALITY: "QUALITY",
  WAREHOUSE: "WAREHOUSE",
  VIEWER: "VIEWER",
} as const satisfies Record<UserRole, UserRole>;

export const ALL_ROLES = Object.values(ROLES);
