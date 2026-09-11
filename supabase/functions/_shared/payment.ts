import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { buildPackageProviderRequest, type ProviderName } from "./provider-requests.ts";
import { normalizeProviderResponse } from "./provider-responses.ts";

export const PAYMENT_METHODS = ["mpesa", "paystack", "paypal"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const VERIFICATION_USD = 3;
export const KENYA_USD_RATE = 124.5;
export const VERIFICATION_KES = 373.5;

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && PAYMENT_METHODS.includes(value as PaymentMethod);
}

export type ProviderPayment = {
  reference: string;
  status: string;
  checkoutUrl?: string;
  clientSecret?: string;
};

export async function createProviderPayment(method: PaymentMethod, input: { depositId: string; userId: string; accountValue: string; email: string }): Promise<ProviderPayment> {
  const provider = method as ProviderName;
  const callbackUrl = Deno.env.get("VERIFICATION_PAYMENT_CALLBACK_URL");
  if (!callbackUrl) throw new Error("VERIFICATION_PAYMENT_CALLBACK_URL is not configured");
  const credentials = method === "paystack"
    ? { secret: Deno.env.get("PAYSTACK_SECRET_KEY") }
    : method === "paypal"
      ? { accessToken: Deno.env.get("PAYPAL_ACCESS_TOKEN"), baseUrl: Deno.env.get("PAYPAL_BASE_URL") || undefined }
      : { accessToken: Deno.env.get("MPESA_ACCESS_TOKEN"), baseUrl: Deno.env.get("MPESA_BASE_URL") || undefined, shortCode: Deno.env.get("MPESA_SHORTCODE"), passkey: Deno.env.get("MPESA_PASSKEY") };
  const phone = method === "mpesa" ? input.accountValue : undefined;
  const amountKes = method === "mpesa" ? Number(Deno.env.get("MPESA_VERIFICATION_AMOUNT_KES") || VERIFICATION_KES) : undefined;
  const request = buildPackageProviderRequest({
    provider,
    tuid: input.depositId,
    amountUsd: VERIFICATION_USD,
    amountKes,
    email: input.email,
    phone,
    idempotencyKey: input.depositId,
    callbackUrl,
    returnUrl: method === "paypal" ? Deno.env.get("VERIFICATION_PAYMENT_RETURN_URL") : undefined,
    cancelUrl: method === "paypal" ? Deno.env.get("VERIFICATION_PAYMENT_CANCEL_URL") : undefined,
    purpose: "verification",
  }, credentials);
  const response = await fetch(request.url, { method: "POST", headers: request.headers, body: request.body });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.message || payload?.error?.message || "Payment provider request failed");
  const normalized = normalizeProviderResponse(provider, payload);
  return { reference: normalized.providerRequestId, status: "pending", checkoutUrl: normalized.checkoutUrl, clientSecret: normalized.clientSecret };
}

export async function fingerprint(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function audit(
  db: SupabaseClient,
  eventType: string,
  entityType: string,
  entityId: string | null,
  userId: string | null,
  actorId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await db.from("payment_audit_logs").insert({
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId,
    actor_id: actorId,
    metadata,
  });
  if (error) throw error;
}
