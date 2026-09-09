import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

function limitValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 100) : 50;
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req);
    const body = await req.json();
    const limit = limitValue(body?.limit);
    const offset = Math.max(Number(body?.offset) || 0, 0);
    const search = typeof body?.search === "string" ? body.search.trim() : "";
    const status = typeof body?.status === "string" ? body.status : "";

    let applicationsQuery = db.from("requester_applications")
      .select("id, user_id, legal_name, organization_name, phone, country, id_type, task_brief, status, submitted_at, review_available_at, reviewed_at, admin_note", { count: "exact" })
      .order("submitted_at", { ascending: true })
      .range(offset, offset + limit - 1);
    if (status) applicationsQuery = applicationsQuery.eq("status", status);
    if (search) applicationsQuery = applicationsQuery.or(`legal_name.ilike.%${search.replaceAll(',', '')}%,organization_name.ilike.%${search.replaceAll(',', '')}%`);
    const { data: applications, error: applicationsError, count: applicationCount } = await applicationsQuery;
    if (applicationsError) throw applicationsError;

    let draftsQuery = db.from("requester_task_drafts")
      .select("id, requester_id, title, context, category, difficulty, reward, questions, status, created_at, reviewed_at, admin_note", { count: "exact" })
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);
    if (status) draftsQuery = draftsQuery.eq("status", status);
    if (search) draftsQuery = draftsQuery.ilike("title", `%${search}%`);
    const { data: drafts, error: draftsError, count: draftCount } = await draftsQuery;
    if (draftsError) throw draftsError;
    return json({ applications: applications ?? [], drafts: drafts ?? [], counts: { applications: applicationCount ?? 0, drafts: draftCount ?? 0 }, limit, offset });
  } catch (error) {
    return error instanceof SyntaxError ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json")) : errorResponse(error);
  }
});
