import { User } from '../types';
/** Below this completion %, task access is limited (see requirement #6). */
export declare const PROFILE_TASK_LIMIT_THRESHOLD = 70;
export declare const DAILY_TASK_LIMIT_BELOW_THRESHOLD = 2;
export declare function getProfileCompletion(user: Partial<User> | null | undefined): number;
export declare function isTaskLimited(user: Partial<User> | null | undefined): boolean;
//# sourceMappingURL=profileCompletion.d.ts.map