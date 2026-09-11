import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { FaPaypal } from 'react-icons/fa6';
import { ChevronDown, CreditCard, ShieldCheck, Smartphone } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { createPackagePayment, createVerificationPayment, startPackagePayment, type PackagePaymentProvider } from '../lib/paymentsApi';
import { createPackageIdempotencyKey, type PaidPackageTier } from '../lib/packageCheckout';
import { VERIFICATION_KES, VERIFICATION_USD } from '../lib/paymentConstants';
import { PaymentMethod } from '../lib/paymentTypes';
import PaymentProviderTabs, { PaymentProviderId } from '../components/ui/PaymentProviderTabs';

const TIERS = [
  {
    name: 'Free',
    tier: 'free' as const,
    price: 0,
    benefits: ['Basic tasks', '5 tasks/month', 'Mobile only'],
    color: 'border-stone-300',
  },
  {
    name: 'Pro',
    tier: 'pro' as const,
    price: 45,
    benefits: ['Academic tasks', '50 tasks per period', 'Desktop + Mobile', 'Priority support', '3-month access'],
    color: 'border-navy-300',
    recommended: true,
  },
  {
    name: 'Elite',
    tier: 'elite' as const,
    price: 120,
    benefits: ['All tasks', 'Unlimited tasks', 'High-priority access', '24/7 support', '3-month access'],
    color: 'border-[#F5A623]',
  },
];

const PAYMENT_BRANDS = {
  paystack: { label: 'Paystack', Icon: CreditCard, className: 'text-brand-600 dark:text-brand-300' },
  paypal: { label: 'PayPal', Icon: FaPaypal, className: 'text-blue-600' },
  palpluss: { label: 'PalPluss', Icon: Smartphone, className: 'text-brand-600 dark:text-brand-300' },
} as const;

export default function DepositPage() {
  const { theme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const [paymentMethod, setPaymentMethod] = useState<PaymentProviderId>('paystack');
  const [accountValue, setAccountValue] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [selectedTier, setSelectedTier] = useState('Free');
  const [packageMessage, setPackageMessage] = useState('');
  const [packageProvider, setPackageProvider] = useState<PaymentProviderId>('paystack');
  const [packagePhone, setPackagePhone] = useState('');
  const [packageEmail, setPackageEmail] = useState('');
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

  function handleTierSelect(tierName: string, price: number) {
    setSelectedTier(tierName);
    setPackageOpen(true);
    if (price === 0) {
      setPackageMessage('You are already on the Free plan. Choose a paid tier to begin an upgrade flow.');
      return;
    }
    setPackageMessage(`${tierName} selected at $${price} for 3 months. Choose a provider below to continue.`);
    window.setTimeout(() => document.getElementById('package-payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  async function handlePackagePayment(e: React.FormEvent) {
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

    // Provider-specific validation
    if (packageProvider === 'palpluss' && !packagePhone.trim()) {
      setPackageError('Enter the phone number that should receive the PalPluss STK prompt.');
      return;
    }
    if (packageProvider === 'paystack' && !packageEmail.trim()) {
      setPackageError('Enter your email address for Paystack checkout.');
      return;
    }

    setPackageSubmitting(true);
    try {
      const created = await createPackagePayment({
        tier: tier as PaidPackageTier,
        provider: packageProvider as any,
        idempotencyKey: createPackageIdempotencyKey(tier as PaidPackageTier),
      });
      const started = await startPackagePayment({
        transactionId: created.transactionId,
        phone: packagePhone.trim() || undefined,
        email: packageEmail.trim() || undefined
      });
      setPackageCheckoutUrl(started.checkoutUrl || '');
      setPackageMessage(packageProvider === 'palpluss'
        ? 'STK prompt started. Complete it on your phone; your package activates after verified provider confirmation.'
        : 'Payment started. Complete checkout; your package activates after verified provider confirmation.');
    } catch (err) {
      setPackageError(err instanceof Error ? err.message : 'Unable to start package payment.');
    } finally {
      setPackageSubmitting(false);
    }
  }

  async function handleVerification(e: React.FormEvent) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start verification payment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="container pt-8">
        <h1 className="font-display text-2xl font-bold" data-aos="fade-down">Subscription & Deposits</h1>
      </div>

      <main className="container py-8">
        {/* Tiers */}
        <div id="packages" className="mb-12 scroll-mt-6" data-aos="fade-up">
          <h2 className="font-display text-2xl mb-6" data-aos="fade-down">Choose Your Tier</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier, index) => (
              <div
                key={tier.name}
                data-aos="fade-up"
                data-aos-delay={index * 90}
                className={`card relative animate-in border-2 ${tier.color} ${
                  theme === 'dark' ? 'bg-stone-800 border-opacity-50' : ''
                } ${tier.recommended ? 'md:scale-105 shadow-lg' : ''} ${selectedTier === tier.name ? 'ring-2 ring-brand-500' : ''}`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-4 bg-navy-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Recommended
                  </div>
                )}
                <h3 className="font-display text-xl mb-2">{tier.name}</h3>
                <p className="font-display text-3xl font-bold mb-1">${tier.price}</p>
                {tier.price > 0 && <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>for 3 months</p>}
                {tier.price === 0 && <div className="mb-4" />}
                <ul className="space-y-2 mb-6">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className={`text-sm ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                      ✓ {benefit}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleTierSelect(tier.name, tier.price)} className={`w-full btn-primary py-2 rounded-lg font-semibold transition-all ${
                  tier.recommended ? 'bg-navy-700 text-white hover:bg-navy-800' : ''
                }`}>
                  {tier.price === 0 ? 'Current Plan' : selectedTier === tier.name ? 'Selected' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
          {packageMessage && <div className="alert alert-info mt-6" data-aos="fade-in">{packageMessage}</div>}
        </div>

        <section className={`card max-w-2xl mx-auto mb-10 scroll-mt-6 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`} data-aos="fade-up">
          <button
            id="package-payment-toggle"
            type="button"
            aria-expanded={packageOpen}
            aria-controls="package-payment-form"
            onClick={() => setPackageOpen((open) => !open)}
            className="w-full flex items-center justify-between gap-4 text-left"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"><CreditCard size={20} aria-hidden="true" /></span>
              <span><span className="block font-display text-2xl">Pay for your package</span><span className="block text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Upgrade from Free to Pro or Elite</span></span>
            </span>
            <span className="flex items-center gap-2 shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300"><span className="hidden sm:inline">{packageOpen ? 'Hide' : 'Show'}</span><ChevronDown size={20} aria-hidden="true" className={`transition-transform duration-300 ${packageOpen ? 'rotate-180' : ''}`} /></span>
          </button>

          <form id="package-payment-form" aria-hidden={!packageOpen} onSubmit={handlePackagePayment} className={`mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${packageOpen ? 'max-h-[1200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`}>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Package changes are available from Free tier only. Payment remains pending until the provider callback is verified.</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-3">Payment provider</label>
              <PaymentProviderTabs
                selectedValue={packageProvider}
                onChange={setPackageProvider}
              />
            </div>

            {packageProvider === 'palpluss' && (
              <label className="block text-sm font-semibold">
                M-Pesa phone number
                <input className="input-field w-full mt-2" value={packagePhone} onChange={(e) => setPackagePhone(e.target.value)} placeholder="+254 7XX XXX XXX" autoComplete="tel" />
              </label>
            )}

            {packageProvider === 'paystack' && (
              <label className="block text-sm font-semibold">
                Email address
                <input className="input-field w-full mt-2" value={packageEmail} onChange={(e) => setPackageEmail(e.target.value)} placeholder="email@example.com" autoComplete="email" />
              </label>
            )}

            {packageCheckoutUrl && (
              <a className="btn-secondary block text-center py-3 rounded-lg font-semibold" href={packageCheckoutUrl} target="_blank" rel="noreferrer">
                Continue to checkout
              </a>
            )}
            {packageError && <div className="alert alert-error">{packageError}</div>}
            <button disabled={packageSubmitting || selectedTier === 'Free'} className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-60">
              {packageSubmitting ? 'Starting package payment...' : selectedTier === 'Free' ? 'Choose a paid tier first' : `Pay $${TIERS.find((tier) => tier.name === selectedTier)?.price}`}
            </button>
          </div>
          </form>
        </section>

        {/* Deposit Section */}
        <section className={`card max-w-2xl mx-auto animate-in scroll-mt-6 ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`} data-aos="fade-up">
          <button
            id="verification-payment-toggle"
            type="button"
            aria-expanded={verificationOpen}
            aria-controls="payment-form"
            onClick={() => setVerificationOpen((open) => !open)}
            className="w-full flex items-center justify-between gap-4 text-left"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"><ShieldCheck size={20} aria-hidden="true" /></span>
              <span><span className="block font-display text-2xl">Verify payout account</span><span className="block text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Required before requesting withdrawals</span></span>
            </span>
            <span className="flex items-center gap-2 shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300"><span className="hidden sm:inline">{verificationOpen ? 'Hide' : 'Show'}</span><ChevronDown size={20} aria-hidden="true" className={`transition-transform duration-300 ${verificationOpen ? 'rotate-180' : ''}`} /></span>
          </button>

          <form id="payment-form" aria-hidden={!verificationOpen} onSubmit={handleVerification} className={`mt-6 overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${verificationOpen ? 'max-h-[1600px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`}>
          <h2 className="sr-only">Verify Your Payout Account</h2>
          <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`}>
            Pay exactly {formatCurrency(VERIFICATION_USD, 'USD')} ({formatCurrency(VERIFICATION_KES, 'KES')}) to verify ownership. The payment is held for admin review.
          </p>

          <div className="space-y-6">

            {/* Payment Method */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-stone-300' : ''}`}>
                Payment Method
              </label>
              <PaymentProviderTabs
                selectedValue={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Account label
                <input className="input-field w-full mt-2" value={accountLabel} onChange={(e) => setAccountLabel(e.target.value)} placeholder="My primary account" />
              </label>
              <label className="text-sm font-semibold">
                Account or phone
                <input
                  className="input-field w-full mt-2"
                  value={accountValue}
                  onChange={(e) => setAccountValue(e.target.value)}
                  placeholder={paymentMethod === 'palpluss' ? '+254 7XX XXX XXX' : paymentMethod === 'paypal' ? 'PayPal email address' : 'Paystack email address'}
                  autoComplete="off"
                />
              </label>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {checkoutUrl && (
              <a className="btn-secondary block text-center py-3 rounded-lg font-semibold" href={checkoutUrl} target="_blank" rel="noreferrer">
                Continue to PayPal
              </a>
            )}
            {error && <div className="alert alert-error">{error}</div>}

            {/* Submit */}
            <button disabled={submitting} className="w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg text-lg disabled:opacity-60">
              {submitting ? 'Starting verification...' : `Start verification for ${formatCurrency(VERIFICATION_USD, 'USD')}`}
            </button>

            <p className={`text-xs text-center ${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'}`}>
              Your payment is secured and encrypted. No additional fees.
            </p>
          </div>
          </form>
        </section>
      </main>
    </div>
  );
}
