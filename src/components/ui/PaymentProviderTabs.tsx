import React from 'react';
import { FaPaypal } from 'react-icons/fa6';
import { CreditCard, Smartphone } from 'lucide-react';
import { PAYMENT_PROVIDERS, type PaymentProviderId } from '../../lib/paymentProviders';

export type { PaymentProviderId } from '../../lib/paymentProviders';

interface PaymentProviderTabsProps {
  selectedValue: PaymentProviderId | string;
  onChange: (value: PaymentProviderId) => void;
  idPrefix?: string;
}

const PAYMENT_BRANDS = {
  paystack: { Icon: CreditCard, className: 'text-brand-600 dark:text-brand-300' },
  paypal: { Icon: FaPaypal, className: 'text-blue-600' },
  mpesa: { Icon: Smartphone, className: 'text-brand-600 dark:text-brand-300' },
} as const;

export default function PaymentProviderTabs({ selectedValue, onChange, idPrefix = 'payment-provider' }: PaymentProviderTabsProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? PAYMENT_PROVIDERS.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + PAYMENT_PROVIDERS.length) % PAYMENT_PROVIDERS.length;
    onChange(PAYMENT_PROVIDERS[nextIndex].id);
    document.getElementById(`${idPrefix}-tab-${PAYMENT_PROVIDERS[nextIndex].id}`)?.focus();
  }

  return (
    <div
      className="grid grid-cols-3 gap-2 sm:gap-3"
      role="tablist"
      aria-label="Payment provider"
    >
      {PAYMENT_PROVIDERS.map((provider, index) => (
        <button
          key={provider.id}
          id={`${idPrefix}-tab-${provider.id}`}
          type="button"
          role="tab"
          aria-selected={selectedValue === provider.id}
          aria-controls={`${idPrefix}-panel-${provider.id}`}
          tabIndex={selectedValue === provider.id ? 0 : -1}
          onClick={() => onChange(provider.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`
            flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border px-2 py-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2
            ${selectedValue === provider.id
              ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
              : 'border-[var(--border)] text-slate-text dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
            }
          `}
        >
          {(() => {
            const brand = PAYMENT_BRANDS[provider.id];
            const Icon = brand.Icon;
            return <Icon aria-hidden="true" size={24} className={brand.className} />;
          })()}
          <span>{provider.label}</span>
        </button>
      ))}
    </div>
  );
}
