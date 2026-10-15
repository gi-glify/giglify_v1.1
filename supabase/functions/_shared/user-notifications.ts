import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type NotificationInput = {
  title: string;
  detail: string;
  subject: string;
  dedupe?: boolean;
};

export async function notifyAndEmailUser(db: SupabaseClient, userId: string, input: NotificationInput): Promise<void> {
  if (input.dedupe !== false) {
    const { data: existing } = await db.from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("title", input.title)
      .eq("detail", input.detail)
      .limit(1)
      .maybeSingle();
    if (existing) return;
  }

  const { error: notificationError } = await db.from("notifications").insert({ user_id: userId, title: input.title, detail: input.detail });
  if (notificationError) console.error("notification insert error", notificationError.message);

  const { data: authUser, error: userError } = await db.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (userError || !email || !apiKey) {
    if (userError) console.error("notification email user lookup error", userError.message);
    return;
  }

  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Giglify Team <noreply@giglify.com>";
  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromEmail, to: [email], subject: input.subject, text: `${input.title}\n\n${input.detail}` }),
    });
    if (!emailResponse.ok) console.error("notification email delivery failed", await emailResponse.text());
  } catch (error) {
    console.error("notification email request error", error);
  }
}
