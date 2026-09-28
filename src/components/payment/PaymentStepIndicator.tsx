import { Check } from 'lucide-react';
import { getPaymentProgressPercent, PAYMENT_WIZARD_STEPS, type PaymentWizardStep } from '../../lib/paymentWizard';

const LABELS: Record<PaymentWizardStep, string> = {
  details: 'Details',
  provider: 'Method',
  payment: 'Review & pay',
  result: 'Status',
};

type PaymentStepIndicatorProps = {
  currentStep: PaymentWizardStep;
};

export default function PaymentStepIndicator({ currentStep }: PaymentStepIndicatorProps) {
  const currentIndex = PAYMENT_WIZARD_STEPS.indexOf(currentStep);
  const progressPercent = getPaymentProgressPercent(currentStep);
  return <ol className="relative grid grid-cols-4 gap-2" aria-label="Payment steps">
    <li className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-4 z-0 h-0.5 -translate-y-1/2 rounded-full bg-[var(--border)]" aria-hidden="true">
      <span className="block h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${progressPercent}%` }} />
    </li>
    {PAYMENT_WIZARD_STEPS.map((step, index) => {
      const complete = index < currentIndex;
      return <li key={step} aria-current={index === currentIndex ? 'step' : undefined} className={`relative text-center text-xs ${index <= currentIndex ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-[var(--text-muted)]'}`}>
        <span className={`relative z-10 mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${complete ? 'border-brand-600 bg-brand-600 text-white' : index === currentIndex ? 'border-brand-600 bg-[var(--bg)] ring-4 ring-brand-600/10' : 'border-[var(--border)] bg-[var(--bg)]'}`}>
          {complete ? <Check size={14} aria-hidden="true" /> : index + 1}
        </span>
        {LABELS[step]}
      </li>;
    })}
  </ol>;
}
