import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";
import { fetchRows, groupByDay, parseDateRange } from "../_shared/metrics.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req);
    const range = parseDateRange(await req.json());
    const payouts = await fetchRows(db, "payout_requests", "created_at, status, amount", "created_at", range);
    const deposits = await fetchRows(db, "verification_deposits", "created_at, status, amount_usd", "created_at", range);
    return json({ range, payouts: groupByDay(payouts, "created_at", "amount"), deposits: groupByDay(deposits, "created_at", "amount_usd"), payoutStatus: payouts.reduce<Record<string, number>>((result, row) => ({ ...result, [String(row.status)]: (result[String(row.status)] ?? 0) + 1 }), {}) });
  } catch (error) {
    return errorResponse(error);
  }
});
