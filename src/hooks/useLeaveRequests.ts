import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/lib/sound-engine";
import { generateDecisionSummary } from "@/hooks/useDecisionSummary";
import { sendEnhancedNotification, notifyManagerOfNewRequest } from "@/lib/notification-utils";

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

const MANAGER_EMAIL = "edulapranathi@gmail.com";

export function useLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Manager sees all requests, regular users see only their own
    let query = supabase
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (user.email !== MANAGER_EMAIL) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error", description: "Failed to fetch leave requests", variant: "destructive" });
    } else {
      const next = (data as LeaveRequest[]) || [];
      // Sound for employees when their request gets approved/rejected (not on initial load)
      if (hasLoadedOnce) {
        const prevMap = new Map(requests.map(r => [r.id, r]));
        for (const r of next) {
          const prev = prevMap.get(r.id);
          const becameApproved = prev?.status === "pending" && r.status === "approved";
          const becameRejected = prev?.status === "pending" && r.status === "rejected";
          if (becameApproved) void playSound("approve");
          if (becameRejected) void playSound("reject");
        }
      }
      setRequests(next);
    }
    setLoading(false);
    if (!hasLoadedOnce) setHasLoadedOnce(true);
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
    
    // Get employee name for manager notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    // Notify manager of new request
    await notifyManagerOfNewRequest({
      requestType: "leave",
      requestTitle: `${request.leave_type} (${request.days} days)`,
      employeeName: profile?.full_name || user.email || "Employee",
      urgency: request.urgency,
    });

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
      const decisionSummary =
        updates.status === "approved" || updates.status === "rejected"
          ? await generateDecisionSummary({
              requestType: "leave",
              status: updates.status,
              managerComment: (updates as any).manager_comment ?? null,
              request: {
                leave_type: requestToUpdate.leave_type,
                start_date: requestToUpdate.start_date,
                end_date: requestToUpdate.end_date,
                days: requestToUpdate.days,
                urgency: requestToUpdate.urgency,
              },
            })
          : null;

      await logActivity(user.id, updates.status, "leave", id, decisionSummary ? { decision_summary: decisionSummary } : undefined);

      // Sound for manager action (user gesture)
      if (updates.status === "approved") void playSound("approve");
      if (updates.status === "rejected") void playSound("reject");
      
      // Get leave balance for notification
      const { data: leaveBalances } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("user_id", requestToUpdate.user_id)
        .eq("leave_type", requestToUpdate.leave_type)
        .single();

      // Send enhanced in-app notification to the employee
      await sendEnhancedNotification({
        userId: requestToUpdate.user_id,
        requestType: "leave",
        status: updates.status as "approved" | "rejected",
        requestTitle: `${requestToUpdate.leave_type} (${requestToUpdate.days} days)`,
        managerComment: (updates as any).manager_comment ?? null,
        leaveBalance: leaveBalances ? {
          leave_type: leaveBalances.leave_type,
          remaining: leaveBalances.total_days - leaveBalances.used_days,
          total: leaveBalances.total_days,
        } : undefined,
      });

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
