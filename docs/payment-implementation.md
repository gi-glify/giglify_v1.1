# Payment Implementation Notes

## Provider Configuration

Payment secrets must be configured as Supabase Edge Function secrets. They must not be placed in `VITE_*` variables or sent from the browser.

- Stripe: `STRIPE_SECRET_KEY`
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, optional `PAYPAL_BASE_URL`
- M-Pesa: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`, optional `MPESA_BASE_URL`
- Webhooks: `PAYMENT_WEBHOOK_SECRET`

The current webhook endpoint expects the provider adapter or gateway relay to normalize callbacks into a signed request at `/functions/v1/payment-webhook?provider=<provider>`. The body must include `eventId`, `eventType`, `entityType`, `entityId`, and an allowed `status`. Duplicate event IDs are accepted without reapplying state.

## M-Pesa Amount Limitation

The product verification amount is exactly `$3.00`, displayed as `KSh373.50` at the fixed rate `124.50`. M-Pesa STK Push accepts whole-shilling amounts, so the current adapter requests `KSh374`; this must be approved as a product decision or M-Pesa verification must remain disabled until a whole-shilling amount is selected.

## Rollout

1. Apply `supabase/migrations/20260905100000_payment_verification.sql`.
2. Set provider secrets in the Supabase project.
3. Deploy the four payment functions from `supabase/functions`.
4. Configure Stripe, PayPal, and M-Pesa callbacks through the signed webhook relay.
5. Test verification in sandbox mode before enabling production credentials.
