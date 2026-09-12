export const PAYMENT_WIZARD_STEPS = ['details', 'provider', 'payment', 'result'] as const;
export type PaymentWizardStep = typeof PAYMENT_WIZARD_STEPS[number];

export function getPaymentProgressPercent(step: PaymentWizardStep): number {
  const index = PAYMENT_WIZARD_STEPS.indexOf(step);
  return (index / (PAYMENT_WIZARD_STEPS.length - 1)) * 100;
}

export function getNextPaymentStep(step: PaymentWizardStep, valid: boolean): PaymentWizardStep {
  if (!valid) return step;
  const index = PAYMENT_WIZARD_STEPS.indexOf(step);
  return PAYMENT_WIZARD_STEPS[Math.min(index + 1, PAYMENT_WIZARD_STEPS.length - 1)];
}

export function getPreviousPaymentStep(step: PaymentWizardStep): PaymentWizardStep {
  const index = PAYMENT_WIZARD_STEPS.indexOf(step);
  return PAYMENT_WIZARD_STEPS[Math.max(index - 1, 0)];
}
