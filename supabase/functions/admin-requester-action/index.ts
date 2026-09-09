import { requireAdmin } from "../_shared/auth.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { user, db } = await requireAdmin(req);
    const auditRequestId = requestId(req);
    const body = await req.json();
    const entityType = body?.entityType;
    const entityId = typeof body?.entityId === "string" ? body.entityId : "";
    const action = body?.action;
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!['requester_application', 'requester_task'].includes(entityType) || !entityId || !['approve', 'reject', 'request_info'].includes(action)) {
      throw new HttpError("Invalid requester action", 400, "validation_error");
    }
    if (action === "reject" && !note) throw new HttpError("A rejection reason is required", 400, "reason_required");
    if (entityType === "requester_task" && action === "approve") throw new HttpError("Use publish-requester-task to approve a task draft", 400, "publish_required");
    const table = entityType === 'requester_application' ? 'requester_applications' : 'requester_task_drafts';
    const { data: item, error: findError } = await db.from(table)
      .select(entityType === 'requester_application'
        ? 'id, user_id, status, admin_note, reviewed_at, reviewed_by'
        : 'id, requester_id, status, admin_note, reviewed_at, reviewed_by')
      .eq('id', entityId)
      .single();
    if (findError) throw findError;
    const userId = item.user_id || item.requester_id;
    const status = action === 'approve' ? 'approved' : action === 'request_info' ? 'pending' : 'rejected';
    const update = entityType === 'requester_application'
      ? { status, reviewed_at: new Date().toISOString(), reviewed_by: user.id, admin_note: note || null }
      : { status, reviewed_at: new Date().toISOString(), reviewed_by: user.id, admin_note: note || null };
    const { data: updated, error: updateError } = await db.from(table).update(update).eq('id', entityId).eq('status', item.status).select('*').single();
    if (updateError) throw updateError;
    const notificationTitle = action === 'request_info' ? 'More information requested' : `Requester ${action}d`;
    const notificationDetail = note || (action === 'approve' ? 'Your requester access is approved.' : action === 'request_info' ? 'Please review the admin note and provide the requested information.' : 'Your requester request was not approved.');
    const { error: notificationError } = await db.from('notifications').insert({ user_id: userId, title: notificationTitle, detail: notificationDetail });
    if (notificationError) throw notificationError;
    await auditAdminAction(db, {
      actorUserId: user.id,
      action: `requester_${entityType}_${action}`,
      entityType,
      entityId,
      before: item,
      after: updated,
      reason: note,
      requestId: auditRequestId,
    });
    return json({ entityId, status });
  } catch (error) {
    return errorResponse(error);
  }
});
