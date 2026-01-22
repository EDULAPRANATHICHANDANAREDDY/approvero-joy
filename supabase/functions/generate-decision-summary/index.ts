import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DecisionRequestType = "leave" | "expense" | "asset";
type DecisionStatus = "approved" | "rejected";

function toSafeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const SYSTEM_PROMPT = `You write short, neutral, professional decision summaries for enterprise approval workflows.

Rules:
- Max 1–2 sentences.
- Neutral tone, no blame.
- Do NOT include emojis.
- Do NOT invent facts.
- If information is insufficient, be generic (e.g., "based on policy review").
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const requestType = body.requestType as DecisionRequestType;
    const status = body.status as DecisionStatus;

    if (!requestType || !status) {
      return new Response(JSON.stringify({ error: "Missing requestType/status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const managerComment = toSafeString(body.managerComment);
    const request = body.request as Record<string, unknown> | undefined;

    const userPrompt = `Generate a decision summary for a ${requestType} request that was ${status}.

Known inputs:
- Manager comment: ${managerComment || "(none)"}
- Request data: ${toSafeString(request || {})}
`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text().catch(() => "");
      console.error("AI error:", aiResp.status, text);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const summary = json?.choices?.[0]?.message?.content?.trim?.() ?? null;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-decision-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
