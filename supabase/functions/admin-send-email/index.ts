import { requireAdmin } from "../_shared/auth.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { brandedHtml } from "../_shared/branded-email.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

const allowedTemplates = new Set(["general", "payment", "task", "custom"]);

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
