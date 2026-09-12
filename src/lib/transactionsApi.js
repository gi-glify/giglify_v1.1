import { supabase } from '../utils/supabase.js';
function displayType(type) {
    if (type === 'withdrawal')
        return 'withdrawal';
    if (type === 'package_purchase' || type === 'verification_deposit' || type === 'deposit')
        return 'deposit';
    return 'task-reward';
}
function displayStatus(status) {
    if (['success', 'completed'].includes(status))
        return 'completed';
    if (['failed', 'cancelled', 'expired', 'refunded'].includes(status))
        return 'failed';
    return 'pending';
}
export function mapTransactionRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        tuid: row.tuid || row.id,
        provider: row.provider || 'internal',
        type: displayType(row.transaction_type),
        amount: Number(row.amount),
        currency: row.currency === 'KES' ? 'KES' : 'USD',
        status: displayStatus(row.status),
        timestamp: row.created_at,
        description: row.user_message || row.transaction_type?.split('_').join(' ') || 'Transaction',
    };
}
export async function fetchUserTransactions(userId, page = 0, pageSize = 20, filter = 'all') {
    const from = page * pageSize;
    const to = from + pageSize;
    let query = supabase
        .from('transactions')
        .select('id, user_id, tuid, transaction_type, provider, amount, currency, status, user_message, created_at', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);
    if (filter === 'pending')
        query = query.in('status', ['created', 'pending', 'processing', 'verification_required']);
    if (filter === 'completed')
        query = query.in('status', ['success', 'completed']);
    if (filter === 'failed')
        query = query.in('status', ['failed', 'cancelled', 'expired', 'refunded']);
    const { data, error, count } = await query;
    if (error)
        throw error;
    return { rows: (data || []).map((row) => mapTransactionRow(row)), hasMore: (count || 0) > to + 1 };
}
function csvCell(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.split('"').join('""')}"` : text;
}
export function transactionsToCsv(rows) {
    const header = ['Date', 'TUID', 'Description', 'Type', 'Provider', 'Amount', 'Currency', 'Status'];
    const lines = rows.map((row) => [row.timestamp, row.tuid || row.id, row.description, row.type, row.provider || 'internal', row.amount, row.currency, row.status].map(csvCell).join(','));
    return [header.join(','), ...lines].join('\n');
}
//# sourceMappingURL=transactionsApi.js.map