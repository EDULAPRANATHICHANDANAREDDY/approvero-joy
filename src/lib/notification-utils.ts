import { supabase } from "@/integrations/supabase/client";

interface LeaveBalanceInfo {
  leave_type: string;
  remaining: number;
  total: number;
}

interface RequestNotificationParams {
  userId: string;
  requestType: "leave" | "expense" | "asset";
  status: "approved" | "rejected";
  requestTitle: string;
  managerComment?: string | null;
  leaveBalance?: LeaveBalanceInfo;
  expenseAmount?: number;
  assetDetails?: { title: string; category: string };
}

export async function sendEnhancedNotification(params: RequestNotificationParams) {
  const { userId, requestType, status, requestTitle, managerComment, leaveBalance, expenseAmount, assetDetails } = params;

  const isApproved = status === "approved";
  const statusEmoji = isApproved ? "✅" : "❌";
  const statusText = isApproved ? "Approved" : "Rejected";
  
  let title = "";
  let message = "";

  switch (requestType) {
    case "leave":
      title = `${statusEmoji} Leave Request ${statusText}`;
      if (isApproved) {
        message = `Your ${requestTitle} request has been approved!`;
        if (leaveBalance) {
          message += ` Remaining balance: ${leaveBalance.remaining} / ${leaveBalance.total} days for ${leaveBalance.leave_type}.`;
        }
      } else {
        message = `Your ${requestTitle} request has been rejected.`;
        if (managerComment) {
          message += ` Reason: "${managerComment}"`;
        }
      }
      break;

    case "expense":
      title = `${statusEmoji} Expense Claim ${statusText}`;
      if (isApproved) {
        message = `Your expense claim "${requestTitle}" for $${expenseAmount?.toFixed(2)} has been approved! Payment will be processed soon.`;
      } else {
        message = `Your expense claim "${requestTitle}" for $${expenseAmount?.toFixed(2)} has been rejected.`;
        if (managerComment) {
          message += ` Reason: "${managerComment}"`;
        }
      }
      break;

    case "asset":
      title = `${statusEmoji} Asset Request ${statusText}`;
      if (isApproved) {
        message = `Your ${assetDetails?.category || "asset"} request "${requestTitle}" has been approved! IT will contact you for assignment.`;
      } else {
        message = `Your ${assetDetails?.category || "asset"} request "${requestTitle}" has been rejected.`;
        if (managerComment) {
          message += ` Reason: "${managerComment}"`;
        }
      }
      break;
  }

  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type: `request_${status}`,
    request_type: requestType,
  });
}

// Notification for when a new request is submitted (for managers)
export async function notifyManagerOfNewRequest(params: {
  requestType: "leave" | "expense" | "asset";
  requestTitle: string;
  employeeName: string;
  urgency?: string;
}) {
  const { requestType, requestTitle, employeeName, urgency } = params;
  
  // Get manager's user ID
  const { data: managerProfile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("email", "edulapranathi@gmail.com")
    .single();

  if (!managerProfile) return;

  const urgencyEmoji = urgency === "high" ? "🔴" : urgency === "normal" ? "🟡" : "🟢";
  const typeEmoji = requestType === "leave" ? "📅" : requestType === "expense" ? "💵" : "📦";

  await supabase.from("notifications").insert({
    user_id: managerProfile.user_id,
    title: `${typeEmoji} New ${requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request`,
    message: `${urgencyEmoji} ${employeeName} has submitted a ${requestType} request: "${requestTitle}". Please review.`,
    type: "new_request",
    request_type: requestType,
  });
}
