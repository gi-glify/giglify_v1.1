import type { ReactNode } from 'react';
import { type PaymentWizardStep } from '../../lib/paymentWizard';
type PaymentWizardProps = {
    currentStep: PaymentWizardStep;
    canContinue: boolean;
    children: ReactNode;
    onStepChange: (step: PaymentWizardStep) => void;
    onDiscard?: () => void;
    nextLabel?: string;
};
export default function PaymentWizard({ currentStep, canContinue, children, onStepChange, onDiscard, nextLabel }: PaymentWizardProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=PaymentWizard.d.ts.map