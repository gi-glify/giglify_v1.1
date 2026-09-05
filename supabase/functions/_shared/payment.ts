import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const PAYMENT_METHODS = ["mpesa", "paypal", "stripe"] as const;
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

async function formRequest(url: string, body: URLSearchParams, headers: Record<string, string>) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers }, body });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || data?.error_description || data?.message || "Payment provider request failed");
  return data;
}

export async function createProviderPayment(method: PaymentMethod, input: { depositId: string; userId: string; accountValue: string }): Promise<ProviderPayment> {
  if (method === "stripe") {
    const secret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secret) throw new Error("Stripe is not configured");
    const data = await formRequest("https://api.stripe.com/v1/payment_intents", new URLSearchParams({
      amount: "300",
      currency: "usd",
      "metadata[deposit_id]": input.depositId,
      "metadata[user_id]": input.userId,
      description: "Giglify payout account verification",
    }), { Authorization: `Bearer ${secret}` });
    return { reference: data.id, status: data.status, clientSecret: data.client_secret };
  }

  if (method === "paypal") {
    const client = Deno.env.get("PAYPAL_CLIENT_ID");
    const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    if (!client || !secret) throw new Error("PayPal is not configured");
    const tokenData = await formRequest(`${Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com"}/v1/oauth2/token`, new URLSearchParams({ grant_type: "client_credentials" }), {
      Authorization: `Basic ${btoa(`${client}:${secret}`)}`,
    });
    const response = await fetch(`${Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com"}/v2/checkout/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenData.access_token}` },
      body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ reference_id: input.depositId, description: "Giglify payout account verification", amount: { currency_code: "USD", value: "3.00" } }] }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "PayPal order creation failed");
    return { reference: data.id, status: data.status, checkoutUrl: data.links?.find((link: { rel: string }) => link.rel === "approve")?.href };
  }

  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
  const shortcode = Deno.env.get("MPESA_SHORTCODE");
  const passkey = Deno.env.get("MPESA_PASSKEY");
  const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL");
  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) throw new Error("M-Pesa is not configured");
  const baseUrl = Deno.env.get("MPESA_BASE_URL") || "https://sandbox.safaricom.co.ke";
  const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}` } });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) throw new Error(tokenData?.errorMessage || "M-Pesa authentication failed");
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenData.access_token}` },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: btoa(`${shortcode}${passkey}${timestamp}`),
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: 374,
      PartyA: input.accountValue.replace(/\D/g, ""),
      PartyB: shortcode,
      PhoneNumber: input.accountValue.replace(/\D/g, ""),
      CallBackURL: callbackUrl,
      AccountReference: input.depositId,
      TransactionDesc: "Giglify payout account verification",
    }),
  });
  const data = await stkResponse.json();
  if (!stkResponse.ok || data.ResponseCode !== "0") throw new Error(data?.errorMessage || data?.ResponseDescription || "M-Pesa payment request failed");
  return { reference: data.CheckoutRequestID, status: "pending" };
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
