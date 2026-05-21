import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AssignLineOrderContextInput {
  lineId: string;
  orderId: string;
  smv?: number | null;
  plannedOperators?: number | null;
  plannedTargetPerDay?: number | null;
  changeReason: string;
}

export type AssignLineOrderContextResult =
  | {
      success: true;
      contextId: string;
    }
  | {
      success: false;
      error: string;
    };

export async function assignLineOrderContextClient(
  input: AssignLineOrderContextInput,
): Promise<AssignLineOrderContextResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: "Supabase connection required.",
    };
  }

  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      error: "Supabase connection required.",
    };
  }

  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData.user) {
    return {
      success: false,
      error: "Authentication required.",
    };
  }

  const { data, error } = await client.rpc("assign_line_order_context", {
    p_line_id: input.lineId,
    p_order_id: input.orderId,
    p_smv: input.smv ?? null,
    p_planned_operators: input.plannedOperators ?? null,
    p_planned_target_per_day: input.plannedTargetPerDay ?? null,
    p_change_reason: input.changeReason.trim() || "Planning assignment",
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (typeof data !== "string" || data.length === 0) {
    return {
      success: false,
      error: "Assignment RPC did not return a context id.",
    };
  }

  return {
    success: true,
    contextId: data,
  };
}
