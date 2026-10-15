import { requireAdmin } from "../_shared/auth.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

function bounded(value: unknown, fallback = 50): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 100) : fallback;
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireAdmin(req);
    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "list";

    if (action === "list") {
      const limit = bounded(body?.limit);
      const offset = Math.max(Number(body?.offset) || 0, 0);
      let query = db.from("support_inbox_messages")
        .select("id, provider_email_id, message_id, sender_name, sender_email, recipients, subject, text_body, thread_key, received_at, read_at", { count: "exact" })
        .order("received_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (body?.unread === true) query = query.is("read_at", null);
      const { data, error, count } = await query;
      if (error) throw error;
      return json({ items: data ?? [], count: count ?? 0, limit, offset });
    }

    if (action === "read") {
      const entityId = typeof body?.entityId === "string" ? body.entityId : "";
      if (!entityId) throw new HttpError("A message id is required.", 400, "validation_error");
      const { data: before, error: beforeError } = await db.from("support_inbox_messages").select("*").eq("id", entityId).single();
      if (beforeError) throw beforeError;
      const { data: after, error } = await db.from("support_inbox_messages").update({ read_at: before.read_at || new Date().toISOString() }).eq("id", entityId).select("*").single();
      if (error) throw error;
      await auditAdminAction(db, {
        actorUserId: user.id,
        action: "support_inbox_message_read",
        entityType: "support_inbox_message",
        entityId,
        before,
        after,
        reason: "Admin opened inbound support email",
        requestId: requestId(req),
      });
      return json({ message: after });
    }

    throw new HttpError("Invalid inbox action.", 400, "validation_error");
  } catch (error) {
    return error instanceof SyntaxError ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json")) : errorResponse(error);
  }
});
