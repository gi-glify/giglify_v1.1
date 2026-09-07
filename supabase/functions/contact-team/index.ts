import { adminClient } from "../_shared/auth.ts";
import { corsHeaders, json, options } from "../_shared/http.ts";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let messageId = "";
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (name.length < 2 || name.length > 100 || !validEmail(email) || email.length > 320 || message.length < 10 || message.length > 5000) {
      return json({ error: "Please provide a valid name, email, and message." }, 400);
    }

    const db = adminClient();
    let userId: string | null = null;
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await db.auth.getUser(token);
      userId = data.user?.id || null;
    }
    const { data: record, error: insertError } = await db.from("contact_messages").insert({ user_id: userId, name, email, message }).select("id").single();
    if (insertError) throw insertError;
    messageId = record.id;

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const teamEmail = Deno.env.get("CONTACT_EMAIL") || "team@giglify.com";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Giglify Team <noreply@giglify.com>";
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [teamEmail],
        reply_to: email,
        subject: `Giglify contact message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });
    if (!emailResponse.ok) throw new Error("Team email delivery failed");
    await db.from("contact_messages").update({ status: "sent" }).eq("id", messageId);
    return json({ sent: true });
  } catch (error) {
    if (messageId) await adminClient().from("contact_messages").update({ status: "failed" }).eq("id", messageId);
    console.error("contact-team error", error);
    return new Response(JSON.stringify({ error: "Unable to send your message right now." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
