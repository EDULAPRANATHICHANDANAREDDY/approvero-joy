import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sound-engine";
import { generateDecisionSummary } from "@/hooks/useDecisionSummary";
import { sendEnhancedNotification, notifyManagerOfNewRequest } from "@/lib/notification-utils";

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

const sendApprovalEmail = async (
  recipientEmail: string,
  recipientName: string,
  requestId: string,
  status: "approved" | "rejected",
  managerEmail: string,
  requestDetails: { title: string; amount: number; category: string }
) => {
  try {
    const response = await supabase.functions.invoke("send-approval-email", {
      body: {
        recipientEmail,
        recipientName,
        requestType: "expense",
        requestId,
        status,
        managerEmail,
        requestDetails,
      },
    });
    console.log("Email notification sent:", response);
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
};

const MANAGER_EMAIL = "edulapranathi@gmail.com";

export function useExpenseClaims() {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchClaims = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Manager sees all claims, regular users see only their own
    let query = supabase
      .from("expense_claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (user.email !== MANAGER_EMAIL) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error", description: "Failed to fetch expense claims", variant: "destructive" });
    } else {
      const next = (data as ExpenseClaim[]) || [];
      if (hasLoadedOnce) {
        const prevMap = new Map(claims.map(c => [c.id, c]));
        for (const c of next) {
          const prev = prevMap.get(c.id);
          const becameApproved = prev?.status === "pending" && c.status === "approved";
          const becameRejected = prev?.status === "pending" && c.status === "rejected";
          if (becameApproved) void playSound("approve");
          if (becameRejected) void playSound("reject");
        }
      }
      setClaims(next);
    }
    setLoading(false);
    if (!hasLoadedOnce) setHasLoadedOnce(true);
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
    
    // Get employee name for manager notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    // Notify manager of new expense claim
    await notifyManagerOfNewRequest({
      requestType: "expense",
      requestTitle: `${claim.title} ($${claim.amount.toFixed(2)})`,
      employeeName: profile?.full_name || user.email || "Employee",
    });

    toast({ title: "Success", description: "Expense claim submitted" });
    return data;
  };

  const updateClaim = async (id: string, updates: Partial<ExpenseClaim>) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check manager permission
    if ((updates.status === "approved" || updates.status === "rejected") && user?.email !== "edulapranathi@gmail.com") {
      toast({ title: "Access Denied", description: "Only the manager can approve or reject requests", variant: "destructive" });
      return false;
    }

    // Get the claim details for email
    const claimToUpdate = claims.find(c => c.id === id);

    const updateData: Record<string, unknown> = { ...updates };
    
    if (updates.status === "approved" || updates.status === "rejected") {
      updateData.approved_by = user?.id;
      updateData.approved_at = new Date().toISOString();
    }

    // Optimistic update - immediately remove from local state if approving/rejecting
    if (updates.status === "approved" || updates.status === "rejected") {
      setClaims(prev => prev.filter(c => c.id !== id));
    }

    const { error } = await supabase
      .from("expense_claims")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update claim", variant: "destructive" });
      // Revert optimistic update on error
      fetchClaims();
      return false;
    }

    if (user && updates.status && claimToUpdate) {
      const decisionSummary =
        updates.status === "approved" || updates.status === "rejected"
          ? await generateDecisionSummary({
              requestType: "expense",
              status: updates.status,
              managerComment: (updates as any).manager_comment ?? null,
              request: {
                title: claimToUpdate.title,
                amount: claimToUpdate.amount,
                category: claimToUpdate.category,
                policy_warning: claimToUpdate.policy_warning,
                urgency: claimToUpdate.urgency,
              },
            })
          : null;

      await logActivity(user.id, updates.status, "expense", id, decisionSummary ? { decision_summary: decisionSummary } : undefined);

      if (updates.status === "approved") void playSound("approve");
      if (updates.status === "rejected") void playSound("reject");
      
      // Send enhanced in-app notification to the employee
      await sendEnhancedNotification({
        userId: claimToUpdate.user_id,
        requestType: "expense",
        status: updates.status as "approved" | "rejected",
        requestTitle: claimToUpdate.title,
        managerComment: (updates as any).manager_comment ?? null,
        expenseAmount: claimToUpdate.amount,
      });

      // Send email notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", claimToUpdate.user_id)
        .single();

      if (profile?.email) {
        await sendApprovalEmail(
          profile.email,
          profile.full_name || "Employee",
          id,
          updates.status as "approved" | "rejected",
          user.email || "Manager",
          {
            title: claimToUpdate.title,
            amount: claimToUpdate.amount,
            category: claimToUpdate.category,
          }
        );
        toast({ title: "Email Sent", description: `Notification sent to ${profile.email}` });
      }
    }
    return true;
  };

  return { claims, loading, createClaim, updateClaim, refetch: fetchClaims };
}

async function logActivity(userId: string, action: string, requestType: string, requestId: string, details?: Record<string, unknown>) {
  await supabase.from("activity_log").insert([
    {
      user_id: userId,
      action,
      request_type: requestType,
      request_id: requestId,
      details: (details ?? null) as any,
    },
  ]);
}
