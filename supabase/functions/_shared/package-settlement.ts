import type { ProviderName } from "./provider-requests.ts";

export type PackagePaymentEventStatus = "pending" | "success" | "failed" | "cancelled" | "expired";

export interface NormalizedPackagePaymentEvent {
  eventId: string;
  providerRequestId?: string;
  tuid: string;
  status: PackagePaymentEventStatus;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    const result = text(value);
    if (result) return result;
  }
  return undefined;
}

function requireReference(eventId: string | undefined, tuid: string | undefined): { eventId: string; tuid: string } {
  if (!eventId || !tuid) throw new Error("Callback requires an event ID or transaction reference");
  return { eventId, tuid };
}

export function normalizePackagePaymentEvent(provider: ProviderName, payload: unknown): NormalizedPackagePaymentEvent {
  const body = record(payload);

  if (provider === "paystack") {
    const data = record(body.data);
    const reference = firstText(data.reference, body.reference);
    const eventId = firstText(body.id, data.id);
    const event = text(body.event)?.toLowerCase() ?? "";
    const status = event === "charge.success" || data.status === "success"
      ? "success"
      : event.includes("failed") || data.status === "failed" ? "failed" : "pending";
    return { ...requireReference(eventId, reference), providerRequestId: reference, status };
  }

  if (provider === "paypal") {
    const resource = record(body.resource);
    const purchaseUnits = Array.isArray(resource.purchase_units) ? resource.purchase_units : [];
    const firstPurchaseUnit = record(purchaseUnits[0]);
    const relatedIds = record(record(resource.supplementary_data).related_ids);
    const providerRequestId = firstText(relatedIds.order_id, resource.id);
    const tuid = firstText(resource.custom_id, firstPurchaseUnit.custom_id, resource.reference_id, firstPurchaseUnit.reference_id);
    const eventType = text(body.event_type)?.toUpperCase() ?? "";
    const status = eventType === "PAYMENT.CAPTURE.COMPLETED"
      ? "success"
      : eventType.includes("DENIED") || eventType.includes("DECLINED") || eventType.includes("REVERSED") || eventType.includes("VOIDED")
        ? "failed"
        : "pending";
    const reference = requireReference(text(body.id), tuid);
    return { ...reference, providerRequestId, status };
  }

  const transaction = record(body.transaction);
  const eventId = firstText(transaction.id, body.id);
  const providerRequestId = firstText(transaction.provider_request_id, transaction.provider_checkout_id);
  const tuid = firstText(transaction.external_reference);
  const providerStatus = text(transaction.status)?.toUpperCase() ?? "";
  const eventType = text(body.event_type)?.toLowerCase() ?? "";
  const status = providerStatus === "SUCCESS" || eventType.endsWith(".success")
    ? "success"
    : providerStatus === "FAILED" || eventType.endsWith(".failed")
      ? "failed"
      : providerStatus === "CANCELLED" || eventType.endsWith(".cancelled")
        ? "cancelled"
        : providerStatus === "EXPIRED" || eventType.endsWith(".expired")
          ? "expired"
          : "pending";
  return { ...requireReference(eventId, tuid), providerRequestId, status };
}
