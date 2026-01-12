import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  recipientEmail: string;
  recipientName: string;
  requestType: "leave" | "expense" | "asset";
  requestId: string;
  status: "approved" | "rejected";
  managerEmail: string;
  managerComment?: string;
  requestDetails?: {
    title?: string;
    amount?: number;
    startDate?: string;
    endDate?: string;
    days?: number;
    category?: string;
  };
}

const getRequestTypeLabel = (type: string) => {
  switch (type) {
    case "leave": return "Leave Request";
    case "expense": return "Expense Claim";
    case "asset": return "Asset Request";
    default: return "Request";
  }
};

const getStatusColor = (status: string) => {
  return status === "approved" ? "#22c55e" : "#ef4444";
};

const getStatusEmoji = (status: string) => {
  return status === "approved" ? "✅" : "❌";
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      requestType,
      requestId,
      status,
      managerEmail,
      managerComment,
      requestDetails,
    }: ApprovalEmailRequest = await req.json();

    console.log("Sending approval email to:", recipientEmail);

    const requestTypeLabel = getRequestTypeLabel(requestType);
    const statusLabel = status === "approved" ? "Approved" : "Rejected";
    const statusColor = getStatusColor(status);
    const statusEmoji = getStatusEmoji(status);

    let detailsHtml = "";
    if (requestDetails) {
      if (requestDetails.title) {
        detailsHtml += `<p><strong>Title:</strong> ${requestDetails.title}</p>`;
      }
      if (requestDetails.amount) {
        detailsHtml += `<p><strong>Amount:</strong> $${requestDetails.amount.toFixed(2)}</p>`;
      }
      if (requestDetails.startDate && requestDetails.endDate) {
        detailsHtml += `<p><strong>Period:</strong> ${requestDetails.startDate} to ${requestDetails.endDate}</p>`;
      }
      if (requestDetails.days) {
        detailsHtml += `<p><strong>Days:</strong> ${requestDetails.days}</p>`;
      }
      if (requestDetails.category) {
        detailsHtml += `<p><strong>Category:</strong> ${requestDetails.category}</p>`;
      }
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; }
          .status-badge { display: inline-block; padding: 12px 24px; border-radius: 50px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: ${statusColor}; margin: 20px 0; }
          .content { padding: 30px; }
          .details-card { background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
          .details-card p { margin: 8px 0; color: #475569; }
          .details-card strong { color: #1e293b; }
          .comment-section { background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .comment-section h3 { margin: 0 0 10px 0; color: #92400e; }
          .comment-section p { margin: 0; color: #78350f; }
          .footer { background-color: #1e293b; padding: 20px; text-align: center; }
          .footer p { color: #94a3b8; margin: 5px 0; font-size: 14px; }
          .footer a { color: #60a5fa; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ApproveX</h1>
            <p>Request Status Update</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #475569;">Hello ${recipientName || "there"},</p>
            
            <p style="font-size: 16px; color: #475569;">Your <strong>${requestTypeLabel}</strong> has been reviewed by the manager.</p>
            
            <div style="text-align: center;">
              <span class="status-badge">${statusEmoji} ${statusLabel}</span>
            </div>
            
            <div class="details-card">
              <h3 style="margin: 0 0 15px 0; color: #1e293b;">Request Details</h3>
              <p><strong>Request Type:</strong> ${requestTypeLabel}</p>
              <p><strong>Request ID:</strong> ${requestId.substring(0, 8)}...</p>
              <p><strong>Decision Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Reviewed By:</strong> ${managerEmail}</p>
              ${detailsHtml}
            </div>
            
            ${managerComment ? `
            <div class="comment-section">
              <h3>📝 Manager's Comment</h3>
              <p>${managerComment}</p>
            </div>
            ` : ''}
            
            <p style="font-size: 16px; color: #475569;">
              ${status === "approved" 
                ? "Congratulations! Your request has been approved. You can proceed accordingly." 
                : "Unfortunately, your request has been rejected. Please contact your manager for more details or submit a new request."}
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from ApproveX</p>
            <p>© ${new Date().getFullYear()} ApproveX - Request Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ApproveX <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `${statusEmoji} Your ${requestTypeLabel} has been ${statusLabel}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
