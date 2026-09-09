import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const preflight = options(req); if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    await requireAdmin(req);
    const body = await req.json(); const message = typeof body?.message === "string" ? body.message.trim() : ""; const history = Array.isArray(body?.history) ? body.history.slice(-12) : [];
    if (!message) throw new HttpError("Message is required", 400, "validation_error");
    const apiKey = Deno.env.get("GEMINI_API_KEY"); if (!apiKey) throw new HttpError("GEMINI_API_KEY is not configured", 500, "configuration_error");
    const contents = [...history.filter((item: { role?: string; content?: string }) => item?.content && (item.role === "user" || item.role === "assistant")).map((item: { role: string; content: string }) => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content.slice(0, 6000) }] })), { role: "user", parts: [{ text: message.slice(0, 6000) }] }];
    const model = Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify({ systemInstruction: { parts: [{ text: "You are Giglify Admin Analyst. Analyze only operational data explicitly shared in the conversation. You are read-only: never claim to change records, approve payments, publish tasks, alter users, or access private documents. State assumptions, call out missing data, and give concise findings with risks and recommended next checks. Do not request or reproduce secrets, answer keys, identity documents, tokens, or payment credentials." }] }, contents }) });
    const data = await response.json(); if (!response.ok) throw new HttpError(`Analysis provider rejected the request: ${data?.error?.message || "unknown error"}`, 502, "analysis_provider_error");
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text; if (!reply) throw new HttpError("Analysis provider returned no text", 502, "analysis_empty");
    return json({ reply });
  } catch (error) { return error instanceof SyntaxError ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json")) : errorResponse(error); }
});
