export const PACKAGE_PAYMENT_PROVIDERS = ["mpesa", "paystack", "paypal"] as const;
export type PackagePaymentProvider = (typeof PACKAGE_PAYMENT_PROVIDERS)[number];

export const PAID_PACKAGE_TIERS = ["pro", "elite"] as const;
export type PaidPackageTier = (typeof PAID_PACKAGE_TIERS)[number];

export function parsePackagePaymentRequest(
  input: unknown,
): { tier: PaidPackageTier; provider: PackagePaymentProvider; idempotencyKey: string } | null {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  if (!PAID_PACKAGE_TIERS.includes(body.tier as PaidPackageTier)) return null;
  if (!PACKAGE_PAYMENT_PROVIDERS.includes(body.provider as PackagePaymentProvider)) return null;
  if (typeof body.idempotencyKey !== "string" || !/^[A-Za-z0-9._:-]{16,200}$/.test(body.idempotencyKey)) return null;
  return {
    tier: body.tier as PaidPackageTier,
    provider: body.provider as PackagePaymentProvider,
    idempotencyKey: body.idempotencyKey,
  };
}
