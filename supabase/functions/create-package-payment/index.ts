import { requireUser } from "../_shared/auth.ts";
import { HttpError, errorResponse, json, options } from "../_shared/http.ts";
import { parsePackagePaymentRequest } from "../_shared/package-contract.ts";

function createTuid(): string {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return "GIG-" + stamp + "-" + crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireUser(req);
    const input = parsePackagePaymentRequest(await req.json());
    if (!input) {
      throw new HttpError("A paid package and approved payment provider are required", 400, "validation_error");
    }

    const { error: expiryError } = await db.rpc("expire_due_package_entitlements");
    if (expiryError) throw expiryError;

    const [{ data: profile, error: profileError }, { data: entitlement, error: entitlementError }, { data: plan, error: planError }] = await Promise.all([
      db.from("profiles").select("subscription").eq("id", user.id).maybeSingle(),
      db.from("package_entitlements").select("tier, status, renewal_at").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      db.from("package_tiers").select("tier, price_usd, validity_months, tasks_allowed, high_paying_eligible").eq("tier", input.tier).eq("is_active", true).single(),
    ]);
    if (profileError) throw profileError;
    if (entitlementError) throw entitlementError;
    if (planError || !plan) throw new HttpError("Selected package is unavailable", 409, "package_unavailable");

    const currentTier = entitlement?.tier ?? profile?.subscription ?? "free";
    if (currentTier !== "free") {
      throw new HttpError("Your active paid package cannot be changed until its period ends", 409, "active_package");
    }

    const now = new Date().toISOString();
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
        provider: input.provider,
        idempotency_key: input.idempotencyKey,
        status: "pending",
        verification_status: "pending",
      })
      .select("id, tuid, package_tier, amount, currency, provider, status, created_at")
      .single();
    if (transactionError) {
      if (transactionError.code === "23505") {
        const { data: existing, error: existingError } = await db
          .from("transactions")
          .select("id, tuid, package_tier, amount, currency, provider, status, created_at")
          .eq("user_id", user.id)
          .eq("idempotency_key", input.idempotencyKey)
          .single();
        if (existingError || !existing) throw existingError ?? transactionError;
        return json({
          transactionId: existing.id,
          tuid: existing.tuid,
          tier: existing.package_tier,
          amount: Number(existing.amount),
          currency: existing.currency,
          provider: existing.provider,
          status: existing.status,
          createdAt: existing.created_at,
          duplicate: true,
        }, 200);
      }
      throw transactionError;
    }
    if (!transaction) throw new Error("Unable to create transaction");

    const { data: attempt, error: attemptError } = await db
      .from("payment_attempts")
      .insert({
        transaction_id: transaction.id,
        attempt_number: 1,
        provider: input.provider,
        amount: transaction.amount,
        currency: transaction.currency,
        request_status: "created",
        callback_status: "pending",
      })
      .select("id, attempt_number, provider, request_status, callback_status")
      .single();
    if (attemptError || !attempt) {
      await db.from("transactions").update({
        status: "failed",
        technical_error: attemptError?.message ?? "Unable to create payment attempt",
        failed_at: now,
        updated_at: now,
      }).eq("id", transaction.id);
      throw attemptError ?? new Error("Unable to create payment attempt");
    }

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
      createdAt: transaction.created_at,
    }, 201);
  } catch (error) {
    return error instanceof SyntaxError
      ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json"))
      : errorResponse(error);
  }
});
