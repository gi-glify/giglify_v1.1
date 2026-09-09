import { requireAdmin } from "../_shared/auth.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

function bounded(value: unknown): number { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 100) : 50; }

Deno.serve(async (req) => {
  const preflight = options(req); if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { user, db } = await requireAdmin(req); const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "list"; const queue = typeof body?.queue === "string" ? body.queue : "users";
    if (action === "list") {
      const limit = bounded(body?.limit); const offset = Math.max(Number(body?.offset) || 0, 0); const search = typeof body?.search === "string" ? body.search.trim() : ""; const status = typeof body?.status === "string" ? body.status : "";
      if (queue === "users") {
        let query = db.from("profiles").select("id, first_name, last_name, email, country, subscription, profile_completion_pct, payment_verification_status, is_admin, created_at, updated_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
        if (search) query = query.or(`email.ilike.%${search.replaceAll(',', '')}%,first_name.ilike.%${search.replaceAll(',', '')}%,last_name.ilike.%${search.replaceAll(',', '')}%`);
        const { data, error, count } = await query; if (error) throw error; return json({ queue, items: data ?? [], count: count ?? 0, limit, offset });
      }
      if (queue === "appeals") {
        let query = db.from("profile_edit_appeals").select("id, user_id, reason, status, admin_note, reviewed_by, reviewed_at, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
        if (status) query = query.eq("status", status); const { data, error, count } = await query; if (error) throw error; return json({ queue, items: data ?? [], count: count ?? 0, limit, offset });
      }
      let query = db.from("contact_messages").select("id, user_id, name, email, message, status, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (status) query = query.eq("status", status); const { data, error, count } = await query; if (error) throw error; return json({ queue: "messages", items: data ?? [], count: count ?? 0, limit, offset });
    }
    const entityId = typeof body?.entityId === "string" ? body.entityId : ""; const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (action === "appeal") {
      if (!entityId || !["approve", "reject"].includes(body?.decision)) throw new HttpError("Invalid appeal action", 400, "validation_error");
      const { data: before, error } = await db.from("profile_edit_appeals").select("*").eq("id", entityId).single(); if (error) throw error;
      if (before.status !== "pending") throw new HttpError("Appeal is already resolved", 409, "stale_record"); if (body.decision === "reject" && !note) throw new HttpError("A rejection reason is required", 400, "reason_required");
      const status = body.decision === "approve" ? "approved" : "rejected"; const { data: after, error: updateError } = await db.from("profile_edit_appeals").update({ status, admin_note: note || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", entityId).eq("status", "pending").select("*").single(); if (updateError) throw updateError;
      if (status === "approved") { const { error: profileError } = await db.from("profiles").update({ profile_edit_appeal_approved: true }).eq("id", before.user_id); if (profileError) throw profileError; }
      await auditAdminAction(db, { actorUserId: user.id, action: `profile_appeal_${status}`, entityType: "profile_edit_appeal", entityId, before, after, reason: note, requestId: requestId(req) }); return json({ entityId, status });
    }
    if (action === "message") {
      if (!entityId || !["received", "sent", "failed"].includes(body?.status)) throw new HttpError("Invalid message action", 400, "validation_error");
      const { data: before, error } = await db.from("contact_messages").select("*").eq("id", entityId).single(); if (error) throw error; const { data: after, error: updateError } = await db.from("contact_messages").update({ status: body.status }).eq("id", entityId).eq("status", before.status).select("*").single(); if (updateError) throw updateError;
      await auditAdminAction(db, { actorUserId: user.id, action: `contact_message_${body.status}`, entityType: "contact_message", entityId, before, after, reason: note, requestId: requestId(req) }); return json({ entityId, status: body.status });
    }
    if (action === "notify") {
      if (!entityId || typeof body?.title !== "string" || !body.title.trim() || typeof body?.detail !== "string" || !body.detail.trim()) throw new HttpError("A user, title, and message are required", 400, "validation_error");
      const { data: profile, error: profileError } = await db.from("profiles").select("id").eq("id", entityId).single(); if (profileError) throw profileError;
      const { data: notification, error } = await db.from("notifications").insert({ user_id: profile.id, title: body.title.trim(), detail: body.detail.trim() }).select("id, user_id, title, detail, created_at").single(); if (error) throw error;
      await auditAdminAction(db, { actorUserId: user.id, action: "notification_created", entityType: "notification", entityId: notification.id, before: null, after: notification, reason: note, requestId: requestId(req) }); return json({ notification });
    }
    throw new HttpError("Invalid support action", 400, "validation_error");
  } catch (error) { return error instanceof SyntaxError ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json")) : errorResponse(error); }
});
