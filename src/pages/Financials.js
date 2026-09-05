import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import { Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { createPayoutRequest, fetchPaymentVerificationState } from '../lib/paymentsApi';
export default function FinancialsPage() {
    const { theme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const [transactions, setTransactions] = useState([]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawalSubmitted, setWithdrawalSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [paymentState, setPaymentState] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
    useEffect(() => {
        async function fetchTransactions() {
            try {
                // Implementation will fetch from Supabase `transactions` table
                // const { data } = await supabase.from('transactions').select('*').eq('userId', user?.id);
                // setTransactions(data || []);
            }
            catch (e) {
                console.error("Failed to fetch transactions", e);
            }
        }
        fetchTransactions();
        if (user?.id) {
            fetchPaymentVerificationState(user.id)
                .then((state) => {
                setPaymentState(state);
                setSelectedAccountId(state.accounts.find((account) => account.isPrimary && account.status === 'verified')?.id || '');
            })
                .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load payout verification status.'));
        }
    }, [user]);
    const handleWithdrawal = async (e) => {
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
        if (paymentState?.status !== 'verified') {
            setError('Verify a payout account before requesting a withdrawal.');
            return;
        }
        if (!selectedAccountId) {
            setError('Select a verified payout account.');
            return;
        }
        setSubmittingWithdrawal(true);
        try {
            await createPayoutRequest({ amount, payoutAccountId: selectedAccountId });
            setWithdrawalSubmitted(true);
            setWithdrawAmount('');
            setTimeout(() => setWithdrawalSubmitted(false), 3000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to submit withdrawal request.');
        }
        finally {
            setSubmittingWithdrawal(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("div", { className: "container pt-8", children: _jsx("h1", { className: "font-display text-2xl font-bold", "data-aos": "fade-down", children: "Financials" }) }), _jsxs("main", { className: "container py-8", children: [_jsxs("div", { className: `card mb-8 animate-in ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-gradient-to-br from-sand-200 to-sand-300'}`, children: [_jsx("p", { className: `text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: "Available Balance" }), _jsx("h2", { className: "font-display text-4xl font-bold mb-6", children: formatCurrency(user?.balance || 0, 'USD') }), _jsxs("form", { onSubmit: handleWithdrawal, className: "space-y-4 pt-6 border-t border-opacity-20", children: [_jsx("h3", { className: "font-semibold mb-4", children: "Request Withdrawal" }), withdrawalSubmitted && (_jsx("div", { className: "alert alert-success", children: "Withdrawal request submitted! Processing..." })), error && _jsx("div", { className: "alert alert-error", children: error }), paymentState?.status !== 'verified' && (_jsx("div", { className: "alert alert-warning", children: "Payouts are locked until your verification payment is approved by an administrator." })), paymentState?.status === 'verified' && (_jsxs("label", { className: "block text-sm font-semibold", children: ["Payout account", _jsxs("select", { className: "input-field w-full mt-2", value: selectedAccountId, onChange: (e) => setSelectedAccountId(e.target.value), required: true, children: [_jsx("option", { value: "", children: "Select a verified account" }), paymentState.accounts.filter((account) => account.status === 'verified').map((account) => (_jsxs("option", { value: account.id, children: [account.accountLabel, " (", account.method, ")"] }, account.id)))] })] })), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", placeholder: "Amount (min $15.00)", className: "input-field flex-1", value: withdrawAmount, onChange: (e) => setWithdrawAmount(e.target.value), min: "15", step: "0.01", required: true }), _jsx("button", { type: "submit", disabled: submittingWithdrawal || paymentState?.status !== 'verified', className: "btn-primary px-6 py-2 rounded-lg font-semibold disabled:opacity-60", children: submittingWithdrawal ? 'Submitting...' : 'Withdraw' })] }), _jsx("p", { className: `text-xs ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: "Minimum withdrawal: $15.00 USD. Processing typically takes 1-3 business days." })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "font-display text-2xl", children: "Transaction History" }), _jsxs("button", { className: "flex items-center gap-2 btn-secondary px-3 py-2 text-sm rounded-lg", children: [_jsx(Download, { size: 16 }), " Export CSV"] })] }), _jsx("div", { className: `overflow-x-auto ${theme === 'dark' ? 'bg-stone-800' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-stone-700' : 'border-sand-100'}`, children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: `border-b ${theme === 'dark' ? 'border-stone-700' : 'border-sand-100'}`, children: [_jsx("th", { className: "text-left px-6 py-4 font-semibold text-sm", children: "Date" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-sm", children: "Description" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-sm", children: "Type" }), _jsx("th", { className: "text-right px-6 py-4 font-semibold text-sm", children: "Amount" }), _jsx("th", { className: "text-left px-6 py-4 font-semibold text-sm", children: "Status" })] }) }), _jsx("tbody", { children: transactions.map((tx) => (_jsxs("tr", { className: `border-b animate-in ${theme === 'dark' ? 'border-stone-700 hover:bg-stone-700' : 'border-sand-100 hover:bg-sand-100'}`, children: [_jsx("td", { className: "px-6 py-4 text-sm", children: new Date(tx.timestamp).toLocaleDateString() }), _jsx("td", { className: "px-6 py-4 text-sm", children: tx.description }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${tx.type === 'deposit'
                                                                ? 'bg-green-100 text-green-800'
                                                                : tx.type === 'withdrawal'
                                                                    ? 'bg-orange-100 text-orange-800'
                                                                    : 'bg-navy-100 text-navy-800'}`, children: tx.type.charAt(0).toUpperCase() + tx.type.slice(1) }) }), _jsxs("td", { className: `px-6 py-4 text-sm text-right font-semibold ${tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`, children: [tx.type === 'withdrawal' ? '-' : '+', formatCurrency(tx.amount, tx.currency)] }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${tx.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : tx.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'}`, children: tx.status.charAt(0).toUpperCase() + tx.status.slice(1) }) })] }, tx.id))) })] }) })] })] })] }));
}
//# sourceMappingURL=Financials.js.map