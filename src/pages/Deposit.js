import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import { ChevronDown, CreditCard, ShieldCheck } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { createPackagePayment, createVerificationPayment, fetchPackageCatalog, fetchPackagePaymentStatus, fetchVerificationPaymentStatus, startPackagePayment } from '../lib/paymentsApi';
import { createPackageIdempotencyKey } from '../lib/packageCheckout';
import { VERIFICATION_KES, VERIFICATION_USD } from '../lib/paymentConstants';
import PaymentProviderTabs from '../components/ui/PaymentProviderTabs';
import PaymentProgress from '../components/ui/PaymentProgress';
import { getCheckoutLabel, getProviderField, validateProviderInput } from '../lib/paymentProviders';
import { isPaymentProgressTerminal } from '../lib/paymentProgress';
import { clearPaymentDraft, parsePaymentIntent, readPaymentDraft, readPaymentViewPreference, writePaymentDraft, writePaymentViewPreference } from '../lib/paymentDraft';
import PaymentWizard from '../components/payment/PaymentWizard';
import { supabase } from '../utils/supabase';
const TIERS = [
    {
        name: 'Free',
        tier: 'free',
        price: 0,
        offerPrice: null,
        offerAvailable: false,
        offerDiscount: 0,
        originalPriceKes: null,
        priceKes: null,
        validityMonths: null,
        tasksAllowed: 4,
        dailyTasksAllowed: 1,
        weeklyTasksAllowed: 1,
        maxTaskRewardUsd: 4.99,
        highPayingEligible: false,
        benefits: ['4 tasks/month', '1 task per 7 days', 'Tasks under $5'],
        color: 'border-stone-300',
    },
    {
        name: 'Pro',
        tier: 'pro',
        price: 19,
        offerPrice: 3,
        offerAvailable: true,
        offerDiscount: 16,
        originalPriceKes: 2489,
        priceKes: 393,
        validityMonths: 1,
        tasksAllowed: 30,
        dailyTasksAllowed: 1,
        weeklyTasksAllowed: null,
        maxTaskRewardUsd: 9.9,
        highPayingEligible: true,
        benefits: ['30 tasks/month', '1 task per day', 'Tasks up to $9.90', '1-month access'],
        color: 'border-navy-300',
        recommended: true,
    },
    {
        name: 'Elite',
        tier: 'elite',
        price: 49,
        offerPrice: 7,
        offerAvailable: true,
        offerDiscount: 42,
        originalPriceKes: 6419,
        priceKes: 917,
        validityMonths: 1,
        tasksAllowed: 90,
        dailyTasksAllowed: 3,
        weeklyTasksAllowed: null,
        maxTaskRewardUsd: 20,
        highPayingEligible: true,
        benefits: ['90 tasks/month', '3 tasks per day', 'Tasks up to $20', '1-month access'],
        color: 'border-[#F5A623]',
    },
    {
        name: 'Max',
        tier: 'max',
        price: 99,
        offerPrice: 10,
        offerAvailable: true,
        offerDiscount: 89,
        originalPriceKes: 12969,
        priceKes: 1310,
        validityMonths: 1,
        tasksAllowed: null,
        dailyTasksAllowed: null,
        weeklyTasksAllowed: null,
        maxTaskRewardUsd: null,
        highPayingEligible: true,
        benefits: ['All tasks', 'Unlimited volume', 'No reward cap', '1-month access'],
        color: 'border-brand-500',
    },
];
function tierBenefits(tier) {
    if (tier.tier === 'free')
        return ['4 tasks/month', '1 task per 7 days', 'Tasks under $5'];
    if (tier.tier === 'pro')
        return ['30 tasks/month', '1 task per day', 'Tasks up to $9.90', '1-month access'];
    if (tier.tier === 'elite')
        return ['90 tasks/month', '3 tasks per day', 'Tasks up to $20', '1-month access'];
    return ['All tasks', 'Unlimited volume', 'No reward cap', '1-month access'];
}
function tierPayablePrice(tier) {
    return tier.offerAvailable && tier.offerPrice !== null ? tier.offerPrice : tier.price;
}
export default function DepositPage() {
    const { theme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const location = useLocation();
    const [tiers, setTiers] = useState(TIERS);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState('');
    const [verificationAmounts, setVerificationAmounts] = useState({ amountUsd: VERIFICATION_USD, amountKes: Math.round(VERIFICATION_KES) });
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
    const [packageReference, setPackageReference] = useState('');
    const [packagePaymentStatus, setPackagePaymentStatus] = useState('');
    const [packageStep, setPackageStep] = useState('details');
    const [packageOpen, setPackageOpen] = useState(true);
    const [verificationOpen, setVerificationOpen] = useState(false);
    const [verificationPaymentId, setVerificationPaymentId] = useState('');
    const [verificationPaymentStatus, setVerificationPaymentStatus] = useState('');
    const [verificationStep, setVerificationStep] = useState('details');
    useEffect(() => {
        let cancelled = false;
        void fetchPackageCatalog().then((catalog) => {
            if (cancelled)
                return;
            setTiers((current) => current.map((tier) => {
                const plan = catalog.plans.find((item) => item.tier === tier.tier);
                return plan ? { ...tier, price: plan.priceUsd, offerPrice: plan.offerPriceUsd, offerAvailable: plan.offerAvailable, offerDiscount: plan.offerDiscountUsd, originalPriceKes: plan.originalPriceKes, priceKes: plan.priceKes, validityMonths: plan.validityMonths, tasksAllowed: plan.tasksAllowed, dailyTasksAllowed: plan.dailyTasksAllowed, weeklyTasksAllowed: plan.weeklyTasksAllowed, maxTaskRewardUsd: plan.maxTaskRewardUsd, highPayingEligible: plan.highPayingEligible } : tier;
            }));
            setVerificationAmounts(catalog.verification);
            setCatalogLoading(false);
        }).catch((error) => {
            if (cancelled)
                return;
            setCatalogError(error instanceof Error ? error.message : 'Unable to load current package pricing.');
            setCatalogLoading(false);
        });
        return () => { cancelled = true; };
    }, []);
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const orderId = query.get('token');
        const reference = query.get('reference') || query.get('trxref');
        if ((!orderId && !reference) || !user?.id)
            return;
        let active = true;
        setMessage('Checking your payment…');
        void supabase.functions.invoke(orderId ? 'capture-paypal-payment' : 'resolve-payment-return', { body: orderId ? { orderId } : { reference } }).then(({ data, error: captureError }) => {
            if (!active)
                return;
            if (captureError || !data?.paymentId) {
                setError('Unable to confirm payment. Reload this page to retry; your payment will not be captured twice.');
                setMessage('');
                setVerificationOpen(true);
                return;
            }
            if (data.kind === 'package') {
                setPackageProvider(orderId ? 'paypal' : 'paystack');
                setPackagePaymentId(data.paymentId);
                setPackagePaymentStatus(data.status);
                setPackageStep('result');
                setPackageOpen(true);
            }
            else {
                setPaymentMethod(orderId ? 'paypal' : 'paystack');
                setVerificationPaymentId(data.paymentId);
                setVerificationPaymentStatus(data.status);
                setVerificationStep('result');
                setVerificationOpen(true);
            }
            setMessage('');
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('PayerID');
            url.searchParams.delete('reference');
            url.searchParams.delete('trxref');
            window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
        }).catch(() => { if (active) {
            setError('Unable to confirm payment. Reload this page to retry.');
            setMessage('');
            setVerificationOpen(true);
        } });
        return () => { active = false; };
    }, [location.search, user?.id]);
    useEffect(() => {
        const packageDraft = readPaymentDraft('package');
        const verificationDraft = readPaymentDraft('verification');
        if (packageDraft) {
            if (packageDraft.tier)
                setSelectedTier(packageDraft.tier === 'pro' ? 'Pro' : packageDraft.tier === 'elite' ? 'Elite' : 'Max');
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
        writePaymentDraft('package', { flow: 'package', tier: tiers.find((item) => item.name === selectedTier)?.tier, provider: packageProvider, email: packageEmail, phone: packagePhone, step: packageStep });
    }, [selectedTier, packageProvider, packageEmail, packagePhone, packageStep, tiers]);
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
        if (!user || !['success', 'completed'].includes(packagePaymentStatus))
            return;
        const activatedTier = selectedTier.toLowerCase();
        if (activatedTier !== 'pro' && activatedTier !== 'elite' && activatedTier !== 'max')
            return;
        if (user.subscription === activatedTier)
            return;
        setUser({ ...user, subscription: activatedTier });
    }, [packagePaymentStatus, selectedTier, setUser, user]);
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
    function handleTierSelect(tierName) {
        setSelectedTier(tierName);
        setPackageOpen(true);
        setPackageStep('details');
        const selected = tiers.find((tier) => tier.name === tierName);
        const payablePrice = selected ? tierPayablePrice(selected) : 0;
        const priceLabel = selected?.offerAvailable && selected.offerPrice !== null
            ? `$${payablePrice} one-time offer (regularly $${selected.price})`
            : `$${payablePrice}`;
        if (payablePrice === 0) {
            setPackageMessage('You are already on the Free plan. Choose a paid tier to begin an upgrade flow.');
            return;
        }
        setPackageMessage(`${tierName} selected at ${priceLabel} for ${selected?.validityMonths ?? 1} month. Choose a provider below to continue.`);
        window.setTimeout(() => document.getElementById('package-payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
    }
    function resetPackagePayment() {
        setPackagePaymentId('');
        setPackageReference('');
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
        setMessage('Your previous attempt was not completed. Review the payment account and start a new verification payment.');
        setVerificationStep('payment');
    }
    function discardPackageDraft() {
        clearPaymentDraft('package');
        setPackageStep('details');
        setPackagePaymentId('');
        setPackageReference('');
        setPackagePaymentStatus('');
        setPackageCheckoutUrl('');
        setPackageError('');
    }
    function downloadPackageReceipt() {
        if (!['success', 'completed'].includes(packagePaymentStatus))
            return;
        const selected = tiers.find((tier) => tier.name === selectedTier);
        const amount = packageProvider === 'mpesa'
            ? formatCurrency(selected?.priceKes || 0, 'KES')
            : formatCurrency(selected ? tierPayablePrice(selected) : 0, 'USD');
        const receipt = [
            'Giglify payment receipt',
            `Date: ${new Date().toLocaleString()}`,
            `Package: ${selectedTier}`,
            `Amount: ${amount}`,
            `Provider: ${packageProvider}`,
            `Reference: ${packageReference || packagePaymentId}`,
            'Status: Confirmed',
            `Access: ${selected?.validityMonths ?? 1} month`,
        ].join('\n');
        const url = URL.createObjectURL(new Blob([receipt], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `giglify-${selectedTier.toLowerCase()}-receipt.txt`;
        link.click();
        URL.revokeObjectURL(url);
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
        const tier = tiers.find((item) => item.name === selectedTier)?.tier;
        if (!tier) {
            setPackageError('Choose a paid tier before starting a package payment.');
            return;
        }
        const packageProviderError = validateProviderInput(packageProvider, { email: packageEmail, phone: packagePhone });
        if (packageProviderError) {
            setPackageError(packageProviderError);
            return;
        }
        if (catalogLoading || catalogError) {
            setPackageError('Current package pricing is unavailable. Refresh the page before starting payment.');
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
            setPackageReference(created.tuid);
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
    return (_jsxs("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("div", { className: "container pt-8", children: _jsx("h1", { className: "font-display text-2xl font-bold", "data-aos": "fade-down", children: "Subscription & Deposits" }) }), _jsxs("main", { className: "container py-8", children: [_jsxs("div", { id: "packages", className: "mb-12 scroll-mt-6", "data-aos": "fade-up", children: [_jsx("h2", { className: "font-display text-2xl mb-6", "data-aos": "fade-down", children: "Choose Your Tier" }), _jsx("div", { className: "grid md:grid-cols-2 xl:grid-cols-4 gap-6", children: tiers.map((tier, index) => (_jsxs("div", { "data-aos": "fade-up", "data-aos-delay": index * 90, className: `card relative animate-in border-2 ${tier.color} ${theme === 'dark' ? 'bg-stone-800 border-opacity-50' : ''} ${tier.recommended ? 'md:scale-105 shadow-lg' : ''} ${selectedTier === tier.name ? 'ring-2 ring-brand-500' : ''}`, children: [tier.recommended && (_jsx("div", { className: "absolute -top-3 left-4 bg-navy-700 text-white px-3 py-1 rounded-full text-xs font-semibold", children: "Recommended" })), _jsx("h3", { className: "font-display text-xl mb-2", children: tier.name }), tier.offerAvailable && tier.offerPrice !== null ? _jsxs("div", { className: "mb-1", children: [_jsxs("p", { className: "font-display text-3xl font-bold text-brand-700 dark:text-brand-300", children: ["$", tier.offerPrice] }), _jsxs("p", { className: "text-sm line-through", style: { color: 'var(--text-muted)' }, children: ["Regularly $", tier.price] }), _jsxs("p", { className: "text-xs font-semibold text-brand-700 dark:text-brand-300", children: ["Limited one-time offer \u00B7 Save $", tier.offerDiscount] })] }) : _jsxs("p", { className: "font-display text-3xl font-bold mb-1", children: ["$", tier.price] }), tier.price > 0 && _jsxs("p", { className: "text-sm mb-1", style: { color: 'var(--text-muted)' }, children: ["for ", tier.validityMonths ?? 1, " month", (tier.validityMonths ?? 1) === 1 ? '' : 's'] }), tier.price > 0 && tier.priceKes !== null && _jsxs("p", { className: "text-xs mb-4", style: { color: 'var(--text-muted)' }, children: [tier.offerAvailable && tier.originalPriceKes !== null && _jsx("span", { className: "line-through mr-1", children: formatCurrency(tier.originalPriceKes, 'KES') }), formatCurrency(tier.priceKes, 'KES'), " with M-Pesa"] }), tier.price === 0 && _jsx("div", { className: "mb-4" }), _jsx("ul", { className: "space-y-2 mb-6", children: tierBenefits(tier).map((benefit) => (_jsxs("li", { className: `text-sm ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: ["\u2713 ", benefit] }, benefit))) }), _jsx("button", { onClick: () => handleTierSelect(tier.name), className: `w-full btn-primary py-2 rounded-lg font-semibold transition-all ${tier.recommended ? 'bg-navy-700 text-white hover:bg-navy-800' : ''}`, children: tier.price === 0 ? 'Current Plan' : selectedTier === tier.name ? 'Selected' : 'Upgrade' })] }, tier.name))) }), catalogLoading && _jsx("p", { className: "text-sm mt-5", style: { color: 'var(--text-muted)' }, children: "Loading current package pricing\u2026" }), catalogError && _jsxs("div", { className: "alert alert-error mt-5", children: [catalogError, " Refresh the page before paying."] }), packageMessage && _jsx("div", { className: "alert alert-info mt-6", "data-aos": "fade-in", children: packageMessage })] }), _jsxs("section", { className: `card max-w-2xl mx-auto mb-10 scroll-mt-6 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, "data-aos": "fade-up", children: [_jsxs("button", { id: "package-payment-toggle", type: "button", "aria-expanded": packageOpen, "aria-controls": "package-payment-form", onClick: togglePackageView, className: "w-full flex items-center justify-between gap-4 text-left", children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(CreditCard, { size: 20, "aria-hidden": "true" }) }), _jsxs("span", { children: [_jsx("span", { className: "block font-display text-2xl", children: "Pay for your package" }), _jsx("span", { className: "block text-sm mt-1", style: { color: 'var(--text-muted)' }, children: "Upgrade from Free to Pro, Elite, or Max" })] })] }), _jsxs("span", { className: "flex items-center gap-2 shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300", children: [_jsx("span", { className: "hidden sm:inline", children: packageOpen ? 'Hide' : 'Show' }), _jsx(ChevronDown, { size: 20, "aria-hidden": "true", className: `transition-transform duration-300 ${packageOpen ? 'rotate-180' : ''}` })] })] }), _jsxs("form", { id: "package-payment-form", "aria-hidden": !packageOpen, onSubmit: handlePackagePayment, className: `mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${packageOpen ? 'max-h-[1200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`, children: [_jsx("p", { className: "text-sm mb-6", style: { color: 'var(--text-muted)' }, children: "Choose your package, select a payment method, then review and pay. Your package activates once payment is confirmed." }), _jsxs(PaymentWizard, { currentStep: packageStep, canContinue: packageStep !== 'payment' && (packageStep === 'details' ? selectedTier !== 'Free' : packageStep === 'provider' ? !validateProviderInput(packageProvider, { email: packageEmail, phone: packagePhone }) : true), onStepChange: setPackageStep, onDiscard: discardPackageDraft, nextLabel: packageStep === 'provider' ? 'Continue to payment' : 'Continue', children: [packageStep === 'details' && _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-display text-xl", children: "Confirm your package" }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Review the selected package before choosing how to pay." }), _jsxs("div", { className: "rounded-xl border border-[var(--border)] p-4", children: [_jsx("p", { className: "font-semibold", children: selectedTier }), (() => { const selected = tiers.find((tier) => tier.name === selectedTier); return selected?.offerAvailable && selected.offerPrice !== null ? _jsxs(_Fragment, { children: [_jsxs("p", { className: "text-2xl font-bold mt-1", children: ["$", selected.offerPrice] }), _jsxs("p", { className: "text-sm line-through", style: { color: 'var(--text-muted)' }, children: ["Regularly $", selected.price, " \u00B7 Save $", selected.offerDiscount] })] }) : _jsxs("p", { className: "text-2xl font-bold mt-1", children: ["$", selected?.price] }); })(), _jsxs("p", { className: "text-sm mt-1", style: { color: 'var(--text-muted)' }, children: [tiers.find((tier) => tier.name === selectedTier)?.validityMonths ?? 1, "-month access"] }), tiers.find((tier) => tier.name === selectedTier)?.priceKes !== null && _jsxs("p", { className: "text-sm mt-1", style: { color: 'var(--text-muted)' }, children: [formatCurrency(tiers.find((tier) => tier.name === selectedTier)?.priceKes || 0, 'KES'), " with M-Pesa"] })] })] }), packageStep === 'provider' && _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-3", children: "Payment provider" }), _jsx(PaymentProviderTabs, { selectedValue: packageProvider, onChange: setPackageProvider, idPrefix: "package-payment-provider" })] }), _jsx("div", { id: `package-payment-provider-panel-${packageProvider}`, role: "tabpanel", "aria-labelledby": `package-payment-provider-tab-${packageProvider}`, children: _jsxs("label", { className: "block text-sm font-semibold", children: [getProviderField(packageProvider).label, _jsx("input", { className: "input-field w-full mt-2", value: packageProvider === 'mpesa' ? packagePhone : packageEmail, onChange: (e) => packageProvider === 'mpesa' ? setPackagePhone(e.target.value) : setPackageEmail(e.target.value), placeholder: getProviderField(packageProvider).placeholder, autoComplete: getProviderField(packageProvider).autoComplete, type: packageProvider === 'mpesa' ? 'tel' : 'email' })] }) }), validateProviderInput(packageProvider, { email: packageEmail, phone: packagePhone }) && _jsx("p", { className: "alert alert-error", children: validateProviderInput(packageProvider, { email: packageEmail, phone: packagePhone }) })] }), packageStep === 'payment' && _jsxs("div", { className: "space-y-5", children: [_jsx("h3", { className: "font-display text-xl", children: "Review your payment" }), _jsxs("dl", { className: "divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] px-4", children: [_jsxs("div", { className: "flex justify-between gap-4 py-3", children: [_jsx("dt", { className: "text-[var(--text-muted)]", children: "Package" }), _jsxs("dd", { className: "font-semibold", children: [selectedTier, " \u00B7 ", tiers.find((tier) => tier.name === selectedTier)?.validityMonths ?? 1, " month"] })] }), _jsxs("div", { className: "flex justify-between gap-4 py-3", children: [_jsx("dt", { className: "text-[var(--text-muted)]", children: "Payment account" }), _jsx("dd", { className: "min-w-0 break-all text-right", children: packageProvider === 'mpesa' ? packagePhone : packageEmail })] }), _jsxs("div", { className: "flex items-center justify-between gap-4 py-4", children: [_jsx("dt", { className: "font-semibold", children: "Total due" }), _jsx("dd", { className: "text-right text-2xl font-bold", children: packageProvider === 'mpesa' ? formatCurrency(tiers.find((tier) => tier.name === selectedTier)?.priceKes || 0, 'KES') : formatCurrency(tierPayablePrice(tiers.find((tier) => tier.name === selectedTier) || TIERS[0]), 'USD') })] })] }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: packageProvider === 'mpesa' ? 'Confirm the payment prompt on your phone, then return here to see your status.' : 'Continue to your payment provider to complete checkout, then return here to see your status.' }), packageCheckoutUrl && _jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: packageCheckoutUrl, target: "_blank", rel: "noreferrer", children: getCheckoutLabel(packageProvider) }), packageError && _jsx("div", { className: "alert alert-error", children: packageError }), _jsx("button", { type: "submit", disabled: packageSubmitting || catalogLoading || Boolean(catalogError) || selectedTier === 'Free', className: "w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-60", children: packageSubmitting ? 'Starting package payment...' : `Pay ${packageProvider === 'mpesa' ? formatCurrency(tiers.find((tier) => tier.name === selectedTier)?.priceKes || 0, 'KES') : formatCurrency(tierPayablePrice(tiers.find((tier) => tier.name === selectedTier) || TIERS[0]), 'USD')}` })] }), packageStep === 'result' && _jsxs("div", { className: "space-y-4", children: [packagePaymentId && packagePaymentStatus && _jsx(PaymentProgress, { kind: "package", provider: packageProvider, status: packagePaymentStatus, reference: packageReference, onRetry: resetPackagePayment }), ['success', 'completed'].includes(packagePaymentStatus) && _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("button", { type: "button", className: "btn-secondary flex-1 py-3 rounded-lg font-semibold", onClick: downloadPackageReceipt, children: "Download receipt" }), _jsx(Link, { to: "/dashboard", className: "btn-primary flex-1 py-3 rounded-lg font-semibold text-center", children: "Open dashboard" })] }), packageError && _jsx("div", { className: "alert alert-error", children: packageError }), packageCheckoutUrl && _jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: packageCheckoutUrl, target: "_blank", rel: "noreferrer", children: getCheckoutLabel(packageProvider) })] })] }), _jsxs("p", { className: "mt-5 text-xs text-center", style: { color: 'var(--text-muted)' }, children: ["Need help before paying? ", _jsx(Link, { to: "/about#refunds", className: "text-brand-600 dark:text-brand-300 font-semibold hover:underline", children: "Refund policy" }), " \u00B7 ", _jsx(Link, { to: "/terms-of-use", className: "text-brand-600 dark:text-brand-300 font-semibold hover:underline", children: "Terms" }), " \u00B7 ", _jsx(Link, { to: "/contact", className: "text-brand-600 dark:text-brand-300 font-semibold hover:underline", children: "Contact support" })] })] })] }), _jsxs("section", { className: `card max-w-2xl mx-auto animate-in scroll-mt-6 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, "data-aos": "fade-up", children: [_jsxs("button", { id: "verification-payment-toggle", type: "button", "aria-expanded": verificationOpen, "aria-controls": "payment-form", onClick: toggleVerificationView, className: "w-full flex items-center justify-between gap-4 text-left", children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(ShieldCheck, { size: 20, "aria-hidden": "true" }) }), _jsxs("span", { children: [_jsx("span", { className: "block font-display text-2xl", children: "Verify payout account" }), _jsx("span", { className: "block text-sm mt-1", style: { color: 'var(--text-muted)' }, children: "Required before requesting withdrawals" })] })] }), _jsxs("span", { className: "flex items-center gap-2 shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300", children: [_jsx("span", { className: "hidden sm:inline", children: verificationOpen ? 'Hide' : 'Show' }), _jsx(ChevronDown, { size: 20, "aria-hidden": "true", className: `transition-transform duration-300 ${verificationOpen ? 'rotate-180' : ''}` })] })] }), _jsxs("form", { id: "payment-form", "aria-hidden": !verificationOpen, onSubmit: handleVerification, className: `mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${verificationOpen ? 'max-h-[1600px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`, children: [_jsx("h2", { className: "sr-only", children: "Verify Your Payout Account" }), _jsxs("p", { className: `text-sm mb-6 ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`, children: ["Pay the ", formatCurrency(verificationAmounts.amountUsd, 'USD'), " activation and payout-verification fee, or ", formatCurrency(verificationAmounts.amountKes, 'KES'), " with M-Pesa. The payment is held for admin review and unlocks payout access after approval."] }), _jsxs(PaymentWizard, { currentStep: verificationStep, canContinue: verificationStep !== 'payment' && (verificationStep === 'details' ? Boolean(accountLabel.trim()) : verificationStep === 'provider' ? !validateProviderInput(paymentMethod, { email: paymentMethod === 'mpesa' ? undefined : accountValue, phone: paymentMethod === 'mpesa' ? accountValue : undefined }) : true), onStepChange: setVerificationStep, onDiscard: discardVerificationDraft, nextLabel: verificationStep === 'provider' ? 'Continue to payment' : 'Continue', children: [verificationStep === 'details' && _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-display text-xl", children: "Confirm payout account" }), _jsxs("label", { className: "block text-sm font-semibold", children: ["Account label", _jsx("input", { className: "input-field w-full mt-2", value: accountLabel, onChange: (e) => setAccountLabel(e.target.value), placeholder: "My primary account" })] }), _jsxs("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: ["Activation and verification fee: ", formatCurrency(verificationAmounts.amountUsd, 'USD'), ", or ", formatCurrency(verificationAmounts.amountKes, 'KES'), " with M-Pesa."] })] }), verificationStep === 'provider' && _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: `block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-stone-300' : ''}`, children: "Payment Method" }), _jsx(PaymentProviderTabs, { selectedValue: paymentMethod, onChange: setPaymentMethod, idPrefix: "verification-payment-provider" })] }), _jsx("div", { id: `verification-payment-provider-panel-${paymentMethod}`, role: "tabpanel", "aria-labelledby": `verification-payment-provider-tab-${paymentMethod}`, children: _jsxs("label", { className: "text-sm font-semibold", children: [getProviderField(paymentMethod).label, _jsx("input", { className: "input-field w-full mt-2", value: accountValue, onChange: (e) => setAccountValue(e.target.value), placeholder: getProviderField(paymentMethod).placeholder, type: paymentMethod === 'mpesa' ? 'tel' : 'email', autoComplete: getProviderField(paymentMethod).autoComplete })] }) }), validateProviderInput(paymentMethod, { email: paymentMethod === 'mpesa' ? undefined : accountValue, phone: paymentMethod === 'mpesa' ? accountValue : undefined }) && _jsx("p", { className: "alert alert-error", children: validateProviderInput(paymentMethod, { email: paymentMethod === 'mpesa' ? undefined : accountValue, phone: paymentMethod === 'mpesa' ? accountValue : undefined }) })] }), verificationStep === 'payment' && _jsxs("div", { className: "space-y-5", children: [_jsx("h3", { className: "font-display text-xl", children: "Review your verification payment" }), _jsxs("dl", { className: "divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] px-4", children: [_jsxs("div", { className: "flex justify-between gap-4 py-3", children: [_jsx("dt", { className: "text-[var(--text-muted)]", children: "Account label" }), _jsx("dd", { className: "min-w-0 break-words text-right font-semibold", children: accountLabel })] }), _jsxs("div", { className: "flex justify-between gap-4 py-3", children: [_jsx("dt", { className: "text-[var(--text-muted)]", children: "Payment account" }), _jsx("dd", { className: "min-w-0 break-all text-right", children: accountValue })] }), _jsxs("div", { className: "flex items-center justify-between gap-4 py-4", children: [_jsx("dt", { className: "font-semibold", children: "Activation fee" }), _jsx("dd", { className: "text-right font-bold", children: paymentMethod === 'mpesa' ? formatCurrency(verificationAmounts.amountKes, 'KES') : formatCurrency(verificationAmounts.amountUsd, 'USD') })] })] }), _jsxs("p", { className: "text-sm text-[var(--text-muted)]", children: [paymentMethod === 'mpesa' ? 'Approve the prompt on your phone.' : 'Complete checkout with your payment provider.', " Your verification payment will then be reviewed by an admin."] }), message && _jsx("div", { className: "alert alert-success", children: message }), checkoutUrl && _jsx("a", { className: "btn-secondary block text-center py-3 rounded-lg font-semibold", href: checkoutUrl, target: "_blank", rel: "noreferrer", children: getCheckoutLabel(paymentMethod) }), error && _jsx("div", { className: "alert alert-error", children: error }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg text-lg disabled:opacity-60", children: submitting ? 'Starting verification...' : `Pay ${paymentMethod === 'mpesa' ? formatCurrency(verificationAmounts.amountKes, 'KES') : formatCurrency(verificationAmounts.amountUsd, 'USD')} and verify` })] }), verificationStep === 'result' && _jsxs("div", { className: "space-y-4", children: [verificationPaymentId && verificationPaymentStatus && _jsx(PaymentProgress, { kind: "verification", provider: paymentMethod, status: verificationPaymentStatus, onRetry: resetVerificationPayment }), message && _jsx("div", { className: "alert alert-success", children: message }), error && _jsx("div", { className: "alert alert-error", children: error })] })] }), _jsx("p", { className: `mt-6 text-xs text-center ${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'}`, children: "Your payment is secured and encrypted. Only the displayed activation and verification amount is charged." }), _jsxs("p", { className: "mt-3 text-xs text-center", style: { color: 'var(--text-muted)' }, children: ["Questions about a charge? Read the ", _jsx(Link, { to: "/about#refunds", className: "text-brand-600 dark:text-brand-300 font-semibold hover:underline", children: "refund policy" }), " or ", _jsx(Link, { to: "/contact", className: "text-brand-600 dark:text-brand-300 font-semibold hover:underline", children: "contact support" }), "."] })] })] })] })] }));
}
//# sourceMappingURL=Deposit.js.map