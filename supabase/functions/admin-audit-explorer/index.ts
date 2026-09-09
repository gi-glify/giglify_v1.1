import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const preflight = options(req); if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req); const body = await req.json(); const limit = Math.min(Math.max(Math.trunc(Number(body?.limit) || 50), 1), 100); const offset = Math.max(Number(body?.offset) || 0, 0);
    let query = db.from("admin_audit_logs").select("id, actor_user_id, action, entity_type, entity_id, before_json, after_json, reason, request_id, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (typeof body?.actorUserId === "string" && body.actorUserId) query = query.eq("actor_user_id", body.actorUserId);
    if (typeof body?.action === "string" && body.action) query = query.ilike("action", `%${body.action}%`);
    if (typeof body?.entityType === "string" && body.entityType) query = query.eq("entity_type", body.entityType);
    if (typeof body?.entityId === "string" && body.entityId) query = query.eq("entity_id", body.entityId);
    if (typeof body?.requestId === "string" && body.requestId) query = query.eq("request_id", body.requestId);
    const { data, error, count } = await query; if (error) throw error;
    const rows = data ?? []; const actorIds = [...new Set(rows.map((entry) => entry.actor_user_id))];
    const { data: actors, error: actorsError } = await db.from("profiles").select("id, first_name, last_name, email").in("id", actorIds); if (actorsError) throw actorsError;
    const actorMap = new Map((actors ?? []).map((actor) => [actor.id, actor]));
    return json({ entries: rows.map((entry) => ({ ...entry, actor_email: actorMap.get(entry.actor_user_id)?.email || null, actor_name: [actorMap.get(entry.actor_user_id)?.first_name, actorMap.get(entry.actor_user_id)?.last_name].filter(Boolean).join(" ") || null })), count: count ?? 0, limit, offset });
  } catch (error) { return error instanceof SyntaxError ? errorResponse({ message: "Invalid JSON body", status: 400, code: "invalid_json" } as never) : errorResponse(error); }
});
