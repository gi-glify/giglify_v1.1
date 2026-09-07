# Wiring up the AI Chat widget

The current implementation uses Google Gemini through the Supabase Edge
Function. The browser must not receive the Gemini key. `VITE_GEMINI_API_KEY`
is not used by the chat widget and should not contain a real secret.

## Gemini Setup

Set the key as an Edge Function secret and deploy the function:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set GEMINI_MODEL=gemini-3.6-flash
supabase functions deploy ai-chat
```

## Queued task grading

Task submissions are queued in `grading_jobs`. The queue processor reserves a
conservative daily budget before calling Gemini. Quota responses are retried
later, so submissions remain pending instead of failing when the free quota is
exhausted.

Set the queue secret and budget in Supabase:

```bash
supabase secrets set GRADING_QUEUE_SECRET=use-a-long-random-secret
supabase secrets set GEMINI_DAILY_GRADING_LIMIT=15
supabase secrets set GEMINI_GRADING_MODEL=gemini-3.6-flash
supabase functions deploy grade-task-submission
supabase functions deploy process-grading-queue
```

Schedule `process-grading-queue` every 1-5 minutes using the Supabase scheduled
Edge Function feature or an external scheduler. The scheduler must send:

```text
x-grading-queue-secret: <the same GRADING_QUEUE_SECRET value>
```

The queue budget is intentionally conservative. Gemini quotas are project-wide,
so AI chat usage and grading usage can still compete when they use the same
Google project.

The function handles `OPTIONS` preflight requests and returns CORS headers on
both successful and failed requests. If Gemini rejects a request, the widget
will receive the provider error in the function response instead of a generic
500 with no context. The default model is `gemini-3.6-flash`; override it with
`GEMINI_MODEL` when needed.

Chat messages are persisted in browser storage under a user-specific key.
They survive reloads and synchronize across tabs for the same signed-in user.

The remaining example below is the original provider-agnostic Edge Function
pattern and is not needed when using the current Gemini implementation.

The floating chat button (`src/components/ai/AIChatWidget.tsx`) is fully
built on the frontend — panel, message list, typing state, mobile/desktop
positioning. The only thing it needs from you is a real backend for the
single function `sendToAssistant()` inside that file.

Recommended approach: a **Supabase Edge Function**, so your AI provider's
API key never reaches the browser.

## 1. Create the edge function

```bash
supabase functions new ai-chat
```

`supabase/functions/ai-chat/index.ts`:

```ts
import { serve } from "https://deno.land/std/http/server.ts";

const API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

serve(async (req) => {
  const { message, history } = await req.json();

  const messages = [
    ...history.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system:
        "You are Gig Buddy, the Giglify assistant. Help users understand tasks, " +
        "their balance, profile completion, and how withdrawals work " +
        "($15 minimum). Be concise and friendly.",
      messages,
    }),
  });

  const data = await res.json();
  const reply = data.content?.[0]?.text ?? "Sorry, I couldn't generate a reply.";

  return new Response(JSON.stringify({ reply }), {
    headers: { "content-type": "application/json" },
  });
});
```

## 2. Set the secret and deploy

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy ai-chat
```

## 3. Point the widget at it

In `src/components/ai/AIChatWidget.tsx`, replace the body of
`sendToAssistant` with:

```ts
import { supabase } from '../../utils/supabase';

async function sendToAssistant(message: string, history: ChatMessage[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: { message, history },
  });
  if (error) throw error;
  return data.reply;
}
```

That's it — no other component changes needed. Swap the model or system
prompt in the edge function as your task catalog grows (e.g. give it
read access to the `tasks` table so it can recommend specific tasks).

## Alternatives

- **OpenAI instead of Claude**: same pattern, swap the `fetch` URL/body
  for `https://api.openai.com/v1/chat/completions`.
- **No backend yet**: leave the widget as-is — it already shows a
  clearly-labeled demo reply so it's safe to ship while you build the
  function.
