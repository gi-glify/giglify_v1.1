# Payment Schema

The payment model is split into four records with separate lifecycles:

- `payout_accounts` stores one user-owned payout destination per provider fingerprint. Partial unique indexes enforce one active primary account and one verified account per user.
- `verification_deposits` stores the fixed `$3.00` / `KSh373.50` verification attempt, the historical exchange rate, provider reference, and provider status.
- `payout_requests` stores a user’s manual request. The application prepares the request; an admin/client marks it paid after an external payout.
- `payment_audit_logs` stores immutable actor, entity, status-transition, and provider-event metadata.

`profiles.payment_verification_status` is changed only by trusted server-side payment code. The existing self-profile update path is protected by a trigger from changing payment status or `is_admin`.

Users can read only their own payment records. Admin review access must be granted through the server-side admin function and the `profiles.is_admin` role check.
