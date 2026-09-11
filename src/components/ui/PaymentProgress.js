import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { getPaymentProgress } from '../../lib/paymentProgress';
const STEPS = [
    { phase: 'starting', label: 'Payment created' },
    { phase: 'awaiting_confirmation', label: 'Provider confirmation' },
    { phase: 'review', label: 'Review or activation' },
];
export default function PaymentProgress({ kind, provider, status }) {
    const progress = getPaymentProgress(status, kind, provider);
    const failed = progress.phase === 'failed' || progress.phase === 'cancelled';
    const currentIndex = progress.phase === 'complete' || progress.phase === 'review'
        ? STEPS.length - 1
        : progress.phase === 'awaiting_confirmation'
            ? 1
            : 0;
    return (_jsxs("section", { className: `rounded-xl border p-4 ${failed ? 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20' : 'border-brand-200 bg-brand-50/60 dark:border-brand-900/60 dark:bg-brand-950/20'}`, "aria-live": "polite", "data-payment-progress": kind, children: [_jsxs("div", { className: "flex items-start gap-3", children: [failed ? _jsx(AlertCircle, { className: "mt-0.5 shrink-0 text-red-600", size: 20, "aria-hidden": "true" }) : progress.terminal ? _jsx(Check, { className: "mt-0.5 shrink-0 text-emerald-600", size: 20, "aria-hidden": "true" }) : _jsx(Loader2, { className: "mt-0.5 shrink-0 animate-spin text-brand-600", size: 20, "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: progress.label }), _jsx("p", { className: "mt-1 text-sm", style: { color: 'var(--text-muted)' }, children: progress.description })] })] }), _jsx("ol", { className: "mt-4 grid grid-cols-3 gap-2", "aria-label": "Payment progress", children: STEPS.map((step, index) => {
                    const complete = index < currentIndex || (index === currentIndex && (progress.phase === 'review' || progress.phase === 'complete'));
                    return _jsxs("li", { className: `text-center text-xs ${complete ? 'font-semibold text-brand-700 dark:text-brand-300' : index === currentIndex && !failed ? 'font-semibold' : 'opacity-55'}`, children: [_jsx("span", { className: `mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border ${complete ? 'border-brand-600 bg-brand-600 text-white' : 'border-current'}`, children: complete ? _jsx(Check, { size: 14, "aria-hidden": "true" }) : index + 1 }), step.label] }, step.phase);
                }) })] }));
}
//# sourceMappingURL=PaymentProgress.js.map