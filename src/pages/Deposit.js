import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { FaPaypal } from 'react-icons/fa6';
import { ChevronDown, CreditCard, ShieldCheck, Smartphone } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { createPackagePayment, createVerificationPayment, startPackagePayment } from '../lib/paymentsApi';
import { createPackageIdempotencyKey } from '../lib/packageCheckout';
import { VERIFICATION_KES, VERIFICATION_USD } from '../lib/paymentConstants';
const TIERS = [
    {
        name: 'Free',
        tier: 'free',
        price: 0,
        benefits: ['Basic tasks', '5 tasks/month', 'Mobile only'],
        color: 'border-stone-300',
    },
    {
        name: 'Pro',
        tier: 'pro',
        price: 45,
        benefits: ['Academic tasks', '50 tasks per period', 'Desktop + Mobile', 'Priority support', '3-month access'],
        color: 'border-navy-300',
        recommended: true,
    },
    {
        name: 'Elite',
        tier: 'elite',
        price: 120,
        benefits: ['All tasks', 'Unlimited tasks', 'High-priority access', '24/7 support', '3-month access'],
        color: 'border-[#F5A623]',
    },
];
const PAYMENT_BRANDS = {
    paystack: { label: 'Paystack', Icon: CreditCard, className: 'text-brand-600 dark:text-brand-300' },
    paypal: { label: 'PayPal', Icon: FaPaypal, className: 'text-blue-600' },
    palpluss: { label: 'PalPluss', Icon: Smartphone, className: 'text-brand-600 dark:text-brand-300' },
};
export default function DepositPage() {
    const { theme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const [paymentMethod, setPaymentMethod] = useState('paystack');
    const [accountValue, setAccountValue] = useState('');
    const [accountLabel, setAccountLabel] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [selectedTier, setSelectedTier] = useState('Free');
    const [packageMessage, setPackageMessage] = useState('');
    const [packageProvider, setPackageProvider] = useState('paystack');
    const [packagePhone, setPackagePhone] = useState('');
    const [packageSubmitting, setPackageSubmitting] = useState(false);
    const [packageError, setPackageError] = useState('');
    const [packageCheckoutUrl, setPackageCheckoutUrl] = useState('');
    const [packageOpen, setPackageOpen] = useState(true);
    const [verificationOpen, setVerificationOpen] = useState(false);
    useEffect(() => {
        const refreshTimer = window.setTimeout(() => {
            AOS.refreshHard();
            window.requestAnimationFrame(() => AOS.refresh());
        }, 80);
        return () => window.clearTimeout(refreshTimer);
    }, [packageOpen, verificationOpen]);
    const accountPlaceholder = paymentMethod === 'palpluss'
        ? '+254 7XX XXX XXX'
        : paymentMethod === 'paypal'
            ? 'PayPal email address'
            : 'Paystack email address';
    function handleTierSelect(tierName, price) {
        setSelectedTier(tierName);
        setPackageOpen(true);
        if (price === 0) {
            setPackageMessage('You are already on the Free plan. Choose a paid tier to begin an upgrade flow.');
            return;
        }
        setPackageMessage(`${tierName} selected at $${price} for 3 months. Choose a provider below to continue.`);
        window.setTimeout(() => document.getElementById('package-payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
    async function handlePackagePayment(e) {
        e.preventDefault();
        setPackageError('');
        setPackageCheckoutUrl('');
        setPackageMessage('');
        if (!user) {
            setPackageError('Sign in before starting a package payment.');
            return;
        }
        const tier = TIERS.find((item) => item.name === selectedTier)?.tier;
        if (!tier) {
            setPackageError('Choose Pro or Elite before starting a package payment.');
            return;
        }
        if (packageProvider === 'palpluss' && !packagePhone.trim()) {
            setPackageError('Enter the phone number that should receive the PalPluss STK prompt.');
            return;
        }
        setPackageSubmitting(true);
        try {
            const created = await createPackagePayment({
                tier: tier,
                provider: packageProvider,
                idempotencyKey: createPackageIdempotencyKey(tier),
            });
            const started = await startPackagePayment({ transactionId: created.transactionId, phone: packagePhone.trim() || undefined });
            setPackageCheckoutUrl(started.checkoutUrl || '');
            setPackageMessage(packageProvider === 'palpluss'
                ? 'STK prompt started. Complete it on your phone; your package activates after verified provider confirmation.'
                : 'Payment started. Complete checkout; your package activates after verified provider confirmation.');
        }
        catch (err) {
            setPackageError(err instanceof Error ? err.message : 'Unable to start package payment.');
        }
        finally {
            setPackageSubmitting(false);
        }
    }
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
        if (paymentMethod === 'palpluss' && !/^\+?[0-9 ()-]{8,24}$/.test(accountValue.trim())) {
            setError('Enter a valid phone number for PalPluss.');
            return;
        }
        setSubmitting(true);
        try {
            const result = await createVerificationPayment({ method: paymentMethod, accountLabel: accountLabel.trim(), accountValue: accountValue.trim(), phone: paymentMethod === 'palpluss' ? accountValue.trim() : undefined });
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
    return (_jsxs("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("div", { className: "container pt-8", children: _jsx("h1", { className: "font-display text-2xl font-bold", "data-aos": "fade-down", children: "Subscription & Deposits" }) }), _jsxs("main", { className: "container py-8", children: [_jsxs("div", { id: "packages", className: "mb-12 scroll-mt-6", "data-aos": "fade-up", children: [_jsx("h2", { className: "font-display text-2xl mb-6", "data-aos": "fade-down", children: "Choose Your Tier" }), _jsx("div", { className: "grid md:grid-cols-3 gap-6", children: TIERS.map((tier, index) => (_jsxs("div", { "data-aos": "fade-up", "data-aos-delay": index * 90, className: `card relative animate-in border-2 ${tier.color} ${theme === 'dark' ? 'bg-stone-800 border-opacity-50' : ''} ${tier.recommended ? 'md:scale-105 shadow-lg' : ''} ${selectedTier === tier.name ? 'ring-2 ring-brand-500' : ''}`, children: [tier.recommended && (_jsx("div", { className: "absolute -top-3 left-4 bg-navy-700 text-white px-3 py-1 rounded-full text-xs font-semibold", children: "Recommended" })), _jsx("h3", { className: "font-display text-xl mb-2", children: tier.name }), _jsxs("p", { className: "font-display text-3xl font-bold mb-1", children: ["$", tier.price] }), tier.price > 0 && _jsx("p", { className: "text-sm mb-4", style: { color: 'var(--text-muted)' }, children: "for 3 months" }), tier.price === 0 && _jsx("div", { className: "mb-4" }), _jsx("ul", { className: "space-y-2 mb-6", children: tier.benefits.map((benefit) => (_jsxs("li", { className: `text-sm ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: ["\u2713 ", benefit] }, benefit))) }), _jsx("button", { onClick: () => handleTierSelect(tier.name, tier.price), className: `w-full btn-primary py-2 rounded-lg font-semibold transition-all ${tier.recommended ? 'bg-navy-700 text-white hover:bg-navy-800' : ''}`, children: tier.price === 0 ? 'Current Plan' : selectedTier === tier.name ? 'Selected' : 'Upgrade' })] }, tier.name))) }), packageMessage && _jsx("div", { className: "alert alert-info mt-6", "data-aos": "fade-in", children: packageMessage })] }), _jsxs("section", { className: `card max-w-2xl mx-auto mb-10 scroll-mt-6 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, "data-aos": "fade-up", children: [_jsxs("button", { id: "package-payment-toggle", type: "button", "aria-expanded": packageOpen, "aria-controls": "package-payment-form", onClick: () => setPackageOpen((open) => !open), className: "w-full flex items-center justify-between gap-4 text-left", children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(CreditCard, { size: 20, "aria-hidden": "true" }) }), _jsxs("span", { children: [_jsx("span", { className: "block font-display text-2xl", children: "Pay for your package" }), _jsx("span", { className: "block text-sm mt-1", style: { color: 'var(--text-muted)' }, children: "Upgrade from Free to Pro or Elite" })] })] }), _jsxs("span", { className: "flex items-center gap-2 shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300", children: [_jsx("span", { className: "hidden sm:inline", children: packageOpen ? 'Hide' : 'Show' }), _jsx(ChevronDown, { size: 20, "aria-hidden": "true", className: `transition-transform duration-300 ${packageOpen ? 'rotate-180' : ''}` })] })] }), _jsxs("form", { id: "package-payment-form", "aria-hidden": !packageOpen, onSubmit: handlePackagePayment, className: `mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${packageOpen ? 'max-h-[1200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`, children: [_jsx("p", { className: "text-sm mb-6", style: { color: 'var(--text-muted)' }, children: "Package changes are available from Free tier only. Payment remains pending until the provider callback is verified." }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-3", children: "Payment provider" }), _jsx("div", { className: "grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] p-1", role: "tablist", "aria-label": "Package payment provider", children: [
                                                            ['paystack', 'Paystack'],
                                                            ['paypal', 'PayPal'],
                                                            ['palpluss', 'PalPluss'],
                                                        ].map(([provider, label]) => (_jsx("button", { type: "button", role: "tab", "aria-selected": packageProvider === provider, onClick: () => setPackageProvider(provider), className: `rounded-lg px-2 py-3 text-sm font-semibold transition-colors ${packageProvider === provider ? 'bg-brand-600 text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-brand-50 dark:hover:bg-brand-900/20'}`, children: label }, provider))) })] }), packageProvider === 'palpluss' && (_jsxs("label", { className: "block text-sm font-semibold", children: ["M-Pesa phone number", _jsx("input", { className: "input-field w-full mt-2", value: packagePhone, onChange: (e) => setPackagePhone(e.target.value), placeholder: "+254 7XX XXX XXX", autoComplete: "tel" })] })), packageCheckoutUrl && (_jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: packageCheckoutUrl, target: "_blank", rel: "noreferrer", children: "Continue to checkout" })), packageError && _jsx("div", { className: "alert alert-error", children: packageError }), _jsx("button", { disabled: packageSubmitting || selectedTier === 'Free', className: "w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-60", children: packageSubmitting ? 'Starting package payment...' : selectedTier === 'Free' ? 'Choose a paid tier first' : `Pay $${TIERS.find((tier) => tier.name === selectedTier)?.price}` })] })] })] }), _jsxs("section", { className: `card max-w-2xl mx-auto animate-in scroll-mt-6 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, "data-aos": "fade-up", children: [_jsxs("button", { id: "verification-payment-toggle", type: "button", "aria-expanded": verificationOpen, "aria-controls": "payment-form", onClick: () => setVerificationOpen((open) => !open), className: "w-full flex items-center justify-between gap-4 text-left", children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(ShieldCheck, { size: 20, "aria-hidden": "true" }) }), _jsxs("span", { children: [_jsx("span", { className: "block font-display text-2xl", children: "Verify payout account" }), _jsx("span", { className: "block text-sm mt-1", style: { color: 'var(--text-muted)' }, children: "Required before requesting withdrawals" })] })] }), _jsxs("span", { className: "flex items-center gap-2 shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300", children: [_jsx("span", { className: "hidden sm:inline", children: verificationOpen ? 'Hide' : 'Show' }), _jsx(ChevronDown, { size: 20, "aria-hidden": "true", className: `transition-transform duration-300 ${verificationOpen ? 'rotate-180' : ''}` })] })] }), _jsxs("form", { id: "payment-form", "aria-hidden": !verificationOpen, onSubmit: handleVerification, className: `mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${verificationOpen ? 'max-h-[1600px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`, children: [_jsx("h2", { className: "sr-only", children: "Verify Your Payout Account" }), _jsxs("p", { className: `text-sm mb-6 ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`, children: ["Pay exactly ", formatCurrency(VERIFICATION_USD, 'USD'), " (", formatCurrency(VERIFICATION_KES, 'KES'), ") to verify ownership. The payment is held for admin review."] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: `block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-stone-300' : ''}`, children: "Payment Method" }), _jsx("div", { className: "grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] p-1", role: "tablist", "aria-label": "Verification payment provider", children: ['paystack', 'paypal', 'palpluss'].map((method) => {
                                                            const brand = PAYMENT_BRANDS[method];
                                                            return _jsxs("button", { type: "button", role: "tab", "aria-selected": paymentMethod === method, onClick: () => setPaymentMethod(method), className: `flex items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold transition-colors ${paymentMethod === method ? 'bg-brand-600 text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-brand-50 dark:hover:bg-brand-900/20'}`, children: [_jsx(brand.Icon, { "aria-hidden": "true", size: 18, className: paymentMethod === method ? 'text-white' : brand.className }), _jsx("span", { children: brand.label })] }, method);
                                                        }) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("label", { className: "text-sm font-semibold", children: ["Account label", _jsx("input", { className: "input-field w-full mt-2", value: accountLabel, onChange: (e) => setAccountLabel(e.target.value), placeholder: "My primary account" })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Account or phone", _jsx("input", { className: "input-field w-full mt-2", value: accountValue, onChange: (e) => setAccountValue(e.target.value), placeholder: accountPlaceholder, autoComplete: "off" })] })] }), message && _jsx("div", { className: "alert alert-success", children: message }), checkoutUrl && (_jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: checkoutUrl, target: "_blank", rel: "noreferrer", children: "Continue to PayPal" })), error && _jsx("div", { className: "alert alert-error", children: error }), _jsx("button", { disabled: submitting, className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg text-lg disabled:opacity-60", children: submitting ? 'Starting verification...' : `Start verification for ${formatCurrency(VERIFICATION_USD, 'USD')}` }), _jsx("p", { className: `text-xs text-center ${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'}`, children: "Your payment is secured and encrypted. No additional fees." })] })] })] })] })] }));
}
//# sourceMappingURL=Deposit.js.map