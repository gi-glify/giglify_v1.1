import type { ProviderName } from "./provider-requests.ts";

export interface NormalizedProviderResponse {
  providerRequestId: string;
  checkoutUrl?: string;
  clientSecret?: string;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function checkoutUrl(value: unknown): string | undefined {
  const candidate = text(value);
  if (!candidate) return undefined;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? candidate : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeProviderResponse(provider: ProviderName, payload: unknown): NormalizedProviderResponse {
  const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};

  if (provider === "paystack") {
    const providerRequestId = text(data.reference) ?? text(body.reference);
    if (!providerRequestId) throw new Error("Provider response has no provider request identifier");
    return {
      providerRequestId,
      checkoutUrl: checkoutUrl(data.authorization_url),
      clientSecret: text(data.access_code),
    };
  }

  if (provider === "paypal") {
    const links = Array.isArray(body.links) ? body.links : [];
    const approvalLink = links.find((link) => (
      link && typeof link === "object" && (link as Record<string, unknown>).rel === "approve"
    ));
    const providerRequestId = text(body.id);
    if (!providerRequestId) throw new Error("Provider response has no provider request identifier");
    return {
      providerRequestId,
      checkoutUrl: checkoutUrl(approvalLink && typeof approvalLink === "object"
        ? (approvalLink as Record<string, unknown>).href
        : undefined),
    };
  }

  const providerRequestId = text(body.transactionId) ?? text(body.transaction_id) ?? text(body.id) ?? text(data.transactionId);
  if (!providerRequestId) throw new Error("Provider response has no provider request identifier");
  return { providerRequestId };
}
