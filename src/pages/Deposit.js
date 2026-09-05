import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { CreditCard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { createVerificationPayment } from '../lib/paymentsApi';
import { VERIFICATION_KES, VERIFICATION_USD } from '../lib/paymentConstants';
const TIERS = [
    {
        name: 'Free',
        price: 0,
        benefits: ['Basic tasks', '5 tasks/month', 'Mobile only'],
        color: 'border-stone-300',
    },
    {
        name: 'Pro',
        price: 29,
        benefits: ['Academic tasks', '50 tasks/month', 'Desktop + Mobile', 'Priority support'],
        color: 'border-navy-300',
        recommended: true,
    },
    {
        name: 'Elite',
        price: 99,
        benefits: ['All tasks', 'Unlimited tasks', 'High-priority access', '24/7 support', 'Custom datasets'],
        color: 'border-[#F5A623]',
    },
];
export default function DepositPage() {
    const { theme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const [paymentMethod, setPaymentMethod] = useState('stripe');
    const [accountValue, setAccountValue] = useState('');
    const [accountLabel, setAccountLabel] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const accountPlaceholder = paymentMethod === 'mpesa'
        ? '+254 7XX XXX XXX'
        : paymentMethod === 'paypal'
            ? 'PayPal email address'
            : 'Stripe customer email';
    async function handleVerification(e) {
        e.preventDefault();
        setError('');
        setMessage('');
        setCheckoutUrl('');
        if (!user) {
            setError('Sign in before starting payment verification.');
            return;
        }
        if (!accountValue.trim() || !accountLabel.trim()) {
            setError('Add a label and the account or phone number used for payout.');
            return;
        }
        setSubmitting(true);
        try {
            const result = await createVerificationPayment({ method: paymentMethod, accountLabel: accountLabel.trim(), accountValue: accountValue.trim() });
            setMessage('Verification payment created. Complete the provider payment, then wait for admin approval.');
            setCheckoutUrl(result.checkoutUrl || '');
            setAccountValue('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to start verification payment.');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("div", { className: "container pt-8", children: _jsx("h1", { className: "font-display text-2xl font-bold", "data-aos": "fade-down", children: "Subscription & Deposits" }) }), _jsxs("main", { className: "container py-8", children: [_jsxs("div", { id: "packages", className: "mb-12 scroll-mt-6", children: [_jsx("h2", { className: "font-display text-2xl mb-6", children: "Choose Your Tier" }), _jsx("div", { className: "grid md:grid-cols-3 gap-6", children: TIERS.map((tier) => (_jsxs("div", { className: `card relative animate-in border-2 ${tier.color} ${theme === 'dark' ? 'bg-stone-800 border-opacity-50' : ''} ${tier.recommended ? 'md:scale-105 shadow-lg' : ''}`, children: [tier.recommended && (_jsx("div", { className: "absolute -top-3 left-4 bg-navy-700 text-white px-3 py-1 rounded-full text-xs font-semibold", children: "Recommended" })), _jsx("h3", { className: "font-display text-xl mb-2", children: tier.name }), _jsxs("p", { className: "font-display text-3xl font-bold mb-4", children: ["$", tier.price] }), _jsx("ul", { className: "space-y-2 mb-6", children: tier.benefits.map((benefit) => (_jsxs("li", { className: `text-sm ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: ["\u2713 ", benefit] }, benefit))) }), _jsx("button", { className: `w-full btn-primary py-2 rounded-lg font-semibold transition-all ${tier.recommended ? 'bg-navy-700 text-white hover:bg-navy-800' : ''}`, children: tier.price === 0 ? 'Current Plan' : 'Upgrade' })] }, tier.name))) })] }), _jsxs("form", { onSubmit: handleVerification, className: `card max-w-2xl mx-auto animate-in ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, children: [_jsx("h2", { className: "font-display text-2xl mb-2", children: "Verify Your Payout Account" }), _jsxs("p", { className: `text-sm mb-6 ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`, children: ["Pay exactly ", formatCurrency(VERIFICATION_USD, 'USD'), " (", formatCurrency(VERIFICATION_KES, 'KES'), ") to verify ownership. The payment is held for admin review."] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: `block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-stone-300' : ''}`, children: "Payment Method" }), _jsx("div", { className: "space-y-2", children: ['stripe', 'paypal', 'mpesa'].map((method) => (_jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "radio", name: "payment", value: method, checked: paymentMethod === method, onChange: () => setPaymentMethod(method), className: "w-4 h-4" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CreditCard, { size: 16 }), _jsx("span", { className: "text-sm font-semibold capitalize", children: method })] })] }, method))) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("label", { className: "text-sm font-semibold", children: ["Account label", _jsx("input", { className: "input-field w-full mt-2", value: accountLabel, onChange: (e) => setAccountLabel(e.target.value), placeholder: "My primary account" })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Account or phone", _jsx("input", { className: "input-field w-full mt-2", value: accountValue, onChange: (e) => setAccountValue(e.target.value), placeholder: accountPlaceholder, autoComplete: "off" })] })] }), message && _jsx("div", { className: "alert alert-success", children: message }), checkoutUrl && (_jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: checkoutUrl, target: "_blank", rel: "noreferrer", children: "Continue to PayPal" })), error && _jsx("div", { className: "alert alert-error", children: error }), _jsx("button", { disabled: submitting, className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg text-lg disabled:opacity-60", children: submitting ? 'Starting verification...' : `Start verification for ${formatCurrency(VERIFICATION_USD, 'USD')}` }), _jsx("p", { className: `text-xs text-center ${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'}`, children: "Your payment is secured and encrypted. No additional fees." })] })] })] })] }));
}
//# sourceMappingURL=Deposit.js.map