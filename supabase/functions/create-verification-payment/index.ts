import { audit, createProviderPayment, fingerprint, isPaymentMethod, KENYA_USD_RATE, VERIFICATION_KES, VERIFICATION_USD } from "../_shared/payment.ts";
import { json, options } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireUser(req);
    const body = await req.json();
    const method = body?.method;
    const accountLabel = typeof body?.accountLabel === "string" ? body.accountLabel.trim() : "";
    const accountValue = typeof body?.accountValue === "string" ? body.accountValue.trim() : "";

    if (!isPaymentMethod(method) || !accountLabel || !accountValue) {
      return json({ error: "A supported payment method and payout account are required" }, 400);
    }

    const accountFingerprint = await fingerprint(`${method}:${accountValue}`);
    const { data: account, error: accountError } = await db
      .from("payout_accounts")
      .insert({
        user_id: user.id,
        method,
        account_fingerprint: accountFingerprint,
        account_label: accountLabel,
        status: "pending",
        is_primary: false,
      })
      .select("id")
      .single();
    if (accountError) {
      if (accountError.code === "23505") return json({ error: "This payout account is already registered" }, 409);
      throw accountError;
    }

    const { data: deposit, error: depositError } = await db
      .from("verification_deposits")
      .insert({
        user_id: user.id,
        payout_account_id: account.id,
        method,
        amount_usd: VERIFICATION_USD,
        amount_kes: VERIFICATION_KES,
        exchange_rate: KENYA_USD_RATE,
        status: "created",
      })
      .select("id")
      .single();
    if (depositError) throw depositError;

    let providerPayment;
    try {
      providerPayment = await createProviderPayment(method, { depositId: deposit.id, userId: user.id, accountValue });
    } catch (providerError) {
      await db.from("verification_deposits").update({ status: "failed" }).eq("id", deposit.id);
      throw providerError;
    }

    const { error: providerUpdateError } = await db
      .from("verification_deposits")
      .update({ status: "pending", provider_reference: providerPayment.reference })
      .eq("id", deposit.id);
    if (providerUpdateError) throw providerUpdateError;

    const { error: profileError } = await db
      .from("profiles")
      .update({ payment_verification_status: "deposit_pending" })
      .eq("id", user.id);
    if (profileError) throw profileError;

    await audit(db, "verification_started", "verification_deposit", deposit.id, user.id, user.id, {
      method,
      amount_usd: VERIFICATION_USD,
      amount_kes: VERIFICATION_KES,
    });

    return json({
      depositId: deposit.id,
      payoutAccountId: account.id,
      status: "deposit_pending",
      amountUsd: VERIFICATION_USD,
      amountKes: VERIFICATION_KES,
      providerStatus: providerPayment.status,
      checkoutUrl: providerPayment.checkoutUrl,
      clientSecret: providerPayment.clientSecret,
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create verification payment";
    return json({ error: message }, message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500);
  }
});
