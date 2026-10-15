import { adminClient } from "../_shared/auth.ts";
import { corsHeaders, json, options } from "../_shared/http.ts";

type InboundData = {
  email_id?: unknown;
  message_id?: unknown;
  from?: unknown;
  to?: unknown;
  subject?: unknown;
  text?: unknown;
  created_at?: unknown;
};

async function retrieveReceivedEmail(emailId: string, fallback: InboundData): Promise<InboundData> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`Unable to retrieve received email (${response.status})`);
  const received = await response.json() as InboundData;
  return { ...fallback, ...received, email_id: emailId };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseSender(value: string): { name: string | null; email: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return {
    name: match?.[1]?.replace(/^"|"$/g, "").trim() || null,
    email: (match?.[2] || value).trim().toLowerCase(),
  };
}

function normalizeSubject(value: string): string {
  return value.replace(/^(re|fwd?|回复):\s*/i, "").trim().toLowerCase() || "(no subject)";
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left[index] ^ right[index];
  return result === 0;
}

async function verifyWebhook(rawBody: string, req: Request): Promise<boolean> {
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  const timestamp = Number(svixTimestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(secret.replace(/^whsec_/, "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = new TextEncoder().encode(`${svixId}.${svixTimestamp}.${rawBody}`);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, signed));
  return svixSignature.split(" ").some((signature) => {
    const [version, encoded] = signature.split(",", 2);
    return version === "v1" && Boolean(encoded) && constantTimeEqual(expected, base64ToBytes(encoded));
  });
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const rawBody = await req.text();
    if (!(await verifyWebhook(rawBody, req))) return json({ error: "Invalid webhook signature" }, 401);

    const event = JSON.parse(rawBody) as { type?: unknown; data?: InboundData };
    if (event.type !== "email.received") return json({ received: true, ignored: true });

    const eventData = event.data || {};
    const providerEmailId = stringValue(eventData.email_id);
    if (!providerEmailId) return json({ error: "Invalid inbound email payload" }, 400);
    const data = await retrieveReceivedEmail(providerEmailId, eventData);
    const sender = parseSender(stringValue(data.from));
    if (!sender.email) return json({ error: "Invalid inbound email payload" }, 400);

    const subject = stringValue(data.subject) || "(no subject)";
    const textBody = stringValue(data.text) || "(No message content was provided.)";
    const recipients = Array.isArray(data.to)
      ? data.to.filter((value): value is string => typeof value === "string").map((value) => value.trim().toLowerCase()).filter(Boolean)
      : [];
    const db = adminClient();
    const { error } = await db.from("support_inbox_messages").insert({
      provider_email_id: providerEmailId,
      message_id: stringValue(data.message_id) || null,
      sender_name: sender.name,
      sender_email: sender.email,
      recipients,
      subject: subject.slice(0, 180),
      text_body: textBody.slice(0, 20000),
      thread_key: `${sender.email}::${normalizeSubject(subject)}`,
      received_at: stringValue(data.created_at) || new Date().toISOString(),
    });

    if (error && error.code !== "23505") throw error;
    return json({ received: true, duplicate: error?.code === "23505" });
  } catch (error) {
    console.error("resend inbound email error", error);
    return new Response(JSON.stringify({ error: "Unable to store inbound email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
