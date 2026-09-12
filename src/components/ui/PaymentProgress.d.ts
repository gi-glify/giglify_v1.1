import type { PaymentMethod } from '../../lib/paymentTypes';
import { type PaymentProgressKind } from '../../lib/paymentProgress';
type PaymentProgressProps = {
    kind: PaymentProgressKind;
    provider: PaymentMethod;
    status: string;
    onRetry?: () => void;
};
export default function PaymentProgress({ kind, provider, status, onRetry }: PaymentProgressProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=PaymentProgress.d.ts.map