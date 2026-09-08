export declare const sendVerificationEmail: (email: string, verificationLink: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
}>;
export declare const sendPasswordResetEmail: (email: string, resetLink: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
}>;
export declare const sendDepositConfirmation: (email: string, amount: number, currency: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
}>;
export declare const sendWithdrawalNotification: (email: string, amount: number, bankInfo: string) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
}>;
export declare const sendTaskCompletionEmail: (email: string, taskTitle: string, reward: number) => Promise<{
    success: boolean;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
}>;
//# sourceMappingURL=emailService.d.ts.map