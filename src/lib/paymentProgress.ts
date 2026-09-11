import type { PaymentMethod } from './paymentTypes';

export type PaymentProgressKind = 'package' | 'verification';
export type PaymentProgressPhase = 'starting' | 'awaiting_confirmation' | 'review' | 'complete' | 'failed' | 'cancelled';

export type PaymentProgress = {
  phase: PaymentProgressPhase;
  label: string;
  description: string;
  terminal: boolean;
};

const TERMINAL_STATUSES = new Set(['success', 'completed', 'verified', 'held', 'failed', 'cancelled', 'expired', 'refunded']);

export function isPaymentProgressTerminal(status: string | null | undefined) {
  return TERMINAL_STATUSES.has(status || '');
}

export function getPaymentProgress(
  status: string | null | undefined,
  kind: PaymentProgressKind,
  provider: PaymentMethod,
): PaymentProgress {
  if (status === 'failed' || status === 'expired') {
    return {
      phase: 'failed',
      label: 'Payment was not completed',
      description: 'The provider did not confirm this payment. You can start a new attempt when you are ready.',
      terminal: true,
    };
  }

  if (status === 'cancelled') {
    return {
      phase: 'cancelled',
      label: 'Payment cancelled',
      description: 'No funds were applied. Start a new payment attempt if you still want to continue.',
      terminal: true,
    };
  }

  if (kind === 'verification' && status === 'held') {
    return {
      phase: 'review',
      label: 'Payment received — awaiting admin review',
      description: 'Your verification payment was received and is now held for the normal admin-review flow.',
      terminal: true,
    };
  }

  if (status === 'verified' || status === 'success' || status === 'completed') {
    return {
      phase: 'complete',
      label: kind === 'package' ? 'Package payment confirmed' : 'Payout account verified',
      description: kind === 'package' ? 'Your package access will update automatically.' : 'Your payout account is ready for withdrawals.',
      terminal: true,
    };
  }

  if (status === 'pending' || status === 'processing') {
    return {
      phase: 'awaiting_confirmation',
      label: provider === 'mpesa' ? 'Waiting for M-Pesa confirmation' : 'Waiting for provider confirmation',
      description: provider === 'mpesa'
        ? 'Check your phone and approve the STK prompt. Your payment will update automatically after provider confirmation.'
        : 'Complete the provider checkout. This page will update automatically after confirmation.',
      terminal: false,
    };
  }

  return {
    phase: 'starting',
    label: 'Payment started',
    description: 'We are preparing your provider payment. Keep this page open while it starts.',
    terminal: false,
  };
}
