import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import { Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
const MOCK_TRANSACTIONS = [
    {
        id: '1',
        userId: 'user1',
        type: 'task-reward',
        amount: 5,
        currency: 'USD',
        status: 'completed',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: 'Completed: Research Paper Proofreading',
    },
    {
        id: '2',
        userId: 'user1',
        type: 'task-reward',
        amount: 8,
        currency: 'USD',
        status: 'completed',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        description: 'Completed: RLHF Model Ranking',
    },
    {
        id: '3',
        userId: 'user1',
        type: 'deposit',
        amount: 50,
        currency: 'USD',
        status: 'completed',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        description: 'Deposit via Stripe',
    },
    {
        id: '4',
        userId: 'user1',
        type: 'withdrawal',
        amount: 30,
        currency: 'USD',
        status: 'completed',
        timestamp: new Date(Date.now() - 345600000).toISOString(),
        description: 'Withdrawal to Bank Account',
    },
];
export default function FinancialsPage() {
    const { theme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawalSubmitted, setWithdrawalSubmitted] = useState(false);
    const [error, setError] = useState('');
    const handleWithdrawal = (e) => {
        e.preventDefault();
        setError('');
        const amount = parseFloat(withdrawAmount);
        const MIN_WITHDRAWAL = 15;
        if (amount < MIN_WITHDRAWAL) {
            setError(`Minimum withdrawal is $${MIN_WITHDRAWAL}.00 USD`);
            return;
        }
        if (amount > (user?.balance || 0)) {
            setError('Insufficient balance');
            return;
        }
        setWithdrawalSubmitted(true);
        setWithdrawAmount('');
        setTimeout(() => setWithdrawalSubmitted(false), 3000);
    };
    return (_jsxs("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("div", { className: "container pt-8", children: _jsx("h1", { className: "font-display text-2xl font-bold", "data-aos": "fade-down", children: "Financials" }) }), _jsxs("main", { className: "container py-8", children: [_jsxs("div", { className: `card mb-8 animate-in ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-gradient-to-br from-sand-200 to-sand-300'}`, children: [_jsx("p", { className: `text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: "Available Balance" }), _jsx("h2", { className: "font-display text-4xl font-bold mb-6", children: formatCurrency(user?.balance || 0, 'USD') }), _jsxs("form", { onSubmit: handleWithdrawal, className: "space-y-4 pt-6 border-t border-opacity-20", children: [_jsx("h3", { className: "font-semibold mb-4", children: "Request Withdrawal" }), withdrawalSubmitted && (_jsx("div", { className: "alert alert-success", children: "Withdrawal request submitted! Processing..." })), error && _jsx("div", { className: "alert alert-error", children: error }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", placeholder: "Amount (min $15.00)", className: "input-field flex-1", value: withdrawAmount, onChange: (e) => setWithdrawAmount(e.target.value), min: "15", step: "0.01", required: true }), _jsx("button", { type: "submit", className: "btn-primary px-6 py-2 rounded-lg font-semibold", children: "Withdraw" })] }), _jsx("p", { className: `text-xs ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: "Minimum withdrawal: $15.00 USD. Processing typically takes 1-3 business days." })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "font-display text-2xl", children: "Transaction History" }), _jsxs("button", { className: "flex items-center gap-2 btn-secondary px-3 py-2 text-sm rounded-lg", children: [_jsx(Download, { size: 16 }), " Export CSV"] })] }), _jsx("div", { className: `overflow-x-auto ${theme === 'dark' ? 'bg-stone-800' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-stone-700' : 'border-sand-100'}`, children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: `border-b ${theme === 'dark' ? 'border-stone-700' : 'border-sand-100'}`, children: [_jsx("th", { className: "text-left px-6 py-4 font-semibold text-sm", children: "Date" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-sm", children: "Description" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-sm", children: "Type" }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-sm", children: "Amount" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-sm", children: "Status" })] }) }), _jsx("tbody", { children: MOCK_TRANSACTIONS.map((tx) => (_jsxs("tr", { className: `border-b animate-in ${theme === 'dark' ? 'border-stone-700 hover:bg-stone-700' : 'border-sand-100 hover:bg-sand-100'}`, children: [_jsx("td", { className: "px-6 py-4 text-sm", children: new Date(tx.timestamp).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 text-sm", children: tx.description }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${tx.type === 'deposit'
                                                                ? 'bg-green-100 text-green-800'
                                                                : tx.type === 'withdrawal'
                                                                    ? 'bg-orange-100 text-orange-800'
                                                                    : 'bg-blue-100 text-blue-800'}`, children: tx.type.charAt(0).toUpperCase() + tx.type.slice(1) }) }), _jsxs("td", { className: `px-6 py-4 text-sm text-right font-semibold ${tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`, children: [tx.type === 'withdrawal' ? '-' : '+', formatCurrency(tx.amount, tx.currency)] }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${tx.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : tx.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'}`, children: tx.status.charAt(0).toUpperCase() + tx.status.slice(1) }) })] }, tx.id))) })] }) })] })] })] }));
}
//# sourceMappingURL=Financials.js.map