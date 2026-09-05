import { supabase } from '../utils/supabase';
import { PaymentMethod, PaymentVerificationStatus } from './paymentTypes';

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
}) {
  return invoke<{ depositId: string; payoutAccountId: string; amountUsd: number; amountKes: number; status: string; checkoutUrl?: string; clientSecret?: string }>(
    'create-verification-payment',
    input,
  );
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
