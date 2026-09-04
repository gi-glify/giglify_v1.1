import { CurrencyRate } from '../types';
export declare const fetchExchangeRate: () => Promise<CurrencyRate>;
export declare const convertUSDtoKES: (usd: number, rate: number) => number;
export declare const convertKEStoUSD: (kes: number, rate: number) => number;
export declare const formatCurrency: (amount: number, currency: "USD" | "KES") => string;
//# sourceMappingURL=currency.d.ts.map