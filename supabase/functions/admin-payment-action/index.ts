import { audit } from "../_shared/payment.ts";
import { json, options } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireAdmin(req);
    const body = await req.json();
    const entityType = body?.entityType;
    const entityId = body?.entityId;
    const action = body?.action;
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!['verification_deposit', 'payout_request', 'profile_edit_appeal'].includes(entityType) || typeof entityId !== "string" || typeof action !== "string") {
      return json({ error: "Invalid admin payment action" }, 400);
    }

    if (entityType === "verification_deposit") {
      if (!['approve', 'reject'].includes(action)) return json({ error: "Invalid verification action" }, 400);
      const status = action === "approve" ? "verified" : "rejected";
      const { data: deposit, error } = await db.from("verification_deposits").select("id, user_id, payout_account_id").eq("id", entityId).single();
      if (error) throw error;
      const { error: depositUpdateError } = await db.from("verification_deposits").update({ status, verified_at: status === "verified" ? new Date().toISOString() : null }).eq("id", entityId);
      if (depositUpdateError) throw depositUpdateError;
      const { error: profileUpdateError } = await db.from("profiles").update({ payment_verification_status: status === "verified" ? "verified" : "rejected", payment_verified_at: status === "verified" ? new Date().toISOString() : null }).eq("id", deposit.user_id);
      if (profileUpdateError) throw profileUpdateError;
      if (status === "verified") {
        const { error: accountError } = await db.from("payout_accounts").update({ status: "verified", is_primary: true, verified_at: new Date().toISOString() }).eq("id", deposit.payout_account_id);
        if (accountError) throw accountError;
      }
      await audit(db, {
        eventType: `verification_${action}d`,
        entityType: "verification_deposit",
        entityId,
        userId: deposit.user_id,
        actorId: user.id,
        metadata: { note },
      });
      return json({ entityId, status });
    }

    if (entityType === "profile_edit_appeal") {
      if (action !== "approve" && action !== "reject") return json({ error: "Invalid profile appeal action" }, 400);
      const status = action === "approve" ? "approved" : "rejected";
      const { data: appeal, error: appealError } = await db.from("profile_edit_appeals").select("id, user_id").eq("id", entityId).single();
      if (appealError) throw appealError;
      const { error: updateError } = await db.from("profile_edit_appeals").update({ status, admin_note: note || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", entityId);
      if (updateError) throw updateError;
      if (status === "approved") {
        const { error: profileError } = await db.from("profiles").update({ profile_edit_appeal_approved: true }).eq("id", appeal.user_id);
        if (profileError) throw profileError;
      }
      await audit(db, { eventType: `profile_appeal_${status}`, entityType, entityId, userId: appeal.user_id, actorId: user.id, metadata: { note } });
      return json({ entityId, status });
    }

    if (action !== "approve" && action !== "reject" && action !== "mark_paid") return json({ error: "Invalid payout action" }, 400);
    const nextStatus = action === "approve" ? "approved" : action === "mark_paid" ? "paid" : "rejected";
    const { data: payout, error: payoutError } = await db.from("payout_requests").select("id, user_id").eq("id", entityId).single();
    if (payoutError) throw payoutError;
    const { error: updateError } = await db.from("payout_requests").update({ status: nextStatus, admin_note: note || null, reviewed_by: user.id, reviewed_at: new Date().toISOString(), paid_at: nextStatus === "paid" ? new Date().toISOString() : null }).eq("id", entityId);
    if (updateError) throw updateError;
    await audit(db, {
      eventType: action === "mark_paid" ? "payout_paid" : `payout_${action}d`,
      entityType: "payout_request",
      entityId,
      userId: payout.user_id,
      actorId: user.id,
      metadata: { note },
    });
    return json({ entityId, status: nextStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply admin payment action";
    return json({ error: message }, message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500);
  }
});
