import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check } from 'lucide-react';
import { getPaymentProgressPercent, PAYMENT_WIZARD_STEPS } from '../../lib/paymentWizard';
const LABELS = {
    details: 'Details',
    provider: 'Provider',
    payment: 'Payment',
    result: 'Result',
};
export default function PaymentStepIndicator({ currentStep }) {
    const currentIndex = PAYMENT_WIZARD_STEPS.indexOf(currentStep);
    const progressPercent = getPaymentProgressPercent(currentStep);
    return _jsxs("ol", { className: "relative grid grid-cols-4 gap-2", "aria-label": "Payment steps", children: [_jsx("li", { className: "pointer-events-none absolute left-[12.5%] right-[12.5%] top-3 z-0 h-0.5 -translate-y-1/2 rounded-full bg-current opacity-20", "aria-hidden": "true", children: _jsx("span", { className: "block h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out motion-reduce:transition-none", style: { width: `${progressPercent}%` } }) }), PAYMENT_WIZARD_STEPS.map((step, index) => {
                const complete = index < currentIndex;
                return _jsxs("li", { className: `relative text-center text-xs ${index <= currentIndex ? 'font-semibold text-brand-700 dark:text-brand-300' : 'opacity-55'}`, children: [_jsx("span", { className: `relative z-10 mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border bg-[var(--bg)] transition-[background-color,border-color,color,transform] duration-300 ${complete || index === currentIndex ? 'border-brand-600' : 'border-current'}`, children: complete ? _jsx(Check, { size: 14, "aria-hidden": "true" }) : index + 1 }), LABELS[step]] }, step);
            })] });
}
//# sourceMappingURL=PaymentStepIndicator.js.map