export type PaymentMethod = 'mpesa' | 'paypal' | 'stripe';

export type PaymentVerificationStatus =
  | 'unverified'
  | 'deposit_pending'
  | 'verified'
  | 'rejected';

export type VerificationDepositStatus =
  | 'created'
  | 'pending'
  | 'held'
  | 'verified'
  | 'failed'
  | 'refunded';

export type PayoutAccountStatus = 'pending' | 'verified' | 'rejected' | 'disabled';

export type PayoutRequestStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'cancelled';
