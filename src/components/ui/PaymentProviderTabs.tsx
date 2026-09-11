import React from 'react';
import { PAYMENT_PROVIDERS, type PaymentProviderId } from '../../lib/paymentProviders';

export type { PaymentProviderId } from '../../lib/paymentProviders';

interface PaymentProviderTabsProps {
  selectedValue: PaymentProviderId | string;
  onChange: (value: PaymentProviderId) => void;
}

export default function PaymentProviderTabs({ selectedValue, onChange }: PaymentProviderTabsProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? PAYMENT_PROVIDERS.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + PAYMENT_PROVIDERS.length) % PAYMENT_PROVIDERS.length;
    onChange(PAYMENT_PROVIDERS[nextIndex].id);
    document.getElementById(`payment-provider-tab-${PAYMENT_PROVIDERS[nextIndex].id}`)?.focus();
  }

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] p-1 bg-black/[.02] dark:bg-white/[.03]"
      role="tablist"
      aria-label="Payment provider"
    >
      {PAYMENT_PROVIDERS.map((provider, index) => (
        <button
          key={provider.id}
          id={`payment-provider-tab-${provider.id}`}
          type="button"
          role="tab"
          aria-selected={selectedValue === provider.id}
          aria-controls={`payment-provider-panel-${provider.id}`}
          tabIndex={selectedValue === provider.id ? 0 : -1}
          onClick={() => onChange(provider.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={`
            py-2 text-sm font-semibold rounded-lg transition-all
            ${selectedValue === provider.id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-text dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
            }
          `}
        >
          {provider.label}
        </button>
      ))}
    </div>
  );
}
