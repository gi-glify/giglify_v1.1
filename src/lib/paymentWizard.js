export const PAYMENT_WIZARD_STEPS = ['details', 'provider', 'payment', 'result'];
export function getNextPaymentStep(step, valid) {
    if (!valid)
        return step;
    const index = PAYMENT_WIZARD_STEPS.indexOf(step);
    return PAYMENT_WIZARD_STEPS[Math.min(index + 1, PAYMENT_WIZARD_STEPS.length - 1)];
}
export function getPreviousPaymentStep(step) {
    const index = PAYMENT_WIZARD_STEPS.indexOf(step);
    return PAYMENT_WIZARD_STEPS[Math.max(index - 1, 0)];
}
//# sourceMappingURL=paymentWizard.js.map