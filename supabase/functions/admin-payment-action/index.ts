import { audit } from "../_shared/payment.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireAdmin(req);
    const auditRequestId = requestId(req);
    const body = await req.json();
    const entityType = body?.entityType;
    const entityId = body?.entityId;
    const action = body?.action;
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!['verification_deposit', 'payout_request', 'profile_edit_appeal'].includes(entityType) || typeof entityId !== "string" || typeof action !== "string") {
      throw new HttpError("Invalid admin payment action", 400, "validation_error");
    }

    if (entityType === "verification_deposit") {
      if (!['approve', 'reject'].includes(action)) throw new HttpError("Invalid verification action", 400, "validation_error");
      const status = action === "approve" ? "verified" : "rejected";
      const { data: deposit, error } = await db.from("verification_deposits").select("id, user_id, payout_account_id, status, verified_at").eq("id", entityId).single();
      if (error) throw error;
      if (!['pending', 'held', 'created'].includes(deposit.status)) throw new HttpError("Verification deposit is already resolved", 409, "stale_record");
      if (action === "reject" && !note) throw new HttpError("A rejection reason is required", 400, "reason_required");
      const { error: depositUpdateError } = await db.from("verification_deposits").update({ status, verified_at: status === "verified" ? new Date().toISOString() : null }).eq("id", entityId).eq("status", deposit.status);
      if (depositUpdateError) throw depositUpdateError;
      const { error: profileUpdateError } = await db.from("profiles").update({ payment_verification_status: status === "verified" ? "verified" : "rejected", payment_verified_at: status === "verified" ? new Date().toISOString() : null }).eq("id", deposit.user_id);
      if (profileUpdateError) throw profileUpdateError;
      if (status === "verified") {
        const { error: accountError } = await db.from("payout_accounts").update({ status: "verified", is_primary: true, verified_at: new Date().toISOString() }).eq("id", deposit.payout_account_id);
        if (accountError) throw accountError;
      }
      const { data: updatedDeposit, error: updatedDepositError } = await db.from("verification_deposits").select("id, user_id, payout_account_id, status, verified_at").eq("id", entityId).single();
      if (updatedDepositError) throw updatedDepositError;
      await audit(db, {
        eventType: `verification_${action}d`,
        entityType: "verification_deposit",
        entityId,
        userId: deposit.user_id,
        actorId: user.id,
        metadata: { note },
      });
      await auditAdminAction(db, { actorUserId: user.id, action: `verification_${action}d`, entityType: "verification_deposit", entityId, before: deposit, after: updatedDeposit, reason: note, requestId: auditRequestId });
      return json({ entityId, status });
    }

    if (entityType === "profile_edit_appeal") {
      if (action !== "approve" && action !== "reject") throw new HttpError("Invalid profile appeal action", 400, "validation_error");
      const status = action === "approve" ? "approved" : "rejected";
      const { data: appeal, error: appealError } = await db.from("profile_edit_appeals").select("id, user_id, status, admin_note, reviewed_by, reviewed_at").eq("id", entityId).single();
      if (appealError) throw appealError;
      const { error: updateError } = await db.from("profile_edit_appeals").update({ status, admin_note: note || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", entityId);
      if (updateError) throw updateError;
      if (status === "approved") {
        const { error: profileError } = await db.from("profiles").update({ profile_edit_appeal_approved: true }).eq("id", appeal.user_id);
        if (profileError) throw profileError;
      }
      await audit(db, { eventType: `profile_appeal_${status}`, entityType, entityId, userId: appeal.user_id, actorId: user.id, metadata: { note } });
      const { data: updatedAppeal, error: updatedAppealError } = await db.from("profile_edit_appeals").select("id, user_id, status, admin_note, reviewed_by, reviewed_at").eq("id", entityId).single();
      if (updatedAppealError) throw updatedAppealError;
      await auditAdminAction(db, { actorUserId: user.id, action: `profile_appeal_${status}`, entityType, entityId, before: appeal, after: updatedAppeal, reason: note, requestId: auditRequestId });
      return json({ entityId, status });
    }

    if (action !== "approve" && action !== "reject" && action !== "mark_paid") throw new HttpError("Invalid payout action", 400, "validation_error");
    if (action === "reject" && !note) throw new HttpError("A rejection reason is required", 400, "reason_required");
    const nextStatus = action === "approve" ? "approved" : action === "mark_paid" ? "paid" : "rejected";
    const { data: payout, error: payoutError } = await db.from("payout_requests").select("id, user_id, payout_account_id, amount, status, admin_note, reviewed_by, reviewed_at, paid_at, provider_event_id, reconciled_at").eq("id", entityId).single();
    if (payoutError) throw payoutError;
    if (action === "approve" && !['requested', 'under_review'].includes(payout.status)) throw new HttpError("Payout is not awaiting approval", 409, "stale_record");
    if (action === "reject" && ['paid', 'rejected', 'cancelled'].includes(payout.status)) throw new HttpError("Payout is already resolved", 409, "stale_record");
    const providerEventId = typeof body?.providerEventId === "string" ? body.providerEventId.trim() : "";
    if (action === "mark_paid") {
      if (payout.status !== "approved") throw new HttpError("Only approved payouts can be marked paid", 409, "stale_record");
      if (!providerEventId) throw new HttpError("A reconciled provider event is required", 400, "provider_confirmation_required");
      const { data: providerEvent, error: providerEventError } = await db.from("payment_provider_events").select("id, event_id, event_type, processed_at").eq("event_id", providerEventId).not("processed_at", "is", null).maybeSingle();
      if (providerEventError) throw providerEventError;
      if (!providerEvent) throw new HttpError("Provider event has not been reconciled", 409, "provider_confirmation_required");
    }
    const { error: updateError } = await db.from("payout_requests").update({ status: nextStatus, admin_note: note || null, reviewed_by: user.id, reviewed_at: new Date().toISOString(), paid_at: nextStatus === "paid" ? new Date().toISOString() : null, provider_event_id: action === "mark_paid" ? providerEventId : payout.provider_event_id, reconciled_at: action === "mark_paid" ? new Date().toISOString() : payout.reconciled_at }).eq("id", entityId).eq("status", payout.status);
    if (updateError) throw updateError;
    await audit(db, {
      eventType: action === "mark_paid" ? "payout_paid" : `payout_${action}d`,
      entityType: "payout_request",
      entityId,
      userId: payout.user_id,
      actorId: user.id,
      metadata: { note },
    });
    const { data: updatedPayout, error: updatedPayoutError } = await db.from("payout_requests").select("id, user_id, status, admin_note, reviewed_by, reviewed_at, paid_at").eq("id", entityId).single();
    if (updatedPayoutError) throw updatedPayoutError;
    await auditAdminAction(db, { actorUserId: user.id, action: action === "mark_paid" ? "payout_paid" : `payout_${action}d`, entityType: "payout_request", entityId, before: payout, after: updatedPayout, reason: note, requestId: auditRequestId });
    return json({ entityId, status: nextStatus });
  } catch (error) {
    return errorResponse(error);
  }
});
