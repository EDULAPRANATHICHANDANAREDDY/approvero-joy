import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ExpenseClaim {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  description: string | null;
  receipt_url: string | null;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  manager_comment: string | null;
  policy_warning: string | null;
  approved_by: string | null;
  approved_at: string | null;
  urgency: string;
  created_at: string;
  updated_at: string;
}

const EXPENSE_LIMITS: Record<string, number> = {
  "Travel": 500,
  "Meals": 50,
  "Software": 200,
  "Office Supplies": 100
};

export function useExpenseClaims() {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClaims = async () => {
    const { data, error } = await supabase
      .from("expense_claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch expense claims", variant: "destructive" });
    } else {
      setClaims((data as ExpenseClaim[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();

    const channel = supabase
      .channel("expense_claims_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_claims" }, () => {
        fetchClaims();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const createClaim = async (claim: { title: string; amount: number; category: string; description?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const limit = EXPENSE_LIMITS[claim.category] || 100;
    const policyWarning = claim.amount > limit ? `Amount exceeds ${claim.category} limit of $${limit}` : null;

    const { data, error } = await supabase
      .from("expense_claims")
      .insert({ 
        ...claim, 
        user_id: user.id,
        status: "pending",
        payment_status: "unpaid",
        policy_warning: policyWarning
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create expense claim", variant: "destructive" });
      return null;
    }

    await logActivity(user.id, "submitted", "expense", data.id);
    toast({ title: "Success", description: "Expense claim submitted" });
    return data;
  };

  const updateClaim = async (id: string, updates: Partial<ExpenseClaim>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const updateData: Record<string, unknown> = { ...updates };
    
    if (updates.status === "approved" || updates.status === "rejected") {
      updateData.approved_by = user?.id;
      updateData.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("expense_claims")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update claim", variant: "destructive" });
      return false;
    }

    if (user && updates.status) {
      await logActivity(user.id, updates.status, "expense", id);
    }
    return true;
  };

  return { claims, loading, createClaim, updateClaim, refetch: fetchClaims };
}

async function logActivity(userId: string, action: string, requestType: string, requestId: string) {
  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    request_type: requestType,
    request_id: requestId
  });
}
