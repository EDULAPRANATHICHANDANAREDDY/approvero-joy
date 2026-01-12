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

export function useAssetRequests() {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("asset_requests")
      .select("*")
      .order("created_at", { ascending: false });

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

    if (user && updates.status) {
      await logActivity(user.id, updates.status, "asset", id);
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
