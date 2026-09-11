import React from 'react';
import { type PaymentProviderId } from '../../lib/paymentProviders';
export type { PaymentProviderId } from '../../lib/paymentProviders';
interface PaymentProviderTabsProps {
    selectedValue: PaymentProviderId | string;
    onChange: (value: PaymentProviderId) => void;
}
export default function PaymentProviderTabs({ selectedValue, onChange }: PaymentProviderTabsProps): React.JSX.Element;
//# sourceMappingURL=PaymentProviderTabs.d.ts.map