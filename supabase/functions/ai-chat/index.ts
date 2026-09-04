import { serve } from "https://deno.land/std/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

serve(async (req) => {
  const { message, history } = await req.json();

  // Convert chat history to Gemini's expected contents structure
  const contents = [
    ...history.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are the Giglify assistant. Help users understand tasks, " +
                "their balance, profile completion, and how withdrawals work " +
                "($15 minimum). Be concise and friendly.",
            },
          ],
        },
        contents,
      }),
    }
  );

  const data = await res.json();
  const reply =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Sorry, I couldn't generate a reply.";

  return new Response(JSON.stringify({ reply }), {
    headers: { "content-type": "application/json" },
  });
});