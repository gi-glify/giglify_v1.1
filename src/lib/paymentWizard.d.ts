export declare const PAYMENT_WIZARD_STEPS: readonly ["details", "provider", "payment", "result"];
export type PaymentWizardStep = typeof PAYMENT_WIZARD_STEPS[number];
export declare function getNextPaymentStep(step: PaymentWizardStep, valid: boolean): PaymentWizardStep;
export declare function getPreviousPaymentStep(step: PaymentWizardStep): PaymentWizardStep;
//# sourceMappingURL=paymentWizard.d.ts.map