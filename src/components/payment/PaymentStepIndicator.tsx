import { Check } from 'lucide-react';
import { getPaymentProgressPercent, PAYMENT_WIZARD_STEPS, type PaymentWizardStep } from '../../lib/paymentWizard';

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
  const progressPercent = getPaymentProgressPercent(currentStep);
  return <ol className="relative grid grid-cols-4 gap-2" aria-label="Payment steps">
    <li className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-3 z-0 h-0.5 -translate-y-1/2 rounded-full bg-current opacity-20" aria-hidden="true">
      <span className="block h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${progressPercent}%` }} />
    </li>
    {PAYMENT_WIZARD_STEPS.map((step, index) => {
      const complete = index < currentIndex;
      return <li key={step} className={`relative text-center text-xs ${index <= currentIndex ? 'font-semibold text-brand-700 dark:text-brand-300' : 'opacity-55'}`}>
        <span className={`relative z-10 mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border bg-[var(--bg)] transition-[background-color,border-color,color,transform] duration-300 ${complete || index === currentIndex ? 'border-brand-600' : 'border-current'}`}>
          {complete ? <Check size={14} aria-hidden="true" /> : index + 1}
        </span>
        {LABELS[step]}
      </li>;
    })}
  </ol>;
}
