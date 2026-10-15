export type MarketingUser = {
  id: string;
  email: string | null;
  emailConfirmedAt: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  optedOut: boolean;
};

export function selectMarketingRecipients(users: MarketingUser[]): MarketingUser[] {
  return users.filter((user) => Boolean(user.email) && Boolean(user.emailConfirmedAt) && !user.isAdmin && !user.optedOut);
}

export function chunkRecipients<T>(recipients: T[], size = 100): T[][] {
  const safeSize = Math.max(1, Math.floor(size));
  const batches: T[][] = [];
  for (let index = 0; index < recipients.length; index += safeSize) batches.push(recipients.slice(index, index + safeSize));
  return batches;
}
