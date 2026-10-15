import { adminClient } from "../_shared/auth.ts";
import { verifyUnsubscribeToken } from "../_shared/email-unsubscribe.ts";

function html(body: string, status = 200): Response {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Giglify email preferences</title></head><body style="margin:0;background:#faf8ff;color:#221b35;font-family:Arial,Helvetica,sans-serif"><main style="max-width:560px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #e8def7;border-radius:20px;box-shadow:0 12px 36px rgba(58,38,93,.1)"><img src="https://giglify.co.ke/giglify.svg" width="36" height="36" alt="Giglify" style="border-radius:9px"><p style="color:#7c3aed;font-size:12px;font-weight:800;letter-spacing:.14em">GIGLIFY</p><h1 style="font-size:28px">${body}</h1><p style="color:#746b83;line-height:1.6">You can still receive important account, payment, and task updates.</p></main></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") return html("This link is no longer available.", 405);
  const token = new URL(req.url).searchParams.get("token") || "";
  const userId = await verifyUnsubscribeToken(token);
  if (!userId) return html("This unsubscribe link is invalid or expired.", 400);
  const db = adminClient();
  const { error } = await db.from("profiles").update({ marketing_email_opt_out: true, marketing_email_opted_out_at: new Date().toISOString() }).eq("id", userId);
  if (error) {
    console.error("email preference update failed", error);
    return html("We could not update your preferences right now.", 500);
  }
  return req.method === "POST" ? new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } }) : html("You are unsubscribed.");
});
