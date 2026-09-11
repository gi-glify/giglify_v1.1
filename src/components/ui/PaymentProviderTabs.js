import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FaPaypal } from 'react-icons/fa6';
import { CreditCard, Smartphone } from 'lucide-react';
import { PAYMENT_PROVIDERS } from '../../lib/paymentProviders';
const PAYMENT_BRANDS = {
    paystack: { Icon: CreditCard, className: 'text-brand-600 dark:text-brand-300' },
    paypal: { Icon: FaPaypal, className: 'text-blue-600' },
    palpluss: { Icon: Smartphone, className: 'text-brand-600 dark:text-brand-300' },
};
export default function PaymentProviderTabs({ selectedValue, onChange, idPrefix = 'payment-provider' }) {
    function handleKeyDown(event, index) {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End')
            return;
        event.preventDefault();
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? PAYMENT_PROVIDERS.length - 1
                : (index + (event.key === 'ArrowRight' ? 1 : -1) + PAYMENT_PROVIDERS.length) % PAYMENT_PROVIDERS.length;
        onChange(PAYMENT_PROVIDERS[nextIndex].id);
        document.getElementById(`${idPrefix}-tab-${PAYMENT_PROVIDERS[nextIndex].id}`)?.focus();
    }
    return (_jsx("div", { className: "grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] p-1 bg-black/[.02] dark:bg-white/[.03]", role: "tablist", "aria-label": "Payment provider", children: PAYMENT_PROVIDERS.map((provider, index) => (_jsxs("button", { id: `${idPrefix}-tab-${provider.id}`, type: "button", role: "tab", "aria-selected": selectedValue === provider.id, "aria-controls": `${idPrefix}-panel-${provider.id}`, tabIndex: selectedValue === provider.id ? 0 : -1, onClick: () => onChange(provider.id), onKeyDown: (event) => handleKeyDown(event, index), className: `
            flex items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold transition-colors
            ${selectedValue === provider.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-text dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'}
          `, children: [(() => {
                    const brand = PAYMENT_BRANDS[provider.id];
                    const Icon = brand.Icon;
                    return _jsx(Icon, { "aria-hidden": "true", size: 18, className: selectedValue === provider.id ? 'text-white' : brand.className });
                })(), _jsx("span", { children: provider.label })] }, provider.id))) }));
}
//# sourceMappingURL=PaymentProviderTabs.js.map