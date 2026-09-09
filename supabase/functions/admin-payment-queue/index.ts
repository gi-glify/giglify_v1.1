import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";

function bounded(value: unknown, fallback = 50): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 100) : fallback;
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req);
    const body = await req.json();
    const queue = body?.queue === "payouts" ? "payouts" : "deposits";
    const limit = bounded(body?.limit);
    const offset = Math.max(Number(body?.offset) || 0, 0);
    const status = typeof body?.status === "string" ? body.status : "";
    if (queue === "payouts") {
      let query = db.from("payout_requests").select("id, user_id, payout_account_id, amount, status, admin_note, reviewed_by, reviewed_at, paid_at, provider_event_id, reconciled_at, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (status) query = query.eq("status", status);
      const { data, error, count } = await query;
      if (error) throw error;
      return json({ queue, items: data ?? [], count: count ?? 0, limit, offset });
    }
    let query = db.from("verification_deposits").select("id, user_id, payout_account_id, method, amount_usd, amount_kes, exchange_rate, provider_reference, status, created_at, verified_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (status) query = query.eq("status", status);
    const { data, error, count } = await query;
    if (error) throw error;
    return json({ queue, items: data ?? [], count: count ?? 0, limit, offset });
  } catch (error) {
    return error instanceof SyntaxError ? errorResponse({ message: "Invalid JSON body", status: 400, code: "invalid_json" }) : errorResponse(error);
  }
});
