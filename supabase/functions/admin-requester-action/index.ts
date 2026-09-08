import { requireAdmin } from "../_shared/auth.ts";
import { audit } from "../_shared/payment.ts";
import { json, options } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { user, db } = await requireAdmin(req);
    const body = await req.json();
    const entityType = body?.entityType;
    const entityId = typeof body?.entityId === "string" ? body.entityId : "";
    const action = body?.action;
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!['requester_application', 'requester_task'].includes(entityType) || !entityId || !['approve', 'reject'].includes(action)) return json({ error: "Invalid requester action" }, 400);
    const table = entityType === 'requester_application' ? 'requester_applications' : 'requester_task_drafts';
    const { data: item, error: findError } = await db.from(table).select(entityType === 'requester_application' ? 'id, user_id' : 'id, requester_id').eq('id', entityId).single();
    if (findError) throw findError;
    const userId = item.user_id || item.requester_id;
    const status = action === 'approve' ? 'approved' : 'rejected';
    const update = entityType === 'requester_application'
      ? { status, reviewed_at: new Date().toISOString(), reviewed_by: user.id, admin_note: note || null }
      : { status, reviewed_at: new Date().toISOString(), reviewed_by: user.id, admin_note: note || null };
    const { error: updateError } = await db.from(table).update(update).eq('id', entityId);
    if (updateError) throw updateError;
    await db.from('notifications').insert({ user_id: userId, title: `Requester ${action}d`, detail: note || (action === 'approve' ? 'Your requester access is approved.' : 'Your requester request was not approved.') });
    await audit(db, { eventType: `requester_${entityType}_${action}d`, entityType, entityId, userId, actorId: user.id, metadata: { note } });
    return json({ entityId, status });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to apply requester action' }, 500);
  }
});
