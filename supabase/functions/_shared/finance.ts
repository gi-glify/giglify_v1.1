type TaskCreditRow = {
  user_id: string;
  reward_paid: number | string | null;
  reward_approved: number | string | null;
};

type PayoutRow = {
  user_id: string;
  amount: number | string;
  status: string;
};

export type PayoutAccountSummary = {
  walletBalance: number;
  taskCredits: number;
  payoutsPaid: number;
  payoutsPending: number;
  availableAfterPayouts: number;
};

function cents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function summarizePayoutAccount(
  userId: string,
  input: {
    walletBalance: number | string | null;
    credits: TaskCreditRow[];
    payouts: PayoutRow[];
  },
): PayoutAccountSummary {
  const taskCredits = input.credits
    .filter((row) => row.user_id === userId)
    .reduce((total, row) => total + Number(row.reward_paid ?? row.reward_approved ?? 0), 0);
  const payoutsPaid = input.payouts
    .filter((row) => row.user_id === userId && row.status === "paid")
    .reduce((total, row) => total + Number(row.amount ?? 0), 0);
  const payoutsPending = input.payouts
    .filter((row) => row.user_id === userId && ["requested", "under_review", "approved"].includes(row.status))
    .reduce((total, row) => total + Number(row.amount ?? 0), 0);

  return {
    walletBalance: cents(Number(input.walletBalance ?? 0)),
    taskCredits: cents(taskCredits),
    payoutsPaid: cents(payoutsPaid),
    payoutsPending: cents(payoutsPending),
    availableAfterPayouts: cents(Math.max(taskCredits - payoutsPaid - payoutsPending, 0)),
  };
}
