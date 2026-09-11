import { adminClient } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";
import { normalizePackagePaymentEvent, type NormalizedPackagePaymentEvent } from "../_shared/package-settlement.ts";
import type { ProviderName } from "../_shared/provider-requests.ts";

function providerName(value: string | null): ProviderName {
  if (value === "paystack" || value === "paypal" || value === "mpesa") return value;
  throw new HttpError("Unsupported payment provider", 400, "provider_error");
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(`${name} is not configured`, 503, "configuration_error");
  return value;
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function paystackVerified(rawBody: string, request: Request): Promise<boolean> {
  const signature = request.headers.get("x-paystack-signature");
  if (!signature) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(requiredEnv("PAYSTACK_SECRET_KEY")), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return safeEqual(signature.toLowerCase(), hex(digest));
}

async function paypalVerified(payload: unknown, request: Request): Promise<boolean> {
  const accessToken = requiredEnv("PAYPAL_ACCESS_TOKEN");
  const webhookId = requiredEnv("PAYPAL_WEBHOOK_ID");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  const verificationPayload = {
    auth_algo: request.headers.get("paypal-auth-algo"),
    cert_url: request.headers.get("paypal-cert-url"),
    transmission_id: request.headers.get("paypal-transmission-id"),
    transmission_sig: request.headers.get("paypal-transmission-sig"),
    transmission_time: request.headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: payload,
  };
  if (Object.values(verificationPayload).some((value) => !value)) return false;
  const baseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";
  const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers,
    body: JSON.stringify(verificationPayload),
  });
  if (!response.ok) return false;
  const result = await response.json() as { verification_status?: string };
  return result.verification_status === "SUCCESS";
}

async function verifyProvider(provider: ProviderName, rawBody: string, payload: unknown, request: Request): Promise<boolean> {
  if (provider === "paystack") return paystackVerified(rawBody, request);
  if (provider === "paypal") return paypalVerified(payload, request);
  const expected = requiredEnv("PALPLUSS_CALLBACK_SECRET");
  const supplied = request.headers.get("x-mpesa-callback-secret") || new URL(request.url).searchParams.get("callback_secret") || "";
  return safeEqual(supplied, expected);
}

function terminalStatus(event: NormalizedPackagePaymentEvent): "failed" | "cancelled" | "expired" {
  if (event.status === "cancelled" || event.status === "expired") return event.status;
  return "failed";
}

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const provider = providerName(new URL(request.url).searchParams.get("provider"));
    const rawBody = await request.text();
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new HttpError("Invalid JSON body", 400, "invalid_json");
    }
    if (!(await verifyProvider(provider, rawBody, payload, request))) {
      throw new HttpError("Invalid provider callback signature", 401, "invalid_signature");
    }

    const event = normalizePackagePaymentEvent(provider, payload);
    const db = adminClient();
    const { data: duplicate } = await db.from("payment_attempts")
      .select("id, transaction_id")
      .eq("provider", provider)
      .eq("provider_event_id", event.eventId)
      .maybeSingle();
    if (duplicate) return json({ accepted: true, duplicate: true, transactionId: duplicate.transaction_id });

    const { data: attempt, error: attemptError } = await db.from("payment_attempts")
      .select("id, transaction_id, provider_request_id")
      .eq("provider", provider)
      .eq("provider_request_id", event.providerRequestId ?? "")
      .single();
    if (attemptError || !attempt) throw new HttpError("Payment attempt not found", 404, "attempt_not_found");

    if (event.status === "success") {
      const { data: settlement, error: settlementError } = await db.rpc("settle_package_payment", {
        p_attempt_id: attempt.id,
        p_provider_event_id: event.eventId,
        p_provider_request_id: event.providerRequestId ?? attempt.provider_request_id,
        p_provider_payload: payload,
      });
      if (settlementError) throw settlementError;
      return json({ accepted: true, settlement });
    }

    const now = new Date().toISOString();
    if (event.status === "pending") {
      const { error } = await db.from("payment_attempts").update({
        provider_event_id: event.eventId,
        provider_payload: payload,
        callback_status: "received",
        updated_at: now,
      }).eq("id", attempt.id);
      if (error) throw error;
      return json({ accepted: true, status: "pending" });
    }

    const status = terminalStatus(event);
    const { error: attemptUpdateError } = await db.from("payment_attempts").update({
      provider_event_id: event.eventId,
      provider_payload: payload,
      request_status: status === "failed" ? "failed" : "cancelled",
      callback_status: "verified",
      completed_at: now,
      updated_at: now,
    }).eq("id", attempt.id);
    if (attemptUpdateError) throw attemptUpdateError;
    const { error: transactionUpdateError } = await db.from("transactions").update({
      status,
      verification_status: "rejected",
      failed_at: now,
      updated_at: now,
    }).eq("id", attempt.transaction_id);
    if (transactionUpdateError) throw transactionUpdateError;

    return json({ accepted: true, status });
  } catch (error) {
    return errorResponse(error);
  }
});
