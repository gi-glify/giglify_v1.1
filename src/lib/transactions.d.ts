import type { Transaction } from '../types';
export type TransactionRow = {
    id: string;
    user_id: string;
    tuid?: string | null;
    transaction_type?: string | null;
    provider?: string | null;
    amount: number | string;
    currency: string;
    status: string;
    user_message?: string | null;
    created_at: string;
};
export declare function mapTransactionRow(row: TransactionRow): Transaction & {
    tuid: string;
    provider: string;
};
export declare function transactionsToCsv(rows: Array<Transaction & {
    tuid?: string;
    provider?: string;
}>): string;
//# sourceMappingURL=transactions.d.ts.map