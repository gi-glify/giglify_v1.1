const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return response({ error: "GEMINI_API_KEY is not configured on the Edge Function" }, 500);

  let body: { message?: string; history?: Array<{ role: string; content: string }> };
  try { body = await req.json(); } catch { return response({ error: "Invalid JSON body" }, 400); }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const history = Array.isArray(body.history) ? body.history : [];
  if (!message) return response({ error: "Message is required" }, 400);

  // Convert chat history to Gemini's expected contents structure
  const contents = [
    ...history.filter((m) => m?.content && (m.role === "user" || m.role === "assistant")).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are Gig Buddy, the Giglify assistant. Help users understand tasks, " +
                  "their balance, profile completion, and how withdrawals work " +
                  "($15 minimum). Be concise and friendly.",
              },
            ],
          },
          contents,
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return response({ error: `Gemini ${res.status}: ${data?.error?.message || "request rejected"}` }, 502);
    }
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) return response({ error: "Gemini returned no text response" }, 502);
    return response({ reply });
  } catch (error) {
    console.error("Gemini request failed", error);
    const message = error instanceof Error ? error.message : "Unable to reach Gemini";
    return response({ error: `Gemini request failed: ${message}` }, 502);
  }
});
