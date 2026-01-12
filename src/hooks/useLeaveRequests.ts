import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  manager_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  urgency: string;
  created_at: string;
  updated_at: string;
}

const sendApprovalEmail = async (
  recipientEmail: string,
  recipientName: string,
  requestId: string,
  status: "approved" | "rejected",
  managerEmail: string,
  requestDetails: { startDate: string; endDate: string; days: number }
) => {
  try {
    const response = await supabase.functions.invoke("send-approval-email", {
      body: {
        recipientEmail,
        recipientName,
        requestType: "leave",
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

export function useLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch leave requests", variant: "destructive" });
    } else {
      setRequests((data as LeaveRequest[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("leave_requests_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const createRequest = async (request: { leave_type: string; start_date: string; end_date: string; days: number; reason?: string; urgency?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("leave_requests")
      .insert({ ...request, user_id: user.id, status: "pending" })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create leave request", variant: "destructive" });
      return null;
    }

    await logActivity(user.id, "submitted", "leave", data.id);
    toast({ title: "Success", description: "Leave request submitted" });
    return data;
  };

  const updateRequest = async (id: string, updates: Partial<LeaveRequest>) => {
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
      .from("leave_requests")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update request", variant: "destructive" });
      // Revert optimistic update on error
      fetchRequests();
      return false;
    }

    if (user && updates.status && requestToUpdate) {
      await logActivity(user.id, updates.status, "leave", id);
      
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
            startDate: requestToUpdate.start_date,
            endDate: requestToUpdate.end_date,
            days: requestToUpdate.days,
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
