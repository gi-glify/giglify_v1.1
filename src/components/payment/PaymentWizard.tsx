import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import PaymentStepIndicator from './PaymentStepIndicator';
import { getNextPaymentStep, getPreviousPaymentStep, type PaymentWizardStep } from '../../lib/paymentWizard';

type PaymentWizardProps = {
  currentStep: PaymentWizardStep;
  canContinue: boolean;
  children: ReactNode;
  onStepChange: (step: PaymentWizardStep) => void;
  onDiscard?: () => void;
  nextLabel?: string;
};

export default function PaymentWizard({ currentStep, canContinue, children, onStepChange, onDiscard, nextLabel = 'Continue' }: PaymentWizardProps) {
  const isFirst = currentStep === 'details';
  const isLast = currentStep === 'result';
  return <section aria-label="Payment progress form" data-payment-wizard={currentStep}>
    <div className="mb-6 flex items-center justify-between gap-3">
      <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline disabled:invisible dark:text-brand-300" onClick={() => onStepChange(getPreviousPaymentStep(currentStep))} disabled={isFirst}>
        <ArrowLeft size={16} aria-hidden="true" /> Back
      </button>
      {onDiscard && <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold opacity-75 hover:opacity-100" onClick={onDiscard}><X size={16} aria-hidden="true" /> Cancel</button>}
    </div>
    <PaymentStepIndicator currentStep={currentStep} />
    <div className="mt-6">{children}</div>
    {!isLast && <div className="mt-6 flex justify-end">
      <button type="button" className="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold disabled:opacity-50" disabled={!canContinue} onClick={() => onStepChange(getNextPaymentStep(currentStep, canContinue))}>
        {nextLabel} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>}
  </section>;
}
