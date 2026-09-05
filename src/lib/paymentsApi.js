import { supabase } from '../utils/supabase';
async function invoke(name, body) {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error)
        throw new Error(error.message || `Unable to call ${name}`);
    return data;
}
export function createVerificationPayment(input) {
    return invoke('create-verification-payment', input);
}
export function createPayoutRequest(input) {
    return invoke('create-payout-request', input);
}
export async function fetchPaymentVerificationState(userId) {
    const [profileResult, accountsResult, depositsResult] = await Promise.all([
        supabase.from('profiles').select('payment_verification_status, payment_verified_at').eq('id', userId).single(),
        supabase.from('payout_accounts').select('id, method, account_label, status, is_primary').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('verification_deposits').select('id, status, amount_usd, amount_kes').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    ]);
    if (profileResult.error)
        throw profileResult.error;
    if (accountsResult.error)
        throw accountsResult.error;
    if (depositsResult.error)
        throw depositsResult.error;
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
//# sourceMappingURL=paymentsApi.js.map