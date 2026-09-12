import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import { ChevronDown, CreditCard, ShieldCheck } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { createPackagePayment, createVerificationPayment, fetchPackagePaymentStatus, fetchVerificationPaymentStatus, startPackagePayment } from '../lib/paymentsApi';
import { createPackageIdempotencyKey } from '../lib/packageCheckout';
import { VERIFICATION_KES, VERIFICATION_USD } from '../lib/paymentConstants';
import PaymentProviderTabs from '../components/ui/PaymentProviderTabs';
import PaymentProgress from '../components/ui/PaymentProgress';
import { getCheckoutLabel, getProviderField, validateProviderInput } from '../lib/paymentProviders';
import { isPaymentProgressTerminal } from '../lib/paymentProgress';
import { clearPaymentDraft, parsePaymentIntent, readPaymentDraft, readPaymentViewPreference, writePaymentDraft, writePaymentViewPreference } from '../lib/paymentDraft';
import PaymentWizard from '../components/payment/PaymentWizard';
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
export default function DepositPage() {
    const { theme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const location = useLocation();
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
    const [packageEmail, setPackageEmail] = useState('');
    const [packageSubmitting, setPackageSubmitting] = useState(false);
    const [packageError, setPackageError] = useState('');
    const [packageCheckoutUrl, setPackageCheckoutUrl] = useState('');
    const [packagePaymentId, setPackagePaymentId] = useState('');
    const [packagePaymentStatus, setPackagePaymentStatus] = useState('');
    const [packageStep, setPackageStep] = useState('details');
    const [packageOpen, setPackageOpen] = useState(true);
    const [verificationOpen, setVerificationOpen] = useState(false);
    const [verificationPaymentId, setVerificationPaymentId] = useState('');
    const [verificationPaymentStatus, setVerificationPaymentStatus] = useState('');
    const [verificationStep, setVerificationStep] = useState('details');
    useEffect(() => {
        const packageDraft = readPaymentDraft('package');
        const verificationDraft = readPaymentDraft('verification');
        if (packageDraft) {
            if (packageDraft.tier)
                setSelectedTier(packageDraft.tier === 'pro' ? 'Pro' : 'Elite');
            if (packageDraft.provider)
                setPackageProvider(packageDraft.provider);
            if (packageDraft.email)
                setPackageEmail(packageDraft.email);
            if (packageDraft.phone)
                setPackagePhone(packageDraft.phone);
            setPackageStep(packageDraft.step);
            setPackageOpen(true);
        }
        if (verificationDraft) {
            if (verificationDraft.provider)
                setPaymentMethod(verificationDraft.provider);
            if (verificationDraft.accountLabel)
                setAccountLabel(verificationDraft.accountLabel);
            if (verificationDraft.email || verificationDraft.phone)
                setAccountValue(verificationDraft.email || verificationDraft.phone || '');
            setVerificationStep(verificationDraft.step);
        }
        const explicitIntent = parsePaymentIntent(location.search, location.state);
        const intent = explicitIntent === 'auto' ? readPaymentViewPreference() : explicitIntent;
        if (intent === 'packages')
            setPackageOpen(true);
        if (intent === 'verification')
            setVerificationOpen(true);
    }, [location.search, location.state]);
    useEffect(() => {
        writePaymentDraft('package', { flow: 'package', tier: TIERS.find((item) => item.name === selectedTier)?.tier, provider: packageProvider, email: packageEmail, phone: packagePhone, step: packageStep });
    }, [selectedTier, packageProvider, packageEmail, packagePhone, packageStep]);
    useEffect(() => {
        writePaymentDraft('verification', { flow: 'verification', provider: paymentMethod, accountLabel, email: paymentMethod === 'mpesa' ? undefined : accountValue, phone: paymentMethod === 'mpesa' ? accountValue : undefined, step: verificationStep });
    }, [paymentMethod, accountLabel, accountValue, verificationStep]);
    useEffect(() => {
        if (packagePaymentStatus && ['success', 'completed'].includes(packagePaymentStatus))
            clearPaymentDraft('package');
        if (verificationPaymentStatus && ['held', 'verified'].includes(verificationPaymentStatus))
            clearPaymentDraft('verification');
    }, [packagePaymentStatus, verificationPaymentStatus]);
    useEffect(() => {
        const refreshTimer = window.setTimeout(() => {
            AOS.refreshHard();
            window.requestAnimationFrame(() => AOS.refresh());
        }, 80);
        return () => window.clearTimeout(refreshTimer);
    }, [packageOpen, verificationOpen]);
    useEffect(() => {
        if (!packagePaymentId || !user || isPaymentProgressTerminal(packagePaymentStatus))
            return;
        let cancelled = false;
        const refresh = async () => {
            try {
                const result = await fetchPackagePaymentStatus(packagePaymentId);
                if (!cancelled)
                    setPackagePaymentStatus(result.status);
            }
            catch {
                // The progress panel remains actionable while a transient read fails.
            }
        };
        void refresh();
        const timer = window.setInterval(refresh, 4000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [packagePaymentId, packagePaymentStatus, user]);
    useEffect(() => {
        if (!verificationPaymentId || !user || isPaymentProgressTerminal(verificationPaymentStatus))
            return;
        let cancelled = false;
        const refresh = async () => {
            try {
                const result = await fetchVerificationPaymentStatus(verificationPaymentId);
                if (!cancelled)
                    setVerificationPaymentStatus(result.status);
            }
            catch {
                // The progress panel remains actionable while a transient read fails.
            }
        };
        void refresh();
        const timer = window.setInterval(refresh, 4000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [verificationPaymentId, verificationPaymentStatus, user]);
    function handleTierSelect(tierName, price) {
        setSelectedTier(tierName);
        setPackageOpen(true);
        setPackageStep('details');
        if (price === 0) {
            setPackageMessage('You are already on the Free plan. Choose a paid tier to begin an upgrade flow.');
            return;
        }
        setPackageMessage(`${tierName} selected at $${price} for 3 months. Choose a provider below to continue.`);
        window.setTimeout(() => document.getElementById('package-payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
    function resetPackagePayment() {
        setPackagePaymentId('');
        setPackagePaymentStatus('');
        setPackageCheckoutUrl('');
        setPackageError('');
        setPackageMessage('Your previous attempt was not completed. Review the details and start a new payment.');
        setPackageStep('payment');
    }
    function resetVerificationPayment() {
        setVerificationPaymentId('');
        setVerificationPaymentStatus('');
        setCheckoutUrl('');
        setError('');
        setMessage('Your previous attempt was not completed. Review the details and start a new verification payment.');
        setVerificationStep('payment');
    }
    function discardPackageDraft() {
        clearPaymentDraft('package');
        setPackageStep('details');
        setPackagePaymentId('');
        setPackagePaymentStatus('');
        setPackageCheckoutUrl('');
        setPackageError('');
    }
    function discardVerificationDraft() {
        clearPaymentDraft('verification');
        setVerificationStep('details');
        setVerificationPaymentId('');
        setVerificationPaymentStatus('');
        setCheckoutUrl('');
        setError('');
    }
    function togglePackageView() {
        setPackageOpen((open) => {
            const next = !open;
            if (next)
                writePaymentViewPreference('packages');
            return next;
        });
    }
    function toggleVerificationView() {
        setVerificationOpen((open) => {
            const next = !open;
            if (next)
                writePaymentViewPreference('verification');
            return next;
        });
    }
    async function handlePackagePayment(e) {
        e.preventDefault();
        setPackageError('');
        setPackageCheckoutUrl('');
        setPackageMessage('');
        setPackagePaymentId('');
        setPackagePaymentStatus('');
        if (!user) {
            setPackageError('Sign in before starting a package payment.');
            return;
        }
        const tier = TIERS.find((item) => item.name === selectedTier)?.tier;
        if (!tier) {
            setPackageError('Choose Pro or Elite before starting a package payment.');
            return;
        }
        const packageProviderError = validateProviderInput(packageProvider, { email: packageEmail, phone: packagePhone });
        if (packageProviderError) {
            setPackageError(packageProviderError);
            return;
        }
        setPackageSubmitting(true);
        try {
            const created = await createPackagePayment({
                tier: tier,
                provider: packageProvider,
                idempotencyKey: createPackageIdempotencyKey(tier),
            });
            setPackagePaymentId(created.transactionId);
            setPackagePaymentStatus('created');
            const started = await startPackagePayment({
                transactionId: created.transactionId,
                phone: packagePhone.trim() || undefined,
                email: packageEmail.trim() || undefined,
            });
            setPackagePaymentStatus(started.status || 'pending');
            setPackageCheckoutUrl(started.checkoutUrl || '');
            setPackageMessage(packageProvider === 'mpesa'
                ? 'STK prompt started. Complete it on your phone; your package activates after verified provider confirmation.'
                : 'Payment started. Complete checkout; your package activates after verified provider confirmation.');
            setPackageStep('result');
        }
        catch (err) {
            setPackagePaymentStatus('failed');
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
        setVerificationPaymentId('');
        setVerificationPaymentStatus('');
        if (!user) {
            setError('Sign in before starting payment verification.');
            return;
        }
        if (!accountLabel.trim()) {
            setError('Add a label for the payout account.');
            return;
        }
        const verificationProviderError = validateProviderInput(paymentMethod, {
            email: paymentMethod === 'mpesa' ? undefined : accountValue,
            phone: paymentMethod === 'mpesa' ? accountValue : undefined,
        });
        if (verificationProviderError) {
            setError(verificationProviderError);
            return;
        }
        setSubmitting(true);
        try {
            const result = await createVerificationPayment({
                method: paymentMethod,
                accountLabel: accountLabel.trim(),
                accountValue: accountValue.trim(),
                email: paymentMethod === 'mpesa' ? undefined : accountValue.trim(),
                phone: paymentMethod === 'mpesa' ? accountValue.trim() : undefined,
            });
            setVerificationPaymentId(result.depositId);
            setVerificationPaymentStatus(result.status || 'pending');
            setMessage('Verification payment created. Complete the provider payment, then wait for admin approval.');
            setCheckoutUrl(result.checkoutUrl || '');
            setAccountValue('');
            setVerificationStep('result');
        }
        catch (err) {
            setVerificationPaymentStatus('failed');
            setError(err instanceof Error ? err.message : 'Unable to start verification payment.');
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("div", { className: "container pt-8", children: _jsx("h1", { className: "font-display text-2xl font-bold", "data-aos": "fade-down", children: "Subscription & Deposits" }) }), _jsxs("main", { className: "container py-8", children: [_jsxs("div", { id: "packages", className: "mb-12 scroll-mt-6", "data-aos": "fade-up", children: [_jsx("h2", { className: "font-display text-2xl mb-6", "data-aos": "fade-down", children: "Choose Your Tier" }), _jsx("div", { className: "grid md:grid-cols-3 gap-6", children: TIERS.map((tier, index) => (_jsxs("div", { "data-aos": "fade-up", "data-aos-delay": index * 90, className: `card relative animate-in border-2 ${tier.color} ${theme === 'dark' ? 'bg-stone-800 border-opacity-50' : ''} ${tier.recommended ? 'md:scale-105 shadow-lg' : ''} ${selectedTier === tier.name ? 'ring-2 ring-brand-500' : ''}`, children: [tier.recommended && (_jsx("div", { className: "absolute -top-3 left-4 bg-navy-700 text-white px-3 py-1 rounded-full text-xs font-semibold", children: "Recommended" })), _jsx("h3", { className: "font-display text-xl mb-2", children: tier.name }), _jsxs("p", { className: "font-display text-3xl font-bold mb-1", children: ["$", tier.price] }), tier.price > 0 && _jsx("p", { className: "text-sm mb-4", style: { color: 'var(--text-muted)' }, children: "for 3 months" }), tier.price === 0 && _jsx("div", { className: "mb-4" }), _jsx("ul", { className: "space-y-2 mb-6", children: tier.benefits.map((benefit) => (_jsxs("li", { className: `text-sm ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: ["\u2713 ", benefit] }, benefit))) }), _jsx("button", { onClick: () => handleTierSelect(tier.name, tier.price), className: `w-full btn-primary py-2 rounded-lg font-semibold transition-all ${tier.recommended ? 'bg-navy-700 text-white hover:bg-navy-800' : ''}`, children: tier.price === 0 ? 'Current Plan' : selectedTier === tier.name ? 'Selected' : 'Upgrade' })] }, tier.name))) }), packageMessage && _jsx("div", { className: "alert alert-info mt-6", "data-aos": "fade-in", children: packageMessage })] }), _jsxs("section", { className: `card max-w-2xl mx-auto mb-10 scroll-mt-6 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, "data-aos": "fade-up", children: [_jsxs("button", { id: "package-payment-toggle", type: "button", "aria-expanded": packageOpen, "aria-controls": "package-payment-form", onClick: togglePackageView, className: "w-full flex items-center justify-between gap-4 text-left", children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(CreditCard, { size: 20, "aria-hidden": "true" }) }), _jsxs("span", { children: [_jsx("span", { className: "block font-display text-2xl", children: "Pay for your package" }), _jsx("span", { className: "block text-sm mt-1", style: { color: 'var(--text-muted)' }, children: "Upgrade from Free to Pro or Elite" })] })] }), _jsxs("span", { className: "flex items-center gap-2 shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300", children: [_jsx("span", { className: "hidden sm:inline", children: packageOpen ? 'Hide' : 'Show' }), _jsx(ChevronDown, { size: 20, "aria-hidden": "true", className: `transition-transform duration-300 ${packageOpen ? 'rotate-180' : ''}` })] })] }), _jsxs("form", { id: "package-payment-form", "aria-hidden": !packageOpen, onSubmit: handlePackagePayment, className: `mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${packageOpen ? 'max-h-[1200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`, children: [_jsx("p", { className: "text-sm mb-6", style: { color: 'var(--text-muted)' }, children: "Package changes are available from Free tier only. Payment remains pending until the provider callback is verified." }), _jsxs(PaymentWizard, { currentStep: packageStep, canContinue: packageStep !== 'payment' && (packageStep === 'details' ? selectedTier !== 'Free' : packageStep === 'provider' ? !validateProviderInput(packageProvider, { email: packageEmail, phone: packagePhone }) : true), onStepChange: setPackageStep, onDiscard: discardPackageDraft, nextLabel: packageStep === 'provider' ? 'Continue to payment' : 'Continue', children: [packageStep === 'details' && _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-display text-xl", children: "Confirm your package" }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Review the selected package before choosing how to pay." }), _jsxs("div", { className: "rounded-xl border border-[var(--border)] p-4", children: [_jsx("p", { className: "font-semibold", children: selectedTier }), _jsxs("p", { className: "text-2xl font-bold mt-1", children: ["$", TIERS.find((tier) => tier.name === selectedTier)?.price] }), _jsx("p", { className: "text-sm mt-1", style: { color: 'var(--text-muted)' }, children: "3-month access" })] })] }), packageStep === 'provider' && _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-3", children: "Payment provider" }), _jsx(PaymentProviderTabs, { selectedValue: packageProvider, onChange: setPackageProvider, idPrefix: "package-payment-provider" })] }), _jsx("div", { id: `package-payment-provider-panel-${packageProvider}`, role: "tabpanel", "aria-labelledby": `package-payment-provider-tab-${packageProvider}`, children: _jsxs("label", { className: "block text-sm font-semibold", children: [getProviderField(packageProvider).label, _jsx("input", { className: "input-field w-full mt-2", value: packageProvider === 'mpesa' ? packagePhone : packageEmail, onChange: (e) => packageProvider === 'mpesa' ? setPackagePhone(e.target.value) : setPackageEmail(e.target.value), placeholder: getProviderField(packageProvider).placeholder, autoComplete: getProviderField(packageProvider).autoComplete, type: packageProvider === 'mpesa' ? 'tel' : 'email' })] }) }), validateProviderInput(packageProvider, { email: packageEmail, phone: packagePhone }) && _jsx("p", { className: "alert alert-error", children: validateProviderInput(packageProvider, { email: packageEmail, phone: packagePhone }) })] }), packageStep === 'payment' && _jsxs("div", { className: "space-y-5", children: [_jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Start the provider payment. Keep this page open until confirmation is received." }), packageCheckoutUrl && _jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: packageCheckoutUrl, target: "_blank", rel: "noreferrer", children: getCheckoutLabel(packageProvider) }), packageError && _jsx("div", { className: "alert alert-error", children: packageError }), _jsx("button", { type: "submit", disabled: packageSubmitting || selectedTier === 'Free', className: "w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-60", children: packageSubmitting ? 'Starting package payment...' : `Pay $${TIERS.find((tier) => tier.name === selectedTier)?.price}` })] }), packageStep === 'result' && _jsxs("div", { className: "space-y-4", children: [packagePaymentId && packagePaymentStatus && _jsx(PaymentProgress, { kind: "package", provider: packageProvider, status: packagePaymentStatus, onRetry: resetPackagePayment }), packageError && _jsx("div", { className: "alert alert-error", children: packageError }), packageCheckoutUrl && _jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: packageCheckoutUrl, target: "_blank", rel: "noreferrer", children: getCheckoutLabel(packageProvider) })] })] })] })] }), _jsxs("section", { className: `card max-w-2xl mx-auto animate-in scroll-mt-6 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, "data-aos": "fade-up", children: [_jsxs("button", { id: "verification-payment-toggle", type: "button", "aria-expanded": verificationOpen, "aria-controls": "payment-form", onClick: toggleVerificationView, className: "w-full flex items-center justify-between gap-4 text-left", children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(ShieldCheck, { size: 20, "aria-hidden": "true" }) }), _jsxs("span", { children: [_jsx("span", { className: "block font-display text-2xl", children: "Verify payout account" }), _jsx("span", { className: "block text-sm mt-1", style: { color: 'var(--text-muted)' }, children: "Required before requesting withdrawals" })] })] }), _jsxs("span", { className: "flex items-center gap-2 shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300", children: [_jsx("span", { className: "hidden sm:inline", children: verificationOpen ? 'Hide' : 'Show' }), _jsx(ChevronDown, { size: 20, "aria-hidden": "true", className: `transition-transform duration-300 ${verificationOpen ? 'rotate-180' : ''}` })] })] }), _jsxs("form", { id: "payment-form", "aria-hidden": !verificationOpen, onSubmit: handleVerification, className: `mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${verificationOpen ? 'max-h-[1600px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`, children: [_jsx("h2", { className: "sr-only", children: "Verify Your Payout Account" }), _jsxs("p", { className: `text-sm mb-6 ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`, children: ["Pay exactly ", formatCurrency(VERIFICATION_USD, 'USD'), " (", formatCurrency(VERIFICATION_KES, 'KES'), ") to verify ownership. The payment is held for admin review."] }), _jsxs(PaymentWizard, { currentStep: verificationStep, canContinue: verificationStep !== 'payment' && (verificationStep === 'details' ? Boolean(accountLabel.trim()) : verificationStep === 'provider' ? !validateProviderInput(paymentMethod, { email: paymentMethod === 'mpesa' ? undefined : accountValue, phone: paymentMethod === 'mpesa' ? accountValue : undefined }) : true), onStepChange: setVerificationStep, onDiscard: discardVerificationDraft, nextLabel: verificationStep === 'provider' ? 'Continue to payment' : 'Continue', children: [verificationStep === 'details' && _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-display text-xl", children: "Confirm payout account" }), _jsxs("label", { className: "block text-sm font-semibold", children: ["Account label", _jsx("input", { className: "input-field w-full mt-2", value: accountLabel, onChange: (e) => setAccountLabel(e.target.value), placeholder: "My primary account" })] }), _jsxs("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: ["Verification amount: ", formatCurrency(VERIFICATION_USD, 'USD'), " (", formatCurrency(VERIFICATION_KES, 'KES'), ")."] })] }), verificationStep === 'provider' && _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: `block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-stone-300' : ''}`, children: "Payment Method" }), _jsx(PaymentProviderTabs, { selectedValue: paymentMethod, onChange: setPaymentMethod, idPrefix: "verification-payment-provider" })] }), _jsx("div", { id: `verification-payment-provider-panel-${paymentMethod}`, role: "tabpanel", "aria-labelledby": `verification-payment-provider-tab-${paymentMethod}`, children: _jsxs("label", { className: "text-sm font-semibold", children: [getProviderField(paymentMethod).label, _jsx("input", { className: "input-field w-full mt-2", value: accountValue, onChange: (e) => setAccountValue(e.target.value), placeholder: getProviderField(paymentMethod).placeholder, type: paymentMethod === 'mpesa' ? 'tel' : 'email', autoComplete: getProviderField(paymentMethod).autoComplete })] }) }), validateProviderInput(paymentMethod, { email: paymentMethod === 'mpesa' ? undefined : accountValue, phone: paymentMethod === 'mpesa' ? accountValue : undefined }) && _jsx("p", { className: "alert alert-error", children: validateProviderInput(paymentMethod, { email: paymentMethod === 'mpesa' ? undefined : accountValue, phone: paymentMethod === 'mpesa' ? accountValue : undefined }) })] }), verificationStep === 'payment' && _jsxs("div", { className: "space-y-5", children: [message && _jsx("div", { className: "alert alert-success", children: message }), checkoutUrl && _jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: checkoutUrl, target: "_blank", rel: "noreferrer", children: getCheckoutLabel(paymentMethod) }), error && _jsx("div", { className: "alert alert-error", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg text-lg disabled:opacity-60", children: submitting ? 'Starting verification...' : `Start verification for ${formatCurrency(VERIFICATION_USD, 'USD')}` })] }), verificationStep === 'result' && _jsxs("div", { className: "space-y-4", children: [verificationPaymentId && verificationPaymentStatus && _jsx(PaymentProgress, { kind: "verification", provider: paymentMethod, status: verificationPaymentStatus, onRetry: resetVerificationPayment }), message && _jsx("div", { className: "alert alert-success", children: message }), error && _jsx("div", { className: "alert alert-error", children: error })] })] }), _jsx("p", { className: `mt-6 text-xs text-center ${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'}`, children: "Your payment is secured and encrypted. No additional fees." })] })] })] })] }));
}
//# sourceMappingURL=Deposit.js.map