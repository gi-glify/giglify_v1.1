import { audit } from "../_shared/payment.ts";
import { json, options } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireUser(req);
    const body = await req.json();
    const amount = Number(body?.amount);
    const payoutAccountId = typeof body?.payoutAccountId === "string" ? body.payoutAccountId : "";
    if (!Number.isFinite(amount) || amount < 15 || !payoutAccountId) {
      return json({ error: "A payout amount of at least $15 and a payout account are required" }, 400);
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("payment_verification_status")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.payment_verification_status !== "verified") {
      return json({ error: "Payment verification is required before requesting a payout" }, 403);
    }

    const { data: account, error: accountError } = await db
      .from("payout_accounts")
      .select("id, status, is_primary")
      .eq("id", payoutAccountId)
      .eq("user_id", user.id)
      .single();
    if (accountError || account.status !== "verified" || !account.is_primary) {
      return json({ error: "Select your verified primary payout account" }, 403);
    }

    const { data: request, error: requestError } = await db
      .from("payout_requests")
      .insert({ user_id: user.id, payout_account_id: account.id, amount, status: "requested" })
      .select("id, status")
      .single();
    if (requestError) throw requestError;

    await audit(db, "payout_requested", "payout_request", request.id, user.id, user.id, { amount });
    return json({ payoutRequestId: request.id, status: request.status }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payout request";
    return json({ error: message }, message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500);
  }
});
