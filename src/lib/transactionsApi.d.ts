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
export type TransactionFilter = 'all' | 'pending' | 'completed' | 'failed';
export declare function mapTransactionRow(row: TransactionRow): Transaction & {
    tuid: string;
    provider: string;
};
export declare function fetchUserTransactions(userId: string, page?: number, pageSize?: number, filter?: TransactionFilter): Promise<{
    rows: (Transaction & {
        tuid: string;
        provider: string;
    })[];
    hasMore: boolean;
}>;
export declare function transactionsToCsv(rows: Array<Transaction & {
    tuid?: string;
    provider?: string;
}>): string;
//# sourceMappingURL=transactionsApi.d.ts.map