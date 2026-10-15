import { supabase } from '../utils/supabase';
import { PaymentMethod, PaymentVerificationStatus } from './paymentTypes';
import type { PaidPackageTier } from './packageCheckout';
import { summarizePackageVisibility, type PackageVisibility } from './packageVisibility';

export type PackagePaymentProvider = 'mpesa' | 'paystack' | 'paypal';

export type PackagePaymentStart = {
  transactionId: string;
  tuid: string;
  paymentAttemptId?: string;
  tier: PaidPackageTier;
  amount: number;
  originalAmount?: number;
  offerApplied?: boolean;
  currency: string;
  provider: PackagePaymentProvider;
  status: string;
  checkoutUrl?: string;
  clientSecret?: string;
};

export type PaymentVerificationState = {
  status: PaymentVerificationStatus;
  verifiedAt: string | null;
  accounts: Array<{
    id: string;
    method: PaymentMethod;
    accountLabel: string;
    status: string;
    isPrimary: boolean;
  }>;
  latestDeposit: {
    id: string;
    status: string;
    amountUsd: number;
    amountKes: number;
  } | null;
};

async function invoke<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message || `Unable to call ${name}`);
  return data as T;
}

export function createVerificationPayment(input: {
  method: PaymentMethod;
  accountLabel: string;
  accountValue: string;
  email?: string;
  phone?: string;
}) {
  return invoke<{ depositId: string; payoutAccountId: string; amountUsd: number; amountKes: number; status: string; checkoutUrl?: string; clientSecret?: string }>(
    'create-verification-payment',
    input,
  );
}

export function createPackagePayment(input: {
  tier: PaidPackageTier;
  provider: PackagePaymentProvider;
  idempotencyKey: string;
}) {
  return invoke<PackagePaymentStart>('create-package-payment', input);
}

export function startPackagePayment(input: { transactionId: string; email?: string; phone?: string }) {
  return invoke<PackagePaymentStart>('start-package-payment', input);
}

export type PackageCatalog = {
  plans: Array<{
    tier: 'free' | 'pro' | 'elite' | 'max';
    priceUsd: number;
    offerPriceUsd: number | null;
    offerAvailable: boolean;
    offerDiscountUsd: number;
    originalPriceKes: number | null;
    priceKes: number | null;
    validityMonths: number | null;
    tasksAllowed: number | null;
    dailyTasksAllowed: number | null;
    weeklyTasksAllowed: number | null;
    maxTaskRewardUsd: number | null;
    highPayingEligible: boolean;
  }>;
  verification: {
    amountUsd: number;
    amountKes: number;
  };
  expiryWarning: string | null;
};

export function fetchPackageCatalog() {
  return invoke<PackageCatalog>('package-catalog');
}

export async function fetchPackagePaymentStatus(transactionId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('status, provider')
    .eq('id', transactionId)
    .single();
  if (error) throw error;
  return { status: String(data.status), provider: data.provider as PackagePaymentProvider };
}

export async function fetchVerificationPaymentStatus(depositId: string) {
  const { data, error } = await supabase
    .from('verification_deposits')
    .select('status, method')
    .eq('id', depositId)
    .single();
  if (error) throw error;
  return { status: String(data.status), provider: data.method as PaymentMethod };
}

export async function fetchPackageVisibility(userId: string): Promise<PackageVisibility | null> {
  const { data: entitlement, error: entitlementError } = await supabase
    .from('package_entitlements')
    .select('id, tier, tasks_allowed, daily_tasks_allowed, weekly_tasks_allowed, max_task_reward_usd, high_paying_eligible, activation_at, renewal_at, usage_period_start')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('activation_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (entitlementError) throw entitlementError;
  if (!entitlement) return null;
  const usageStart = entitlement.tier === 'free'
    ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    : entitlement.usage_period_start;
  const { data: usageRows, error: usageError } = await supabase
    .from('package_usage_events')
    .select('started_at')
    .eq('user_id', userId)
    .eq('entitlement_id', entitlement.id)
    .gte('started_at', usageStart);
  if (usageError) throw usageError;
  const usage = usageRows ?? [];
  const now = Date.now();
  const tasksUsedToday = usage.filter((row) => now - new Date(row.started_at).getTime() < 24 * 60 * 60 * 1000).length;
  const tasksUsedThisWeek = usage.filter((row) => now - new Date(row.started_at).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  return summarizePackageVisibility(entitlement, usage.length, tasksUsedToday, tasksUsedThisWeek);
}

export function createPayoutRequest(input: { amount: number; payoutAccountId: string }) {
  return invoke<{ id: string; status: string }>('create-payout-request', input);
}

export async function fetchPaymentVerificationState(userId: string): Promise<PaymentVerificationState> {
  const [profileResult, accountsResult, depositsResult] = await Promise.all([
    supabase.from('profiles').select('payment_verification_status, payment_verified_at').eq('id', userId).single(),
    supabase.from('payout_accounts').select('id, method, account_label, status, is_primary').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('verification_deposits').select('id, status, amount_usd, amount_kes').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (accountsResult.error) throw accountsResult.error;
  if (depositsResult.error) throw depositsResult.error;

  const profile = profileResult.data;
  const deposit = depositsResult.data?.[0];
  return {
    status: profile.payment_verification_status,
    verifiedAt: profile.payment_verified_at,
    accounts: (accountsResult.data || []).map((account) => ({
      id: account.id,
      method: account.method,
      accountLabel: account.account_label,
      status: account.status,
      isPrimary: account.is_primary,
    })),
    latestDeposit: deposit
      ? { id: deposit.id, status: deposit.status, amountUsd: Number(deposit.amount_usd), amountKes: Number(deposit.amount_kes) }
      : null,
  };
}
