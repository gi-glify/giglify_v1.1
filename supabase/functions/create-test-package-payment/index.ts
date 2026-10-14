import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";
import { readBodyText, rateLimit } from "../_shared/request-limits.ts";

function createTuid(): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return "TEST-GIG-" + stamp + "-" + crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
}

function parseBody(value: unknown): { tier: "pro" | "elite"; amountKes: number } {
  const body = value as Record<string, unknown>;
  const tier = body?.tier === "pro" || body?.tier === "elite" ? body.tier : null;
  const amountKes = Number(body?.amountKes);
  if (!tier) throw new HttpError("A paid package tier is required", 400, "validation_error");
  if (!Number.isSafeInteger(amountKes) || amountKes < 1 || amountKes > 250000) {
    throw new HttpError("Test amount must be a whole KES amount between 1 and 250000", 400, "validation_error");
  }
  return { tier, amountKes };
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireAdmin(req);
    await rateLimit("admin-test-package-payment", user.id, 5, 600);
    const { tier, amountKes } = parseBody(JSON.parse(await readBodyText(req, 4096)));
    const { data: plan, error: planError } = await db
      .from("package_tiers")
      .select("tier, price_usd, validity_months, tasks_allowed, high_paying_eligible")
      .eq("tier", tier)
      .eq("is_active", true)
      .single();
    if (planError || !plan) throw new HttpError("Selected package is unavailable", 409, "package_unavailable");

    const { data: activeEntitlement, error: entitlementError } = await db
      .from("package_entitlements")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .neq("tier", "free")
      .maybeSingle();
    if (entitlementError) throw entitlementError;
    if (activeEntitlement) throw new HttpError("Finish or expire the current paid package before starting a test package payment", 409, "active_package");

    const { data: transaction, error: transactionError } = await db
      .from("transactions")
      .insert({
        type: "deposit",
        tuid: createTuid(),
        user_id: user.id,
        transaction_type: "package_purchase",
        package_tier: plan.tier,
        amount: plan.price_usd,
        currency: "USD",
        provider: "mpesa",
        idempotency_key: `admin-test:${crypto.randomUUID()}`,
        status: "pending",
        verification_status: "pending",
        payment_metadata: {
          test_mode: true,
          test_amount_kes: amountKes,
          initiated_by: user.id,
        },
      })
      .select("id, tuid, package_tier, amount, currency, provider, status, created_at")
      .single();
    if (transactionError || !transaction) throw transactionError ?? new Error("Unable to create test transaction");

    const { data: attempt, error: attemptError } = await db
      .from("payment_attempts")
      .insert({
        transaction_id: transaction.id,
        attempt_number: 1,
        provider: "mpesa",
        amount: transaction.amount,
        currency: transaction.currency,
        request_status: "created",
        callback_status: "pending",
      })
      .select("id, attempt_number")
      .single();
    if (attemptError || !attempt) throw attemptError ?? new Error("Unable to create test payment attempt");

    return json({
      transactionId: transaction.id,
      tuid: transaction.tuid,
      paymentAttemptId: attempt.id,
      attemptNumber: attempt.attempt_number,
      tier: transaction.package_tier,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      provider: transaction.provider,
      status: transaction.status,
      testAmountKes: amountKes,
      createdAt: transaction.created_at,
    }, 201);
  } catch (error) {
    return error instanceof SyntaxError
      ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json"))
      : errorResponse(error);
  }
});
