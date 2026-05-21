import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

export const ASSIGNMENT_ROLES: UserRole[] = ["ADMIN", "MANAGER", "PLANNING"];

export interface CurrentUserProfile {
  id: string;
  fullName: string | null;
  role: UserRole | null;
  isActive: boolean | null;
}

export interface CurrentUserResult {
  user: User | null;
  message: string;
}

export interface CurrentUserProfileResult {
  user: User | null;
  profile: CurrentUserProfile | null;
  message: string;
}

export interface CurrentUserRoleResult {
  user: User | null;
  profile: CurrentUserProfile | null;
  role: UserRole | null;
  canAssignLineOrderContext: boolean;
  message: string;
}

export async function getCurrentUserClient(): Promise<CurrentUserResult> {
  if (!isSupabaseConfigured) {
    return {
      user: null,
      message: "Supabase connection required.",
    };
  }

  const client = getSupabaseClient();

  if (!client) {
    return {
      user: null,
      message: "Supabase connection required.",
    };
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return {
      user: null,
      message: "Assignment writes require authentication.",
    };
  }

  return {
    user: data.user,
    message: "Authenticated user loaded.",
  };
}

export async function getCurrentUserProfileClient(): Promise<CurrentUserProfileResult> {
  const userResult = await getCurrentUserClient();

  if (!userResult.user) {
    return {
      user: null,
      profile: null,
      message: userResult.message,
    };
  }

  const client = getSupabaseClient();

  if (!client) {
    return {
      user: userResult.user,
      profile: null,
      message: "Supabase connection required.",
    };
  }

  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", userResult.user.id)
    .maybeSingle();

  if (error) {
    return {
      user: userResult.user,
      profile: null,
      message: error.message,
    };
  }

  if (!data) {
    return {
      user: userResult.user,
      profile: null,
      message: "Signed in, but profile role is missing. Ask Admin to create/activate your profile.",
    };
  }

  return {
    user: userResult.user,
    profile: {
      id: String(data.id),
      fullName: typeof data.full_name === "string" ? data.full_name : null,
      role: isUserRole(data.role) ? data.role : null,
      isActive: typeof data.is_active === "boolean" ? data.is_active : null,
    },
    message: "User profile loaded.",
  };
}

export async function getCurrentUserRoleClient(): Promise<CurrentUserRoleResult> {
  const profileResult = await getCurrentUserProfileClient();

  if (!profileResult.user || !profileResult.profile) {
    return {
      user: profileResult.user,
      profile: profileResult.profile,
      role: null,
      canAssignLineOrderContext: false,
      message: profileResult.message,
    };
  }

  const role = profileResult.profile.role;

  if (!role) {
    return {
      user: profileResult.user,
      profile: profileResult.profile,
      role: null,
      canAssignLineOrderContext: false,
      message: "Signed in, but profile role is missing. Ask Admin to create/activate your profile.",
    };
  }

  if (profileResult.profile.isActive === false) {
    return {
      user: profileResult.user,
      profile: profileResult.profile,
      role,
      canAssignLineOrderContext: false,
      message: "User profile is inactive. Assignment requires an active Planning/Admin role.",
    };
  }

  if (!ASSIGNMENT_ROLES.includes(role)) {
    return {
      user: profileResult.user,
      profile: profileResult.profile,
      role,
      canAssignLineOrderContext: false,
      message: "Planning/Admin role required.",
    };
  }

  return {
    user: profileResult.user,
    profile: profileResult.profile,
    role,
    canAssignLineOrderContext: true,
    message: "Ready to create assignment.",
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
