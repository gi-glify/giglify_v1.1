import { requireUser } from "../_shared/auth.ts";
import { HttpError, errorResponse, json, options } from "../_shared/http.ts";
import { normalizeProviderResponse } from "../_shared/provider-responses.ts";
import { buildPackageProviderRequest, type ProviderName } from "../_shared/provider-requests.ts";
import { providerCredentials, paymentCallback } from '../_shared/provider-auth.ts';
import { rateLimit, readBodyText } from '../_shared/request-limits.ts';

type PaymentBody = {
  transactionId?: unknown;
  email?: unknown;
  phone?: unknown;
};

function providerName(value: unknown): ProviderName {
  if (value === "mpesa" || value === "paystack" || value === "paypal") return value;
  throw new HttpError("Unsupported payment provider", 400, "provider_error");
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(`${name} is not configured`, 503, "configuration_error");
  return value;
}

function packageAmountKes(tier: string): number | undefined {
  const configured = Deno.env.get(`MPESA_${tier.toUpperCase()}_AMOUNT_KES`);
  if (!configured) return undefined;
  const amount = Number(configured);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new HttpError(`MPESA_${tier.toUpperCase()}_AMOUNT_KES must be a positive number`, 503, "configuration_error");
  }
  return amount;
}

function parseBody(value: unknown): { transactionId: string; email?: string; phone?: string } {
  const body = value as PaymentBody;
  const transactionId = typeof body?.transactionId === "string" ? body.transactionId.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : undefined;
  const phone = typeof body?.phone === "string" ? body.phone.trim() : undefined;
  if (!transactionId) throw new HttpError("transactionId is required", 400, "validation_error");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError("email must be valid", 400, "validation_error");
  }
  if (phone && !/^\+?[0-9 ()-]{8,24}$/.test(phone)) {
    throw new HttpError("phone must be a valid phone number", 400, "validation_error");
  }
  return { transactionId, email, phone };
}

function callbackUrls(provider: ProviderName) {
  const urls: { callbackUrl: string; returnUrl?: string; cancelUrl?: string } = {
    callbackUrl: requiredEnv("PACKAGE_PAYMENT_CALLBACK_URL"),
  };
  if (provider === "paypal") {
    urls.returnUrl = requiredEnv("PACKAGE_PAYMENT_RETURN_URL");
    urls.cancelUrl = requiredEnv("PACKAGE_PAYMENT_CANCEL_URL");
  }
  return urls;
}

async function responsePayload(response: Response): Promise<unknown> {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { providerMessage: raw.slice(0, 1000) };
  }
}

function resultPayload(transaction: Record<string, unknown>, normalized: { providerRequestId: string; checkoutUrl?: string; clientSecret?: string }) {
  return {
    transactionId: transaction.id,
    tuid: transaction.tuid,
    tier: transaction.package_tier,
    provider: transaction.provider,
    status: "pending",
    providerRequestId: normalized.providerRequestId,
    checkoutUrl: normalized.checkoutUrl,
    clientSecret: normalized.clientSecret,
  };
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireUser(req);
    await rateLimit('package-start', user.id, 10, 600);
    const { transactionId, email, phone } = parseBody(JSON.parse(await readBodyText(req, 8192)));
    const { data: transaction, error: transactionError } = await db
      .from("transactions")
      .select("id, tuid, user_id, package_tier, amount, currency, provider, status")
      .eq("id", transactionId)
      .eq("user_id", user.id)
      .single();
    if (transactionError || !transaction) throw new HttpError("Package transaction not found", 404, "not_found");
    if (transaction.status !== "pending" && transaction.status !== "created" && transaction.status !== "processing") {
      throw new HttpError("This package transaction cannot be started", 409, "transaction_not_startable");
    }

    const provider = providerName(transaction.provider);
    const { data: attempt, error: attemptError } = await db
      .from("payment_attempts")
      .select("id, attempt_number, request_status, provider_request_id, provider_payload")
      .eq("transaction_id", transaction.id)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (attemptError || !attempt) throw new HttpError("Payment attempt not found", 409, "attempt_not_found");

    if (attempt.provider_request_id && attempt.provider_payload) {
      const normalized = normalizeProviderResponse(provider, attempt.provider_payload);
      return json(resultPayload(transaction, normalized));
    }
    if (attempt.request_status === "processing") {
      throw new HttpError("This payment is already being started", 409, "payment_in_progress");
    }

    const urls = callbackUrls(provider);
    const request = buildPackageProviderRequest({
      provider,
      tuid: transaction.tuid,
      amountUsd: Number(transaction.amount),
      amountKes: provider === "mpesa" ? packageAmountKes(transaction.package_tier) : undefined,
      email: email || user.email || "",
      phone,
      idempotencyKey: `${transaction.tuid}:${attempt.attempt_number}`,
      ...urls,
      checkoutReturnUrl: provider === 'paystack' ? requiredEnv('PACKAGE_PAYMENT_RETURN_URL') : undefined,
      callbackUrl: paymentCallback(urls.callbackUrl, provider),
    }, await providerCredentials(provider));

    const now = new Date().toISOString();
    const { data: claimed, error: processingAttemptError } = await db.from("payment_attempts").update({
      request_status: "processing",
      expected_amount: provider === 'mpesa' ? Math.round(packageAmountKes(transaction.package_tier)!) : Number(transaction.amount),
      expected_currency: provider === 'mpesa' ? 'KES' : transaction.currency,
      updated_at: now,
    }).eq("id", attempt.id).eq("request_status", "created").select('id').maybeSingle();
    if (processingAttemptError) throw processingAttemptError;
    if (!claimed) throw new HttpError('Payment is already being started', 409, 'payment_in_progress');
    await db.from("transactions").update({ status: "processing", updated_at: now }).eq("id", transaction.id);

    let providerResponse: Response;
    try {
      providerResponse = await fetch(request.url, { method: "POST", headers: request.headers, body: request.body, signal: AbortSignal.timeout(25000) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment provider could not be reached";
      // A timeout does not prove the provider rejected the charge. Keep it for reconciliation.
      await db.from("payment_attempts").update({ technical_error: message, updated_at: new Date().toISOString() }).eq("id", attempt.id);
      await db.from("transactions").update({ technical_error: message, updated_at: new Date().toISOString() }).eq("id", transaction.id).eq('status', 'processing');
      throw new HttpError("Payment provider could not be reached", 502, "provider_unavailable");
    }
    const payload = await responsePayload(providerResponse);
    if (!providerResponse.ok) {
      const message = payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).message === "string"
        ? (payload as Record<string, unknown>).message as string
        : "Payment provider rejected the request";
      await db.from("payment_attempts").update({ request_status: "failed", provider_payload: payload, technical_error: message, updated_at: new Date().toISOString() }).eq("id", attempt.id);
      await db.from("transactions").update({ status: "failed", technical_error: message, failed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", transaction.id);
      throw new HttpError(message, 502, "provider_error");
    }

    const normalized = normalizeProviderResponse(provider, payload);
    const completedAt = new Date().toISOString();
    const { error: updateAttemptError } = await db.from("payment_attempts").update({
      request_status: "pending",
      provider_request_id: normalized.providerRequestId,
      provider_payload: payload,
      updated_at: completedAt,
    }).eq("id", attempt.id);
    if (updateAttemptError) throw updateAttemptError;
    const { error: updateTransactionError } = await db.from("transactions").update({
      status: "pending",
      technical_error: null,
      updated_at: completedAt,
    }).eq("id", transaction.id).eq('status', 'processing');
    if (updateTransactionError) throw updateTransactionError;

    return json(resultPayload(transaction, normalized), 201);
  } catch (error) {
    return error instanceof SyntaxError
      ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json"))
      : errorResponse(error);
  }
});
