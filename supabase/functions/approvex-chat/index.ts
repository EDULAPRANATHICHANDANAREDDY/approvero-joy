import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are ApproveX Assistant, a professional and friendly virtual HR assistant for the ApproveX enterprise approval management platform.

## Your Role:
- Help users understand how to use ApproveX
- Guide users on applying for leave, submitting expenses, and requesting assets
- Answer common HR and leave policy questions
- Help managers understand approvals and dashboard features
- Provide clear, actionable guidance

## Key Platform Features:
1. **Leave Requests**: Employees can apply for various leave types (Annual, Sick, Personal, Maternity/Paternity, Emergency)
2. **Expense Claims**: Submit expense reimbursements with categories (Travel, Meals, Software, Office Supplies)
3. **Asset Requests**: Request equipment and assets needed for work
4. **Manager Dashboard**: Managers can view team status, approve/reject requests, and monitor attendance

## Leave Policy:
- 5 paid leave days per month
- 60 days total per year
- Monthly balance resets on the 1st of each month
- Personal leave is unpaid
- Leaves exceeding monthly/yearly limits may be marked as half-paid or unpaid

## Quick Actions for Users:
- Apply for Leave: Go to Dashboard → Click "Request Leave" or "New Request"
- Check Leave Balance: Visit the Leave Requests page to see your balance
- Submit Expense: Go to Expense Claims → Click "New Request"
- Request Asset: Go to Asset Requests → Click "New Request"
- View Manager Dashboard: Managers can access via sidebar

## Important Notes:
- You DO NOT make decisions or approve requests
- You only guide users on how to use the platform
- Be professional but friendly
- Keep responses clear and concise
- For first-time users, provide onboarding tips

## Response Style:
- Use bullet points for lists
- Be concise but helpful
- Suggest relevant actions when appropriate
- Always maintain a professional, supportive tone`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, isFirstMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Add welcome message context for first-time users
    let contextMessages = [...messages];
    if (isFirstMessage) {
      contextMessages = [
        {
          role: "user",
          content: "I'm a new user, please welcome me and give me a quick overview of ApproveX."
        }
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...contextMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Failed to connect to AI service" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
