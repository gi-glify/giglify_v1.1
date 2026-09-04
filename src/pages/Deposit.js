import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { fetchExchangeRate, convertUSDtoKES, formatCurrency } from '../utils/currency';
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
        color: 'border-blue-300',
        recommended: true,
    },
    {
        name: 'Elite',
        price: 99,
        benefits: ['All tasks', 'Unlimited tasks', 'High-priority access', '24/7 support', 'Custom datasets'],
        color: 'border-purple-300',
    },
];
export default function DepositPage() {
    const { theme } = useTheme();
    const [amount, setAmount] = useState('100');
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('stripe');
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
    return (_jsxs("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("div", { className: "container pt-8", children: _jsx("h1", { className: "font-display text-2xl font-bold", "data-aos": "fade-down", children: "Subscription & Deposits" }) }), _jsxs("main", { className: "container py-8", children: [_jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "font-display text-2xl mb-6", children: "Choose Your Tier" }), _jsx("div", { className: "grid md:grid-cols-3 gap-6", children: TIERS.map((tier) => (_jsxs("div", { className: `card relative animate-in border-2 ${tier.color} ${theme === 'dark' ? 'bg-stone-800 border-opacity-50' : ''} ${tier.recommended ? 'md:scale-105 shadow-lg' : ''}`, children: [tier.recommended && (_jsx("div", { className: "absolute -top-3 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold", children: "Recommended" })), _jsx("h3", { className: "font-display text-xl mb-2", children: tier.name }), _jsxs("p", { className: "font-display text-3xl font-bold mb-4", children: ["$", tier.price] }), _jsx("ul", { className: "space-y-2 mb-6", children: tier.benefits.map((benefit) => (_jsxs("li", { className: `text-sm ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: ["\u2713 ", benefit] }, benefit))) }), _jsx("button", { className: `w-full btn-primary py-2 rounded-lg font-semibold transition-all ${tier.recommended ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}`, children: tier.price === 0 ? 'Current Plan' : 'Upgrade' })] }, tier.name))) })] }), _jsxs("div", { className: `card max-w-2xl mx-auto animate-in ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, children: [_jsx("h2", { className: "font-display text-2xl mb-6", children: "Make a Deposit" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: `block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-stone-300' : ''}`, children: "Amount" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx("input", { type: "number", value: amount, onChange: (e) => setAmount(e.target.value), className: "input-field w-full", min: "1" }), _jsx("span", { className: "absolute right-3 top-3 text-sm font-semibold", children: currency })] }), _jsx("button", { onClick: () => setCurrency(currency === 'USD' ? 'KES' : 'USD'), className: "btn-secondary px-4", children: "Switch" })] }), exchangeRate && (_jsxs("p", { className: `text-xs mt-2 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: [currency === 'USD' ? 'KES ' : 'USD ', formatCurrency(convertedAmount, currency === 'USD' ? 'KES' : 'USD')] }))] }), _jsxs("div", { children: [_jsx("label", { className: `block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-stone-300' : ''}`, children: "Payment Method" }), _jsx("div", { className: "space-y-2", children: ['stripe', 'paypal', 'mpesa'].map((method) => (_jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "radio", name: "payment", value: method, checked: paymentMethod === method, onChange: (e) => setPaymentMethod(e.target.value), className: "w-4 h-4" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CreditCard, { size: 16 }), _jsx("span", { className: "text-sm font-semibold capitalize", children: method })] })] }, method))) })] }), _jsxs("button", { className: "w-full btn-primary py-3 rounded-lg font-semibold hover:shadow-lg text-lg", children: ["Deposit ", formatCurrency(parseFloat(amount), currency)] }), _jsx("p", { className: `text-xs text-center ${theme === 'dark' ? 'text-stone-500' : 'text-stone-600'}`, children: "Your payment is secured and encrypted. No additional fees." })] })] })] })] }));
}
//# sourceMappingURL=Deposit.js.map