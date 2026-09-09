import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const preflight = options(req); if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { user, db } = await requireAdmin(req);
    const [{ data: profile, error: profileError }, { data: activity, error: activityError }] = await Promise.all([
      db.from("profiles").select("*").eq("id", user.id).single(),
      db.from("admin_audit_logs").select("id, action, entity_type, entity_id, reason, request_id, created_at").eq("actor_user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    if (profileError) throw profileError;
    if (activityError) throw activityError;
    return json({ admin: { id: user.id, email: user.email, createdAt: user.created_at, lastSignInAt: user.last_sign_in_at, appMetadata: user.app_metadata, userMetadata: user.user_metadata, profile }, activity: activity ?? [] });
  } catch (error) { return errorResponse(error); }
});
