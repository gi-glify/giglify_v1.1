import type { PaymentMethod } from '../../lib/paymentTypes';
import { type PaymentProgressKind } from '../../lib/paymentProgress';
type PaymentProgressProps = {
    kind: PaymentProgressKind;
    provider: PaymentMethod;
    status: string;
};
export default function PaymentProgress({ kind, provider, status }: PaymentProgressProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=PaymentProgress.d.ts.map