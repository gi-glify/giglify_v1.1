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

function displayType(type: string | null | undefined): Transaction['type'] {
  if (type === 'withdrawal') return 'withdrawal';
  if (type === 'package_purchase' || type === 'verification_deposit' || type === 'deposit') return 'deposit';
  return 'task-reward';
}

function displayStatus(status: string): Transaction['status'] {
  if (['success', 'completed'].includes(status)) return 'completed';
  if (['failed', 'cancelled', 'expired', 'refunded'].includes(status)) return 'failed';
  return 'pending';
}

export function mapTransactionRow(row: TransactionRow): Transaction & { tuid: string; provider: string } {
  return { id: row.id, userId: row.user_id, tuid: row.tuid || row.id, provider: row.provider || 'internal', type: displayType(row.transaction_type), amount: Number(row.amount), currency: row.currency === 'KES' ? 'KES' : 'USD', status: displayStatus(row.status), timestamp: row.created_at, description: row.user_message || row.transaction_type?.split('_').join(' ') || 'Transaction' };
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.split('"').join('""')}"` : text;
}

export function transactionsToCsv(rows: Array<Transaction & { tuid?: string; provider?: string }>) {
  const header = ['Date', 'TUID', 'Description', 'Type', 'Provider', 'Amount', 'Currency', 'Status'];
  const lines = rows.map((row) => [row.timestamp, row.tuid || row.id, row.description, row.type, row.provider || 'internal', row.amount, row.currency, row.status].map(csvCell).join(','));
  return [header.join(','), ...lines].join('\n');
}
