import { ASSIGNMENT_ROLES } from "@/lib/data/auth-client";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

export interface MyProfileStatus {
  user: {
    id: string;
    email: string | null;
  } | null;
  profile: {
    id: string;
    fullName: string | null;
    role: UserRole | null;
    isActive: boolean | null;
  } | null;
  assignmentAllowed: boolean;
  message: string;
}

export async function getMyProfileClient(): Promise<MyProfileStatus> {
  if (!isSupabaseConfigured) {
    return {
      user: null,
      profile: null,
      assignmentAllowed: false,
      message: "Supabase connection required.",
    };
  }

  const client = getSupabaseClient();

  if (!client) {
    return {
      user: null,
      profile: null,
      assignmentAllowed: false,
      message: "Supabase connection required.",
    };
  }

  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData.user) {
    return {
      user: null,
      profile: null,
      assignmentAllowed: false,
      message: "Assignment writes require authentication.",
    };
  }

  const user = {
    id: userData.user.id,
    email: userData.user.email ?? null,
  };

  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) {
    return {
      user,
      profile: null,
      assignmentAllowed: false,
      message: error.message,
    };
  }

  if (!data) {
    return {
      user,
      profile: null,
      assignmentAllowed: false,
      message: "Your auth user exists, but no profile row exists yet. Ask Admin to create/activate your profile.",
    };
  }

  const role = isUserRole(data.role) ? data.role : null;
  const isActive = typeof data.is_active === "boolean" ? data.is_active : null;
  const assignmentAllowed = Boolean(
    role && isActive !== false && ASSIGNMENT_ROLES.includes(role),
  );

  return {
    user,
    profile: {
      id: String(data.id),
      fullName: typeof data.full_name === "string" ? data.full_name : null,
      role,
      isActive,
    },
    assignmentAllowed,
    message: assignmentAllowed
      ? "Profile role allows line assignment."
      : "Profile role does not allow assignment writes.",
  };
}

export async function createMyProfileRequestClient() {
  return {
    success: false,
    message:
      "Profile requests are not enabled yet. Ask Admin to create/activate your profile in Supabase.",
  };
}

function isUserRole(value: unknown): value is UserRole {
  return (
    value === "ADMIN" ||
    value === "MANAGER" ||
    value === "PLANNING" ||
    value === "PRODUCTION" ||
    value === "SUPERVISOR" ||
    value === "MAINTENANCE" ||
    value === "QUALITY" ||
    value === "WAREHOUSE" ||
    value === "VIEWER"
  );
}
