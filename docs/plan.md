# Payment System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure payment-verification and admin-controlled payout system that supports a mandatory $3 verification deposit, one verified payout account per user, and auditable manual payouts.

**Architecture:** The browser only starts payment intents and displays status. Supabase Edge Functions hold gateway secrets, create provider sessions, receive and verify webhooks, and update payment state. PostgreSQL is the source of truth for verification, payout destinations, deposit events, audit events, and admin decisions; the client never marks a payment or user as verified.

**Tech Stack:** React 18, TypeScript, Vite, Supabase Postgres/RLS, Supabase Edge Functions/Deno, Stripe, PayPal, and M-Pesa Daraja.

**Spec:** `docs/payment.md`

## Global Constraints

- The verification amount is exactly `$3.00` or `KSh373.50` using the specified rate `$1 = KSh124.50`.
- Supported verification methods are M-Pesa, PayPal, and Stripe.
- Payouts are always initiated and managed by the client/admin; no automatic payout is allowed.
- A user may have only one verified work account and one verified payout account.
- Gateway credentials and webhook verification must run server-side in Supabase Edge Functions.
- Payment status changes must be idempotent and auditable.
- Never store raw card numbers, CVV values, PayPal credentials, or M-Pesa secrets in Postgres or browser storage.
- Existing profile/task behavior must continue working when payment verification is incomplete.

## Existing Code Map

- `src/pages/Deposit.tsx` is currently a presentation-only deposit form.
- `src/pages/Financials.tsx` displays a mock withdrawal flow and must become verification-aware.
- `src/utils/supabase.ts` owns the browser Supabase client and is the client boundary for Edge Function calls.
- `supabase/schema.sql` contains `profiles`, `transactions`, and `withdrawals`, but no gateway payment or admin-review model.
- `supabase/functions/ai-chat/index.ts` establishes the existing Edge Function layout.
- `src/pages/ProfileCompletion.tsx` collects payout and KYC fields but does not verify ownership.

## Data Model

Add these tables through migrations, keeping provider-specific response data in restricted JSONB columns:

```sql
profiles.payment_verification_status text not null default 'unverified'
  check (payment_verification_status in ('unverified', 'deposit_pending', 'verified', 'rejected'));
profiles.payment_verified_at timestamptz;

payout_accounts(
  id uuid primary key,
  user_id uuid not null references profiles(id),
  method text not null check (method in ('mpesa', 'paypal', 'stripe')),
  account_fingerprint text not null,
  account_label text not null,
  status text not null check (status in ('pending', 'verified', 'rejected', 'disabled')),
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

verification_deposits(
  id uuid primary key,
  user_id uuid not null references profiles(id),
  payout_account_id uuid references payout_accounts(id),
  method text not null check (method in ('mpesa', 'paypal', 'stripe')),
  amount_usd numeric(10,2) not null default 3.00,
  amount_kes numeric(10,2) not null default 373.50,
  exchange_rate numeric(10,2) not null default 124.50,
  provider_reference text unique,
  provider_payload jsonb,
  status text not null check (status in ('created', 'pending', 'held', 'verified', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

payout_requests(
  id uuid primary key,
  user_id uuid not null references profiles(id),
  payout_account_id uuid not null references payout_accounts(id),
  amount numeric(10,2) not null check (amount >= 15),
  status text not null check (status in ('requested', 'under_review', 'approved', 'paid', 'rejected', 'cancelled')),
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

payment_audit_logs(
  id uuid primary key,
  user_id uuid references profiles(id),
  actor_id uuid references auth.users(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
```

Enforce one primary payout account and one verified account per user with partial unique indexes. Enforce all status transitions through server-side functions or Edge Functions, not client updates.

## Implementation Tasks

### Task 1: Lock the payment contract

**Files:**
- Create: `src/lib/paymentTypes.ts`
- Create: `src/lib/paymentConstants.ts`
- Create: `test/paymentConstants.test.ts`
- Modify: `docs/payment.md`

**Interfaces:**
- Produce `VERIFICATION_USD = 3`, `KENYA_USD_RATE = 124.5`, `VERIFICATION_KES = 373.5`.
- Produce `PaymentMethod = 'mpesa' | 'paypal' | 'stripe'`.
- Produce `PaymentVerificationStatus = 'unverified' | 'deposit_pending' | 'verified' | 'rejected'`.

- [ ] Write a failing test that asserts `$3 * 124.50 = KSh373.50` and rejects unsupported methods.
- [ ] Run `node --experimental-strip-types --test test/paymentConstants.test.ts` and confirm it fails because the constants do not exist.
- [ ] Implement the constants and discriminated union types.
- [ ] Run the focused test and confirm it passes.
- [ ] Document the recommendation that the $3 is held/credited only after a verified provider event, never from a browser callback.

### Task 2: Add the payment and audit schema

**Files:**
- Create: `supabase/migrations/20260905100000_payment_verification.sql`
- Modify: `supabase/schema.sql`
- Create: `docs/payment-schema.md`

**Interfaces:**
- Produce tables `payout_accounts`, `verification_deposits`, `payout_requests`, and `payment_audit_logs`.
- Produce profile columns `payment_verification_status` and `payment_verified_at`.
- Produce indexes and constraints preventing duplicate primary/verified payout accounts.

- [ ] Write migration checks for columns, check constraints, unique indexes, and RLS policies.
- [ ] Run the migration against a local/staging Supabase database and inspect the resulting schema.
- [ ] Add RLS: users can read their own records; users can create a payout request; only Edge Functions/service role can mutate verification and audit state; admins can read/review records through an admin policy.
- [ ] Add an audit trigger or server helper that records every verification and payout status transition.
- [ ] Update `supabase/schema.sql` so a new installation includes the same model.
- [ ] Verify that a user cannot select or update another user’s payout account, deposit, or payout request.

### Task 3: Add secure Edge Function boundaries

**Files:**
- Create: `supabase/functions/create-verification-payment/index.ts`
- Create: `supabase/functions/payment-webhook/index.ts`
- Create: `supabase/functions/create-payout-request/index.ts`
- Create: `supabase/functions/admin-payment-action/index.ts`
- Create: `supabase/functions/_shared/payment.ts`
- Create: `supabase/functions/_shared/audit.ts`
- Create: `supabase/functions/_shared/auth.ts`

**Interfaces:**
- `create-verification-payment`: authenticated user plus method and payout destination; returns `{ depositId, checkoutUrl?, providerReference? }`.
- `payment-webhook`: provider-specific webhook request; returns a fast 2xx after idempotent processing.
- `create-payout-request`: authenticated user plus amount and verified account selection; returns `{ payoutRequestId, status }`.
- `admin-payment-action`: authenticated admin plus entity id, action, and note; returns the updated status.

- [ ] Write tests for unauthenticated requests, invalid amounts, unsupported methods, duplicate payout fingerprints, and non-owner account access.
- [ ] Implement shared auth and admin-role checks using server-side claims/table lookup.
- [ ] Implement idempotency using provider reference plus event type, rejecting duplicate webhook effects.
- [ ] Implement the verification state machine:

```text
unverified -> deposit_pending -> verified
unverified -> deposit_pending -> failed
unverified -> deposit_pending -> rejected
```

- [ ] Make webhook processing update the deposit, profile status, audit log, and transaction in one database transaction.
- [ ] Ensure no browser-supplied amount, status, reward, or verification flag is trusted.
- [ ] Deploy to a staging Supabase project and test logs without exposing secrets.

### Task 4: Integrate Stripe verification

**Files:**
- Modify: `supabase/functions/create-verification-payment/index.ts`
- Modify: `supabase/functions/payment-webhook/index.ts`
- Modify: `src/pages/Deposit.tsx`
- Create: `src/lib/stripePayment.ts`
- Create: `test/stripePayment.test.ts`

- [ ] Add a failing test for creating a fixed 300-cent Stripe payment and rejecting client-provided amounts.
- [ ] Create the Stripe PaymentIntent or Checkout Session server-side with metadata containing `user_id` and `deposit_id`.
- [ ] Verify Stripe signatures before accepting `payment_intent.succeeded` or equivalent events.
- [ ] Store only Stripe customer/payment-method fingerprints and provider references, never card data.
- [ ] Add the Stripe method to the deposit UI with redirect/return status handling.
- [ ] Test success, cancellation, duplicate webhook, invalid signature, and failed payment paths in Stripe test mode.

### Task 5: Integrate PayPal verification

**Files:**
- Modify: `supabase/functions/create-verification-payment/index.ts`
- Modify: `supabase/functions/payment-webhook/index.ts`
- Create: `src/lib/paypalPayment.ts`
- Create: `test/paypalPayment.test.ts`
- Modify: `src/pages/Deposit.tsx`

- [ ] Create a fixed-$3 PayPal order server-side and return the approval URL.
- [ ] Capture or verify the order only from the server after the user returns and after PayPal webhook validation.
- [ ] Validate order amount, currency, merchant account, and user/deposit metadata before marking it held or verified.
- [ ] Make capture/webhook processing idempotent.
- [ ] Test approval, cancellation, amount mismatch, duplicate event, and invalid webhook paths in sandbox mode.

### Task 6: Integrate M-Pesa verification

**Files:**
- Modify: `supabase/functions/create-verification-payment/index.ts`
- Modify: `supabase/functions/payment-webhook/index.ts`
- Create: `supabase/functions/mpesa-callback/index.ts`
- Create: `supabase/functions/_shared/mpesa.ts`
- Create: `test/mpesaPayment.test.ts`
- Modify: `src/pages/Deposit.tsx`

- [ ] Validate the Kenyan phone number server-side and normalize it to the provider format.
- [ ] Initiate an STK Push for exactly `KSh373.50`.
- [ ] Store the checkout request id and correlate the callback to the deposit/user.
- [ ] Validate callback result code, amount, receipt number, phone number, and merchant shortcode.
- [ ] Treat callback retries as safe and idempotent.
- [ ] Test success, timeout, user cancellation, callback mismatch, and duplicate callback paths in Daraja sandbox.

### Task 7: Build the user verification and payout UI

**Files:**
- Modify: `src/pages/Deposit.tsx`
- Modify: `src/pages/Financials.tsx`
- Modify: `src/pages/ProfileCompletion.tsx`
- Create: `src/components/payments/VerificationStatus.tsx`
- Create: `src/components/payments/PayoutAccountForm.tsx`
- Create: `src/components/payments/PaymentMethodSelector.tsx`
- Create: `src/lib/paymentsApi.ts`

**Interfaces:**
- `getPaymentVerificationStatus(): Promise<PaymentVerification>`.
- `createVerificationPayment(method, payoutDetails): Promise<PaymentStartResult>`.
- `createPayoutRequest(amount, payoutAccountId): Promise<PayoutRequest>`.

- [ ] Add a visible status stepper: `Unverified`, `Deposit pending`, `Verified`, or `Rejected`.
- [ ] Require the user to submit one payout account before starting verification.
- [ ] Display `$3.00 / KSh373.50`, the fixed exchange rate, selected method, and provider status.
- [ ] Disable payout requests until profile verification is `verified` and the account is the user’s verified primary account.
- [ ] Replace mock withdrawal submission with `createPayoutRequest` and show `requested/under_review` status.
- [ ] Never show raw provider payloads or sensitive account data in the UI.
- [ ] Add retry handling for failed payments without creating a second payout account.

### Task 8: Build the admin verification and payout page

**Files:**
- Create: `src/pages/AdminPayments.tsx`
- Create: `src/components/admin/PaymentReviewTable.tsx`
- Create: `src/components/admin/PaymentReviewPanel.tsx`
- Create: `src/lib/adminPaymentsApi.ts`
- Modify: `src/App.tsx`
- Modify: `src/config/navigation.ts`
- Modify: `supabase/functions/admin-payment-action/index.ts`

**Interfaces:**
- `listPendingPaymentReviews(filters): Promise<PaymentReview[]>`.
- `approveVerification(depositId, note): Promise<void>`.
- `rejectVerification(depositId, note): Promise<void>`.
- `markPayoutPaid(payoutRequestId, note): Promise<void>`.

- [ ] Add an admin-only route protected by server-side role checks, not only hidden navigation.
- [ ] Show user id, masked payout account, deposit method, amount, provider reference, timestamps, and audit history.
- [ ] Require a note for rejection and a confirmation for approval/payment actions.
- [ ] Add filters for `deposit_pending`, `verified`, `rejected`, `under_review`, and `paid`.
- [ ] Ensure every admin action writes actor id, timestamp, prior status, new status, and note to `payment_audit_logs`.
- [ ] Verify non-admin users receive an authorization error even if they call the function directly.

### Task 9: Enforce payout eligibility and account uniqueness

**Files:**
- Modify: `supabase/functions/create-payout-request/index.ts`
- Modify: `supabase/functions/admin-payment-action/index.ts`
- Modify: `supabase/schema.sql`
- Create: `test/payoutEligibility.test.ts`

- [ ] Write failing tests for unverified users, amounts below `$15`, non-primary accounts, duplicate fingerprints, and approved requests.
- [ ] Permit a payout only when the user is verified, the amount is at least `$15`, the account is verified/primary, and no conflicting request is active.
- [ ] Keep payout initiation manual; there must be no trigger or cron that sends money automatically.
- [ ] Allow admins to mark a request paid only after an external payout has occurred.
- [ ] Record the final client/admin payout reference and transaction audit entry.

### Task 10: Test, document, and roll out safely

**Files:**
- Create: `docs/payment-operations.md`
- Create: `docs/admin-payments.md`
- Modify: `docs/4-PAYMENT_SETUP.md`
- Modify: `README.md`
- Modify: `package.json`

- [ ] Add a `test` script: `node --experimental-strip-types --test test/*.test.ts`.
- [ ] Run unit tests for amount conversion, state transitions, idempotency, access control, and payload validation.
- [ ] Run `npm run build` and `git diff --check`.
- [ ] Configure separate Stripe, PayPal, and M-Pesa sandbox credentials for local/staging/production.
- [ ] Configure webhook URLs, signing secrets, retry policy, and alerting for failed callbacks.
- [ ] Run a staging checklist: new user, payout account creation, each gateway success/failure, duplicate webhook, admin approval/rejection, payout request, and audit inspection.
- [ ] Deploy database migrations before frontend code that depends on them.
- [ ] Release behind a feature flag or restricted pilot, monitor webhook failures and stuck `deposit_pending` records, then enable for all users.

## Recommended Decisions Before Implementation

1. Treat the `$3` as a verification charge/hold and credit it to the user’s withdrawable balance only after the provider confirms settlement or the business explicitly accepts an authorization-only result. A browser return page is never sufficient proof.
2. Use one canonical payout account record per user, with replacement requiring admin review and disabling the old account rather than deleting its audit history.
3. Store the Kenya rate on each deposit row so historical verification records do not change if the business later updates the rate.
4. Keep payout execution outside this application. The system should prepare a verified queue and record the client’s external payment reference after manual payment.
5. Use sandbox credentials and test webhooks before enabling any real gateway account.

## Coverage Check

- Mandatory `$3` deposit and Kenya conversion: Tasks 1, 3-6.
- M-Pesa, PayPal, and Stripe: Tasks 4-6.
- One work/payout account per user: Tasks 2, 7, and 9.
- Manual client-controlled payouts: Tasks 7 and 9.
- Verification states: Tasks 2, 3, and 7.
- Deposit, verification, payout audit logs: Tasks 2, 3, 8, and 9.
- Admin verification page: Task 8.
- Security and duplicate-account controls: Tasks 2, 3, and 9.
