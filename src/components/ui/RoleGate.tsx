import type { ReactNode } from "react";
import type { UserRole } from "@/types/database";

export function RoleGate({
  children,
}: {
  allowed?: UserRole[];
  currentRole?: UserRole;
  children: ReactNode;
}) {
  return <>{children}</>;
}
