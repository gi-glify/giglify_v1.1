import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check } from 'lucide-react';
import { PAYMENT_WIZARD_STEPS } from '../../lib/paymentWizard';
const LABELS = {
    details: 'Details',
    provider: 'Provider',
    payment: 'Payment',
    result: 'Result',
};
export default function PaymentStepIndicator({ currentStep }) {
    const currentIndex = PAYMENT_WIZARD_STEPS.indexOf(currentStep);
    return _jsx("ol", { className: "grid grid-cols-4 gap-2", "aria-label": "Payment steps", children: PAYMENT_WIZARD_STEPS.map((step, index) => {
            const complete = index < currentIndex;
            return _jsxs("li", { className: `relative text-center text-xs ${index <= currentIndex ? 'font-semibold text-brand-700 dark:text-brand-300' : 'opacity-55'}`, children: [index < PAYMENT_WIZARD_STEPS.length - 1 && _jsx("span", { className: `absolute left-1/2 right-[-50%] top-3 -z-0 h-px ${complete ? 'bg-brand-600' : 'bg-current opacity-30'}`, "aria-hidden": "true" }), _jsx("span", { className: `relative z-10 mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border bg-[var(--bg)] ${complete || index === currentIndex ? 'border-brand-600' : 'border-current'}`, children: complete ? _jsx(Check, { size: 14, "aria-hidden": "true" }) : index + 1 }), LABELS[step]] }, step);
        }) });
}
//# sourceMappingURL=PaymentStepIndicator.js.map