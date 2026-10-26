export type PaymentAccountProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export function attachPaymentAccount<T extends { user_id: string }>(row: T, profile?: PaymentAccountProfile | null): T & { account_name: string; account_email: string | null } {
  return {
    ...row,
    account_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unnamed account",
    account_email: profile?.email || null,
  };
}
