import { requireUser } from '../_shared/auth.ts';
import { HttpError } from '../_shared/http.ts';
import { rateLimit, readBodyText } from '../_shared/request-limits.ts';

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
  let requestBody: string;
  try {
    const { user } = await requireUser(req);
    await rateLimit('ai-chat', user.id, 10, 60);
    await rateLimit('ai-chat-daily', user.id, 100, 86400);
    await rateLimit('ai-chat-global', 'global', 5000, 86400);
    requestBody = await readBodyText(req, 24000);
  } catch (error) {
    return response({ error: error instanceof HttpError ? error.message : 'Unable to process request' }, error instanceof HttpError ? error.status : 500);
  }
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return response({ error: "GEMINI_API_KEY is not configured on the Edge Function" }, 500);

  let body: { message?: string; history?: Array<{ role: string; content: string }> };
  try { body = JSON.parse(requestBody); } catch { return response({ error: "Invalid JSON body" }, 400); }
  if (!body || typeof body !== 'object') return response({ error: 'Invalid request' }, 400);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const history = Array.isArray(body.history) ? body.history : [];
  if (!message) return response({ error: "Message is required" }, 400);
  if (message.length > 2000 || history.length > 12 || history.some((m) => !m || typeof m.content !== 'string' || m.content.length > 2000 || !['user', 'assistant'].includes(m.role))) return response({ error: 'Message or conversation is too long' }, 400);

  // Convert chat history to Gemini's expected contents structure
  const contents = [
    ...history.filter((m) => m?.content && (m.role === "user" || m.role === "assistant")).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const model = Deno.env.get("GEMINI_MODEL");
    if (!model) return response({ error: 'Assistant is temporarily unavailable' }, 503);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: AbortSignal.timeout(25000),
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
                  "($50 minimum). Be concise and friendly.",
              },
            ],
          },
          contents,
          generationConfig: { maxOutputTokens: 1024 },
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return response({ error: 'Assistant is temporarily unavailable. Please try again.' }, 502);
    }
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) return response({ error: "Gemini returned no text response" }, 502);
    return response({ reply });
  } catch (error) {
    console.error("Gemini request failed", error);
    const message = error instanceof Error ? error.message : "Unable to reach Gemini";
    return response({ error: 'Assistant is temporarily unavailable. Please try again.' }, 502);
  }
});
