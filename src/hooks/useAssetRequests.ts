import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AssetRequest {
  id: string;
  user_id: string;
  title: string;
  asset_type: string;
  category: string;
  reason: string;
  estimated_cost: number | null;
  urgency: string;
  status: string;
  manager_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  assigned_at: string | null;
  return_date: string | null;
  created_at: string;
  updated_at: string;
}

const AUTO_APPROVE_LIMIT = 100;

const sendApprovalEmail = async (
  recipientEmail: string,
  recipientName: string,
  requestId: string,
  status: "approved" | "rejected",
  managerEmail: string,
  requestDetails: { title: string; category: string; amount?: number }
) => {
  try {
    const response = await supabase.functions.invoke("send-approval-email", {
      body: {
        recipientEmail,
        recipientName,
        requestType: "asset",
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

export function useAssetRequests() {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Manager sees all requests, regular users see only their own
    let query = supabase
      .from("asset_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (user.email !== MANAGER_EMAIL) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error", description: "Failed to fetch asset requests", variant: "destructive" });
    } else {
      setRequests((data as AssetRequest[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("asset_requests_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "asset_requests" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const createRequest = async (request: { title: string; asset_type: string; category: string; reason: string; estimated_cost?: number; urgency?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Auto-approve low-cost items
    const status = (request.estimated_cost && request.estimated_cost <= AUTO_APPROVE_LIMIT) ? "approved" : "pending";

    const { data, error } = await supabase
      .from("asset_requests")
      .insert({ 
        ...request, 
        user_id: user.id,
        status
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create asset request", variant: "destructive" });
      return null;
    }

    await logActivity(user.id, status === "approved" ? "auto-approved" : "submitted", "asset", data.id);
    toast({ 
      title: "Success", 
      description: status === "approved" ? "Asset request auto-approved (low cost)" : "Asset request submitted" 
    });
    return data;
  };

  const updateRequest = async (id: string, updates: Partial<AssetRequest>) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check manager permission
    if ((updates.status === "approved" || updates.status === "rejected") && user?.email !== "edulapranathi@gmail.com") {
      toast({ title: "Access Denied", description: "Only the manager can approve or reject requests", variant: "destructive" });
      return false;
    }

    // Get the request details for email
    const requestToUpdate = requests.find(r => r.id === id);

    const updateData: Record<string, unknown> = { ...updates };
    
    if (updates.status === "approved" || updates.status === "rejected") {
      updateData.approved_by = user?.id;
      updateData.approved_at = new Date().toISOString();
    }

    // Optimistic update - immediately remove from local state if approving/rejecting
    if (updates.status === "approved" || updates.status === "rejected") {
      setRequests(prev => prev.filter(r => r.id !== id));
    }

    const { error } = await supabase
      .from("asset_requests")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update request", variant: "destructive" });
      // Revert optimistic update on error
      fetchRequests();
      return false;
    }

    if (user && updates.status && requestToUpdate) {
      await logActivity(user.id, updates.status, "asset", id);
      
      // Send email notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", requestToUpdate.user_id)
        .single();

      if (profile?.email) {
        await sendApprovalEmail(
          profile.email,
          profile.full_name || "Employee",
          id,
          updates.status as "approved" | "rejected",
          user.email || "Manager",
          {
            title: requestToUpdate.title,
            category: requestToUpdate.category,
            amount: requestToUpdate.estimated_cost || undefined,
          }
        );
        toast({ title: "Email Sent", description: `Notification sent to ${profile.email}` });
      }
    }
    return true;
  };

  return { requests, loading, createRequest, updateRequest, refetch: fetchRequests };
}

async function logActivity(userId: string, action: string, requestType: string, requestId: string) {
  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    request_type: requestType,
    request_id: requestId
  });
}
