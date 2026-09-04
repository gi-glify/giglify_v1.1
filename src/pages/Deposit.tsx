import { useState, useEffect } from 'react';
import { fetchExchangeRate, convertUSDtoKES, formatCurrency } from '../utils/currency';
import { CurrencyRate } from '../types';
import { CreditCard } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState<'USD' | 'KES'>('USD');
  const [exchangeRate, setExchangeRate] = useState<CurrencyRate | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'mpesa'>('stripe');

  useEffect(() => {
    const loadExchangeRate = async () => {
      const rate = await fetchExchangeRate();
      setExchangeRate(rate);
    };
    loadExchangeRate();
  }, []);

  const convertedAmount = exchangeRate
    ? currency === 'USD'
      ? convertUSDtoKES(parseFloat(amount), exchangeRate.rate)
      : parseFloat(amount)
    : parseFloat(amount);

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
        <div className={`card max-w-2xl mx-auto animate-in ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`}>
          <h2 className="font-display text-2xl mb-6">Make a Deposit</h2>

          <div className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-stone-300' : ''}`}>
                Amount
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field w-full"
                    min="1"
                  />
                  <span className="absolute right-3 top-3 text-sm font-semibold">{currency}</span>
                </div>
                <button
                  onClick={() => setCurrency(currency === 'USD' ? 'KES' : 'USD')}
                  className="btn-secondary px-4"
                >
                  Switch
                </button>
              </div>
              {exchangeRate && (
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                  {currency === 'USD' ? 'KES ' : 'USD '}{formatCurrency(convertedAmount, currency === 'USD' ? 'KES' : 'USD')}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-stone-300' : ''}`}>
                Payment Method
              </label>
              <div className="space-y-2">
                {['stripe', 'paypal', 'mpesa'].map((method) => (
                  <label key={method} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method as any}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
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

            {/* Submit */}
            <button className="w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg text-lg">
              Deposit {formatCurrency(parseFloat(amount), currency)}
            </button>

            <p className={`text-xs text-center ${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'}`}>
              Your payment is secured and encrypted. No additional fees.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
