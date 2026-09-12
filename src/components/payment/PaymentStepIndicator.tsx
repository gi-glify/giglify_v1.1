import { Check } from 'lucide-react';
import { PAYMENT_WIZARD_STEPS, type PaymentWizardStep } from '../../lib/paymentWizard';

const LABELS: Record<PaymentWizardStep, string> = {
  details: 'Details',
  provider: 'Provider',
  payment: 'Payment',
  result: 'Result',
};

type PaymentStepIndicatorProps = {
  currentStep: PaymentWizardStep;
};

export default function PaymentStepIndicator({ currentStep }: PaymentStepIndicatorProps) {
  const currentIndex = PAYMENT_WIZARD_STEPS.indexOf(currentStep);
  return <ol className="grid grid-cols-4 gap-2" aria-label="Payment steps">
    {PAYMENT_WIZARD_STEPS.map((step, index) => {
      const complete = index < currentIndex;
      return <li key={step} className={`relative text-center text-xs ${index <= currentIndex ? 'font-semibold text-brand-700 dark:text-brand-300' : 'opacity-55'}`}>
        {index < PAYMENT_WIZARD_STEPS.length - 1 && <span className={`absolute left-1/2 right-[-50%] top-3 -z-0 h-px ${complete ? 'bg-brand-600' : 'bg-current opacity-30'}`} aria-hidden="true" />}
        <span className={`relative z-10 mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border bg-[var(--bg)] ${complete || index === currentIndex ? 'border-brand-600' : 'border-current'}`}>
          {complete ? <Check size={14} aria-hidden="true" /> : index + 1}
        </span>
        {LABELS[step]}
      </li>;
    })}
  </ol>;
}
