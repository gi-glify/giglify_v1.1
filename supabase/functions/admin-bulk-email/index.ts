import { requireAdmin } from "../_shared/auth.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { brandedHtml, plainText } from "../_shared/branded-email.ts";
import { chunkRecipients, selectMarketingRecipients, type MarketingUser } from "../_shared/bulk-email.ts";
import { createUnsubscribeToken } from "../_shared/email-unsubscribe.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const allowedTemplates = new Set(["launch-offer", "general", "custom"]);
const batchSize = 100;
const profileChunkSize = 500;
const maximumRecipients = 10000;

type ProfileRow = { id: string; first_name: string | null; last_name: string | null; email: string | null; is_admin: boolean; marketing_email_opt_out: boolean };

function validEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

function validateContent(body: Record<string, unknown>): { template: string; subject: string; message: string } {
  const template = typeof body.template === "string" ? body.template : "custom";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!allowedTemplates.has(template)) throw new HttpError("Unsupported campaign template.", 400, "validation_error");
  if (!subject || subject.length > 180) throw new HttpError("Subject must be between 1 and 180 characters.", 400, "validation_error");
  if (!message || message.length > 8000) throw new HttpError("Message must be between 1 and 8,000 characters.", 400, "validation_error");
  return { template, subject, message };
}

async function listConfirmedUsers(db: SupabaseClient): Promise<MarketingUser[]> {
  const users: Array<{ id: string; email?: string | null; email_confirmed_at?: string | null; confirmed_at?: string | null }> = [];
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  if (users.length >= 100000) throw new HttpError("The audience is too large to send in one campaign.", 413, "audience_too_large");

  const profiles = new Map<string, ProfileRow>();
  for (let index = 0; index < users.length; index += profileChunkSize) {
    const ids = users.slice(index, index + profileChunkSize).map((user) => user.id);
    if (ids.length === 0) continue;
    const { data, error } = await db.from("profiles").select("id, first_name, last_name, email, is_admin, marketing_email_opt_out").in("id", ids);
    if (error) throw error;
    (data ?? []).forEach((profile) => profiles.set(profile.id, profile as ProfileRow));
  }

  return selectMarketingRecipients(users.map((user) => {
    const profile = profiles.get(user.id);
    return {
      id: user.id,
      email: user.email || profile?.email || null,
      emailConfirmedAt: user.email_confirmed_at || user.confirmed_at || null,
      firstName: profile?.first_name || null,
      lastName: profile?.last_name || null,
      isAdmin: Boolean(profile?.is_admin),
      optedOut: Boolean(profile?.marketing_email_opt_out),
    };
  }));
}

async function resendFailureMessage(response: Response): Promise<string> {
  const raw = await response.text().catch(() => "");
  try {
    const payload = JSON.parse(raw) as { message?: unknown; name?: unknown; error?: unknown };
    const message = [payload.message, payload.error].find((value): value is string => typeof value === "string" && value.trim());
    if (message) return message.replace(/[\r\n]+/g, " ").slice(0, 280);
    if (typeof payload.name === "string" && payload.name.trim()) return payload.name.trim().slice(0, 120);
  } catch {
    // Keep provider details out of the client when Resend does not return JSON.
  }
  return `Resend rejected the campaign batch (${response.status}).`;
}

async function sendResendBatch(apiKey: string, fromEmail: string, replyTo: string | undefined, subject: string, message: string, recipients: MarketingUser[], campaignId: string, batchIndex: number): Promise<string[]> {
  const baseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-preferences`;
  const emails = await Promise.all(recipients.map(async (recipient) => {
    const token = await createUnsubscribeToken(recipient.id);
    const unsubscribeUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;
    const name = [recipient.firstName, recipient.lastName].filter(Boolean).join(" ");
    return {
      from: fromEmail,
      to: [recipient.email!],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      text: plainText(name, message, unsubscribeUrl),
      html: brandedHtml(name, subject, message, unsubscribeUrl),
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    };
  }));
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `giglify-campaign-${campaignId}-batch-${batchIndex}` },
    body: JSON.stringify(emails),
  });
  if (!response.ok) throw new Error(await resendFailureMessage(response));
  const payload = await response.json().catch(() => ({})) as { data?: Array<{ id?: string }> };
  return Array.isArray(payload.data) ? payload.data.map((item) => item?.id || "") : [];
}

async function sendTest(apiKey: string, fromEmail: string, replyTo: string | undefined, to: string, recipientName: string, subject: string, message: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromEmail, to: [to], ...(replyTo ? { reply_to: replyTo } : {}), subject, text: plainText(recipientName, message), html: brandedHtml(recipientName, subject, message) }),
  });
  if (!response.ok) throw new HttpError(`Resend rejected this test email: ${await resendFailureMessage(response)}`, 502, "email_delivery_failed");
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let campaignId: string | null = null;
  try {
    const { user, db } = await requireAdmin(req);
    const body = await req.json() as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "preview";

    if (action === "history") {
      const { data, error } = await db.from("email_campaigns").select("id, subject, template, audience, status, recipient_count, sent_count, failed_count, last_error, created_at, completed_at").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return json({ campaigns: data ?? [] });
    }

    if (action === "preview") {
      const recipients = await listConfirmedUsers(db);
      return json({ audience: "all_confirmed", recipientCount: recipients.length, sample: recipients.slice(0, 5).map((recipient) => ({ email: recipient.email, name: [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || "User" })) });
    }

    const { template, subject, message } = validateContent(body);
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new HttpError("RESEND_API_KEY is not configured.", 503, "email_not_configured");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Giglify Team <noreply@giglify.co.ke>";
    const replyTo = Deno.env.get("CONTACT_EMAIL");

    if (action === "test") {
      const to = typeof body.testTo === "string" ? body.testTo.trim().toLowerCase() : "";
      const recipientName = typeof body.recipientName === "string" ? body.recipientName.trim() : "there";
      if (!validEmail(to) || to.length > 320) throw new HttpError("Enter a valid test recipient email.", 400, "validation_error");
      await sendTest(apiKey, fromEmail, replyTo, to, recipientName, subject, message);
      await auditAdminAction(db, { actorUserId: user.id, action: "admin_campaign_test_sent", entityType: "email_campaign", entityId: null, before: null, after: { recipient: to, template, subject }, reason: "Campaign test email sent", requestId: requestId(req) });
      return json({ sent: true, recipient: to });
    }

    if (action !== "send") throw new HttpError("Invalid campaign action.", 400, "validation_error");
    if (body.confirm !== true) throw new HttpError("Confirm the audience before sending the campaign.", 400, "confirmation_required");
    const recipients = await listConfirmedUsers(db);
    if (recipients.length > maximumRecipients) throw new HttpError(`This campaign exceeds the ${maximumRecipients.toLocaleString()} recipient safety limit.`, 413, "audience_too_large");
    if (recipients.length === 0) throw new HttpError("No confirmed, opted-in users are available.", 409, "empty_audience");
    const { data: campaign, error: campaignError } = await db.from("email_campaigns").insert({ created_by: user.id, subject, message, template, audience: "all_confirmed", recipient_count: recipients.length }).select("id").single();
    if (campaignError) throw campaignError;
    campaignId = campaign.id;

    const recipientRows = recipients.map((recipient) => ({ campaign_id: campaign.id, user_id: recipient.id, email: recipient.email!, recipient_name: [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || null }));
    for (let index = 0; index < recipientRows.length; index += 500) {
      const { error } = await db.from("email_campaign_recipients").insert(recipientRows.slice(index, index + 500));
      if (error) throw error;
    }

    let sentCount = 0;
    let failedCount = 0;
    let lastError: string | null = null;
    const batches = chunkRecipients(recipients, batchSize);
    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      const batchIds = batch.map((recipient) => recipient.id);
      try {
        const providerIds = await sendResendBatch(apiKey, fromEmail, replyTo, subject, message, batch, campaign.id, index);
        sentCount += batch.length;
        for (let itemIndex = 0; itemIndex < batch.length; itemIndex += 1) {
          const { error } = await db.from("email_campaign_recipients").update({ status: "sent", provider_id: providerIds[itemIndex] || null, sent_at: new Date().toISOString() }).eq("campaign_id", campaign.id).eq("user_id", batch[itemIndex].id);
          if (error) throw error;
        }
      } catch (error) {
        failedCount += batch.length;
        lastError = error instanceof Error ? error.message : "Campaign batch failed.";
        const { error: updateError } = await db.from("email_campaign_recipients").update({ status: "failed", error: lastError }).eq("campaign_id", campaign.id).in("user_id", batchIds);
        if (updateError) throw updateError;
      }
    }
    const status = failedCount === 0 ? "sent" : sentCount === 0 ? "failed" : "partial";
    const { error: updateCampaignError } = await db.from("email_campaigns").update({ status, sent_count: sentCount, failed_count: failedCount, last_error: lastError, completed_at: new Date().toISOString() }).eq("id", campaign.id);
    if (updateCampaignError) throw updateCampaignError;
    await auditAdminAction(db, { actorUserId: user.id, action: "admin_campaign_sent", entityType: "email_campaign", entityId: campaign.id, before: null, after: { status, recipientCount: recipients.length, sentCount, failedCount, subject }, reason: "Bulk campaign sent to confirmed opted-in users", requestId: requestId(req) });
    return json({ campaignId: campaign.id, status, recipientCount: recipients.length, sentCount, failedCount });
  } catch (error) {
    if (campaignId) console.error("bulk campaign failed after creation", campaignId, error);
    return error instanceof SyntaxError ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json")) : errorResponse(error);
  }
});
