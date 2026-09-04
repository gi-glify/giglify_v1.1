import { User } from '../types';

/** Below this completion %, task access is limited (see requirement #6). */
export const PROFILE_TASK_LIMIT_THRESHOLD = 70;
export const DAILY_TASK_LIMIT_BELOW_THRESHOLD = 2;

interface WeightedField {
  weight: number;
  filled: (u: Partial<User>) => boolean;
}

// Each field contributes a weight toward 100%. Adjust freely as the
// real profile form grows — weights just need to sum to 100.
const FIELDS: WeightedField[] = [
  { weight: 15, filled: (u) => !!u.firstName },
  { weight: 15, filled: (u) => !!u.lastName },
  { weight: 15, filled: (u) => !!u.phone },
  { weight: 15, filled: (u) => !!u.country },
  { weight: 15, filled: (u) => !!u.bio && u.bio.trim().length >= 20 },
  { weight: 10, filled: (u) => !!u.skills && u.skills.length > 0 },
  { weight: 15, filled: (u) => !!u.payoutMethodAdded },
];

export function getProfileCompletion(user: Partial<User> | null | undefined): number {
  if (!user) return 0;
  const total = FIELDS.reduce((sum, f) => sum + (f.filled(user) ? f.weight : 0), 0);
  return Math.min(100, total);
}

export function isTaskLimited(user: Partial<User> | null | undefined): boolean {
  return getProfileCompletion(user) < PROFILE_TASK_LIMIT_THRESHOLD;
}
