import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";
import { fetchRows, parseDateRange } from "../_shared/metrics.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req);
    const range = parseDateRange(await req.json());
    const applications = await fetchRows(db, "requester_applications", "submitted_at, review_available_at, status", "submitted_at", range);
    const funnel = applications.reduce<Record<string, number>>((result, row) => ({ ...result, [String(row.status)]: (result[String(row.status)] ?? 0) + 1 }), {});
    return json({ range, total: applications.length, funnel });
  } catch (error) {
    return errorResponse(error);
  }
});
