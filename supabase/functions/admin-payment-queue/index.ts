import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";
import { summarizePayoutAccount } from "../_shared/finance.ts";
import { attachPaymentAccount, type PaymentAccountProfile } from "../_shared/payment-accounts.ts";

function bounded(value: unknown, fallback = 50): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 100) : fallback;
}

async function addAccountDetails<T extends { user_id: string }>(db: ReturnType<typeof import("../_shared/auth.ts").adminClient>, rows: T[]): Promise<Array<T & { account_name: string; account_email: string | null }>> {
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (userIds.length === 0) return rows.map((row) => attachPaymentAccount(row));
  const { data, error } = await db.from("profiles").select("id, first_name, last_name, email").in("id", userIds);
  if (error) throw error;
  const profileMap = new Map((data ?? []).map((profile) => [profile.id, profile as PaymentAccountProfile]));
  return rows.map((row) => attachPaymentAccount(row, profileMap.get(row.user_id)));
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req);
    const body = await req.json();
    const queue = body?.queue === "payouts" || body?.queue === "packages" ? body.queue : "deposits";
    const limit = bounded(body?.limit);
    const offset = Math.max(Number(body?.offset) || 0, 0);
    const status = typeof body?.status === "string" ? body.status : "";
    if (queue === "packages") {
      let query = db.from("transactions").select("id, user_id, tuid, package_tier, provider, amount, currency, status, verification_status, technical_error, created_at, completed_at, failed_at, payment_attempts(id, attempt_number, provider_request_id, provider_event_id, request_status, callback_status, technical_error, updated_at)", { count: "exact" }).eq("transaction_type", "package_purchase").order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (status) query = query.eq("status", status);
      const { data, error, count } = await query;
      if (error) throw error;
      return json({ queue, items: await addAccountDetails(db, data ?? []), count: count ?? 0, limit, offset });
    }
    if (queue === "payouts") {
      let query = db.from("payout_requests").select("id, user_id, payout_account_id, amount, status, admin_note, reviewed_by, reviewed_at, paid_at, provider_event_id, reconciled_at, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (status) query = query.eq("status", status);
      const { data, error, count } = await query;
      if (error) throw error;
      const rows = data ?? [];
      const userIds = [...new Set(rows.map((row) => row.user_id))];
      if (userIds.length === 0) return json({ queue, items: [], count: count ?? 0, limit, offset });
      const [{ data: profiles, error: profilesError }, { data: wallets, error: walletsError }, { data: credits, error: creditsError }, { data: payouts, error: payoutsError }] = await Promise.all([
        db.from("profiles").select("id, first_name, last_name, email").in("id", userIds),
        db.from("wallets").select("user_id, balance").in("user_id", userIds),
        db.from("task_submissions").select("user_id, reward_paid, reward_approved").in("user_id", userIds).eq("status", "approved"),
        db.from("payout_requests").select("user_id, amount, status").in("user_id", userIds),
      ]);
      if (profilesError) throw profilesError;
      if (walletsError) throw walletsError;
      if (creditsError) throw creditsError;
      if (payoutsError) throw payoutsError;
      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      const walletMap = new Map((wallets ?? []).map((wallet) => [wallet.user_id, wallet.balance]));
      return json({
        queue,
        items: rows.map((row) => {
          const profile = profileMap.get(row.user_id);
          const accounting = summarizePayoutAccount(row.user_id, {
            walletBalance: walletMap.get(row.user_id) ?? 0,
            credits: credits ?? [],
            payouts: payouts ?? [],
          });
          return {
            ...row,
            worker_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unnamed worker",
            account_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unnamed account",
            account_email: profile?.email || null,
            ...accounting,
          };
        }),
        count: count ?? 0,
        limit,
        offset,
      });
    }
    let query = db.from("verification_deposits").select("id, user_id, payout_account_id, method, amount_usd, amount_kes, exchange_rate, provider_reference, status, created_at, verified_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (status) query = query.eq("status", status);
    const { data, error, count } = await query;
    if (error) throw error;
    return json({ queue, items: await addAccountDetails(db, data ?? []), count: count ?? 0, limit, offset });
  } catch (error) {
    return error instanceof SyntaxError ? errorResponse({ message: "Invalid JSON body", status: 400, code: "invalid_json" }) : errorResponse(error);
  }
});
