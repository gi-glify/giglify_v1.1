import { requireAdmin } from "../_shared/auth.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

const allowedTemplates = new Set(["general", "payment", "task", "custom"]);

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function messageHtml(message: string): string {
  return escapeHtml(message).split("\n").map((line) => line || "&nbsp;").join("<br />");
}

async function resendFailureMessage(response: Response): Promise<string> {
  const fallback = `Resend rejected the email request (${response.status}).`;
  const raw = await response.text().catch(() => "");
  if (!raw) return fallback;

  try {
    const payload = JSON.parse(raw) as { message?: unknown; name?: unknown; error?: unknown };
    const providerMessage = [payload.message, payload.error]
      .find((value): value is string => typeof value === "string" && value.trim().length > 0);
    if (providerMessage) {
      return `Resend rejected this email: ${providerMessage.replace(/[\r\n]+/g, " ").slice(0, 280)}`;
    }
    if (typeof payload.name === "string" && payload.name.trim()) {
      return `Resend rejected this email: ${payload.name.trim().slice(0, 120)}`;
    }
  } catch {
    // Keep provider responses that are not JSON from reaching the client.
  }

  return fallback;
}

function brandedHtml(recipientName: string, subject: string, message: string): string {
  const safeName = escapeHtml(recipientName || "there");
  const safeSubject = escapeHtml(subject);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
    <div style="padding:32px 16px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,.10);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#ffffff;">
          <div style="display:flex;align-items:center;gap:10px;font-size:14px;font-weight:800;letter-spacing:2px;"><img src="https://giglify.co.ke/giglify.svg" width="30" height="30" alt="Giglify" style="display:block;border-radius:8px;" /> <span>GIGLIFY</span></div>
          <div style="margin-top:28px;font-size:12px;font-weight:700;letter-spacing:1px;color:#f5a623;">A MESSAGE FROM THE TEAM</div>
          <h1 style="margin:12px 0 0;font-size:30px;line-height:1.15;">${safeSubject}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 18px;font-size:16px;">Hi ${safeName},</p>
          <div style="font-size:16px;color:#374151;">${messageHtml(message)}</div>
          <div style="margin:28px 0 0;padding:18px 20px;border-radius:14px;background:#fff7e6;border:1px solid #f5d583;color:#7f4d03;font-size:14px;">Need anything else? Reply to this email and our team will help.</div>
          <p style="margin:28px 0 0;color:#64748b;font-size:14px;">Warmly,<br><strong style="color:#0f172a;">The Giglify Team</strong></p>
        </div>
        <div style="padding:18px 32px;background:#fffaf0;border-top:1px solid #f5d583;color:#64748b;font-size:12px;">Giglify · Microtasking, Done Right.</div>
      </div>
    </div>
  </body>
</html>`;
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireAdmin(req);
    const body = await req.json();
    const to = typeof body?.to === "string" ? body.to.trim().toLowerCase() : "";
    const recipientName = typeof body?.recipientName === "string" ? body.recipientName.trim() : "there";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const template = typeof body?.template === "string" ? body.template : "custom";

    if (!validEmail(to) || to.length > 320) throw new HttpError("Enter a valid recipient email.", 400, "validation_error");
    if (!allowedTemplates.has(template)) throw new HttpError("Unsupported email template.", 400, "validation_error");
    if (!subject || subject.length > 180) throw new HttpError("Subject must be between 1 and 180 characters.", 400, "validation_error");
    if (!message || message.length > 8000) throw new HttpError("Message must be between 1 and 8,000 characters.", 400, "validation_error");
    if (recipientName.length > 100) throw new HttpError("Recipient name is too long.", 400, "validation_error");

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new HttpError("RESEND_API_KEY is not configured.", 503, "email_not_configured");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Giglify Team <noreply@giglify.co.ke>";
    const replyTo = Deno.env.get("CONTACT_EMAIL");
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text: `Hi ${recipientName || "there"},\n\n${message}\n\nWarmly,\nThe Giglify Team`,
        html: brandedHtml(recipientName, subject, message),
      }),
    });

    if (!emailResponse.ok) {
      const providerMessage = await resendFailureMessage(emailResponse);
      console.error("admin email delivery failed", emailResponse.status, providerMessage);
      throw new HttpError(providerMessage, 502, "email_delivery_failed");
    }

    await auditAdminAction(db, {
      actorUserId: user.id,
      action: "admin_email_sent",
      entityType: "email_message",
      entityId: null,
      before: null,
      after: { recipient: to, template, subject },
      reason: "Branded email sent from admin workspace",
      requestId: requestId(req),
    });
    return json({ sent: true, recipient: to });
  } catch (error) {
    return error instanceof SyntaxError ? json({ error: "Invalid JSON body" }, 400) : errorResponse(error);
  }
});
