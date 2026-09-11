export type ProviderName = "palpluss" | "paystack" | "paypal";

export interface ProviderRequestInput {
  provider: ProviderName;
  tuid: string;
  amountUsd: number;
  amountKes?: number;
  email: string;
  phone?: string;
  idempotencyKey: string;
  callbackUrl: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface ProviderCredentials {
  secret?: string;
  accessToken?: string;
  baseUrl?: string;
}

export interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

function jsonHeaders(authorization: string): Record<string, string> {
  return {
    Authorization: authorization,
    "Content-Type": "application/json",
  };
}

function requireAmount(amountUsd: number): number {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) throw new Error("A positive USD amount is required");
  return amountUsd;
}

function requireUrl(value: string, name: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(name + " must be an HTTPS URL");
  }
  if (parsed.protocol !== "https:") throw new Error(name + " must be an HTTPS URL");
  return value;
}

export function buildPackageProviderRequest(
  input: ProviderRequestInput,
  credentials: ProviderCredentials,
): ProviderRequest {
  const amountUsd = requireAmount(input.amountUsd);
  const callbackUrl = requireUrl(input.callbackUrl, "callbackUrl");

  if (input.provider === "paystack") {
    if (!credentials.secret) throw new Error("Paystack secret is required");
    if (!input.email) throw new Error("Paystack requires an email");
    return {
      url: "https://api.paystack.co/transaction/initialize",
      headers: jsonHeaders("Bearer " + credentials.secret),
      body: JSON.stringify({
        amount: String(Math.round(amountUsd * 100)),
        currency: "USD",
        email: input.email,
        reference: input.tuid,
        callback_url: callbackUrl,
        metadata: JSON.stringify({ tuid: input.tuid }),
      }),
    };
  }

  if (input.provider === "paypal") {
    if (!credentials.accessToken) throw new Error("PayPal access token is required");
    return {
      url: (credentials.baseUrl || "https://api-m.sandbox.paypal.com") + "/v2/checkout/orders",
      headers: jsonHeaders("Bearer " + credentials.accessToken),
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: input.tuid,
          custom_id: input.tuid,
          amount: { currency_code: "USD", value: amountUsd.toFixed(2) },
        }],
        application_context: {
          return_url: requireUrl(input.returnUrl ?? "", "returnUrl"),
          cancel_url: requireUrl(input.cancelUrl ?? "", "cancelUrl"),
        },
      }),
    };
  }

  if (!credentials.secret || !input.amountKes || input.amountKes <= 0 || !input.phone) {
    throw new Error("Palpluss requires amountKes and phone");
  }
  return {
    url: (credentials.baseUrl || "https://api.palpluss.com/v1") + "/payments/stk",
    headers: jsonHeaders("Basic " + btoa(credentials.secret + ":")),
    body: JSON.stringify({
      amount: input.amountKes,
      phone: input.phone,
      accountReference: input.tuid,
      transactionDesc: "Giglify package purchase",
      callbackUrl,
    }),
  };
}
