import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";
import { fetchRows, groupCountByDay, parseDateRange } from "../_shared/metrics.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req);
    const range = parseDateRange(await req.json());
    const rows = await fetchRows(db, "task_submissions", "started_at, status", "started_at", range);
    return json({ range, started: groupCountByDay(rows, "started_at"), submitted: groupCountByDay(rows.filter((row) => row.status === "submitted"), "started_at"), approved: groupCountByDay(rows.filter((row) => row.status === "approved"), "started_at"), rejected: groupCountByDay(rows.filter((row) => row.status === "rejected"), "started_at") });
  } catch (error) {
    return errorResponse(error);
  }
});
