import { AlertCircle, Check, Loader2 } from 'lucide-react';
import type { PaymentMethod } from '../../lib/paymentTypes';
import { getPaymentProgress, type PaymentProgressKind } from '../../lib/paymentProgress';

type PaymentProgressProps = {
  kind: PaymentProgressKind;
  provider: PaymentMethod;
  status: string;
};

const STEPS = [
  { phase: 'starting', label: 'Payment created' },
  { phase: 'awaiting_confirmation', label: 'Provider confirmation' },
  { phase: 'review', label: 'Review or activation' },
];

export default function PaymentProgress({ kind, provider, status }: PaymentProgressProps) {
  const progress = getPaymentProgress(status, kind, provider);
  const failed = progress.phase === 'failed' || progress.phase === 'cancelled';
  const currentIndex = progress.phase === 'complete' || progress.phase === 'review'
    ? STEPS.length - 1
    : progress.phase === 'awaiting_confirmation'
      ? 1
      : 0;

  return (
    <section className={`rounded-xl border p-4 ${failed ? 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20' : 'border-brand-200 bg-brand-50/60 dark:border-brand-900/60 dark:bg-brand-950/20'}`} aria-live="polite" data-payment-progress={kind}>
      <div className="flex items-start gap-3">
        {failed ? <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={20} aria-hidden="true" /> : progress.terminal ? <Check className="mt-0.5 shrink-0 text-emerald-600" size={20} aria-hidden="true" /> : <Loader2 className="mt-0.5 shrink-0 animate-spin text-brand-600" size={20} aria-hidden="true" />}
        <div>
          <p className="font-semibold">{progress.label}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{progress.description}</p>
        </div>
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Payment progress">
        {STEPS.map((step, index) => {
          const complete = index < currentIndex || (index === currentIndex && (progress.phase === 'review' || progress.phase === 'complete'));
          return <li key={step.phase} className={`text-center text-xs ${complete ? 'font-semibold text-brand-700 dark:text-brand-300' : index === currentIndex && !failed ? 'font-semibold' : 'opacity-55'}`}>
            <span className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border ${complete ? 'border-brand-600 bg-brand-600 text-white' : 'border-current'}`}>{complete ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
            {step.label}
          </li>;
        })}
      </ol>
    </section>
  );
}
