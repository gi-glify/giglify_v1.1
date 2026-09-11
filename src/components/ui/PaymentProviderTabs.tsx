import React from 'react';

export type PaymentProviderId = 'paystack' | 'paypal' | 'palpluss';

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  { id: 'paystack', label: 'Paystack' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'palpluss', label: 'PalPluss' },
];

interface PaymentProviderTabsProps {
  selectedValue: PaymentProviderId | string;
  onChange: (value: PaymentProviderId) => void;
}

export default function PaymentProviderTabs({ selectedValue, onChange }: PaymentProviderTabsProps) {
  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] p-1 bg-black/[.02] dark:bg-white/[.03]"
      role="tablist"
    >
      {PAYMENT_PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          role="tab"
          aria-selected={selectedValue === provider.id}
          onClick={() => onChange(provider.id as PaymentProviderId)}
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
