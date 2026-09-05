import { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { CreditCard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { createVerificationPayment } from '../lib/paymentsApi';
import { VERIFICATION_KES, VERIFICATION_USD } from '../lib/paymentConstants';
import { PaymentMethod } from '../lib/paymentTypes';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
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
    setSubmitting(true);
    try {
      const result = await createVerificationPayment({ method: paymentMethod, accountLabel: accountLabel.trim(), accountValue: accountValue.trim() });
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
        <div className="mb-12">
          <h2 className="font-display text-2xl mb-6">Choose Your Tier</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`card relative animate-in border-2 ${tier.color} ${
                  theme === 'dark' ? 'bg-stone-800 border-opacity-50' : ''
                } ${tier.recommended ? 'md:scale-105 shadow-lg' : ''}`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-4 bg-navy-700 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Recommended
                  </div>
                )}
                <h3 className="font-display text-xl mb-2">{tier.name}</h3>
                <p className="font-display text-3xl font-bold mb-4">${tier.price}</p>
                <ul className="space-y-2 mb-6">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className={`text-sm ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                      ✓ {benefit}
                    </li>
                  ))}
                </ul>
                <button className={`w-full btn-primary py-2 rounded-lg font-semibold transition-all ${
                  tier.recommended ? 'bg-navy-700 text-white hover:bg-navy-800' : ''
                }`}>
                  {tier.price === 0 ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Deposit Section */}
        <form onSubmit={handleVerification} className={`card max-w-2xl mx-auto animate-in ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`}>
          <h2 className="font-display text-2xl mb-2">Verify Your Payout Account</h2>
          <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`}>
            Pay exactly {formatCurrency(VERIFICATION_USD, 'USD')} ({formatCurrency(VERIFICATION_KES, 'KES')}) to verify ownership. The payment is held for admin review.
          </p>

          <div className="space-y-6">

            {/* Payment Method */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-stone-300' : ''}`}>
                Payment Method
              </label>
              <div className="space-y-2">
                {(['stripe', 'paypal', 'mpesa'] as PaymentMethod[]).map((method) => (
                  <label key={method} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="w-4 h-4"
                    />
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} />
                      <span className="text-sm font-semibold capitalize">{method}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Account label
                <input className="input-field w-full mt-2" value={accountLabel} onChange={(e) => setAccountLabel(e.target.value)} placeholder="My primary account" />
              </label>
              <label className="text-sm font-semibold">
                Account or phone
                <input className="input-field w-full mt-2" value={accountValue} onChange={(e) => setAccountValue(e.target.value)} placeholder={accountPlaceholder} autoComplete="off" />
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
      </main>
    </div>
  );
}
