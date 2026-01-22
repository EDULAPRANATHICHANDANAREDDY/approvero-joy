import { supabase } from "@/integrations/supabase/client";

export type DecisionRequestType = "leave" | "expense" | "asset";
export type DecisionStatus = "approved" | "rejected";

export async function generateDecisionSummary(params: {
  requestType: DecisionRequestType;
  status: DecisionStatus;
  managerComment?: string | null;
  request: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-decision-summary", {
      body: params,
    });
    if (error) throw error;
    return (data as any)?.summary ?? null;
  } catch {
    return null;
  }
}
