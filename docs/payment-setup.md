# Giglify Payment Setup

This guide covers the payment verification flow and the provider configuration required before testing deposits or payouts. Payment secrets belong only in Supabase Edge Function secrets. Never add them to `.env`, `VITE_*` variables, the browser bundle, or the database.

## 1. Apply The Database

From the repository root:

```bash
supabase db push
```

The payment migration creates verification deposits, payout accounts, payout requests, audit logs, and provider event idempotency records.

## 2. Deploy The Functions

```bash
supabase functions deploy create-verification-payment
supabase functions deploy create-payout-request
supabase functions deploy admin-payment-action
supabase functions deploy payment-webhook
```

The browser calls the first two functions. The admin screen calls `admin-payment-action`. Gateway relays call `payment-webhook`.

## 3. Configure Supabase Secrets

The functions already receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Supabase. Set the provider values that you intend to test:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set PAYPAL_CLIENT_ID=xxx PAYPAL_CLIENT_SECRET=xxx PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
supabase secrets set MPESA_CONSUMER_KEY=xxx MPESA_CONSUMER_SECRET=xxx
supabase secrets set MPESA_SHORTCODE=174379 MPESA_PASSKEY=xxx
supabase secrets set MPESA_BASE_URL=https://sandbox.safaricom.co.ke
supabase secrets set MPESA_CALLBACK_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook?provider=mpesa
supabase secrets set PAYMENT_WEBHOOK_SECRET=use-a-long-random-secret
```

Do not set production values until the sandbox flow has passed.

## 4. M-Pesa STK Push

1. Create or access a Safaricom Daraja sandbox account.
2. Create an app and obtain the consumer key and consumer secret.
3. Use the sandbox shortcode and passkey supplied by Daraja. The common sandbox shortcode is `174379`, but use the values shown in your Daraja account.
4. Register the HTTPS callback URL from `MPESA_CALLBACK_URL`.
5. Select M-Pesa on `/deposit`, enter the payout phone number in international format, and start verification.
6. Accept the STK prompt on the sandbox phone.
7. Confirm the callback relay sends a signed normalized event to `payment-webhook`.

M-Pesa STK Push accepts whole shillings. The product displays the exact `$3.00` verification amount as `KSh373.50` using the fixed rate `124.50`; the current M-Pesa adapter requests `KSh374`. Approve this rounding decision before production use, or change the product amount to a whole shilling.

## 5. Stripe

1. Create a Stripe test account and obtain a test secret key.
2. Set `STRIPE_SECRET_KEY` with the `sk_test_` value.
3. Start verification with Stripe on `/deposit`.
4. The function creates a USD 3.00 PaymentIntent and stores its provider reference.
5. Confirm the PaymentIntent using a Stripe Checkout or Payment Element client flow before production. The current screen exposes the client secret to the application response but does not yet render a Stripe Payment Element.
6. Configure a webhook relay to normalize successful payment events into the signed `payment-webhook` contract.

## 6. PayPal

1. Create a PayPal developer sandbox application.
2. Set the sandbox client ID, client secret, and base URL.
3. Start verification with PayPal on `/deposit`.
4. Open the returned `checkoutUrl` and approve the USD 3.00 order with a sandbox buyer account.
5. Capture the order from the server-side PayPal flow, then normalize the completed event to `payment-webhook`.

For production, use `https://api-m.paypal.com` and production credentials. Never expose the client secret to the browser.

## 7. Webhook Contract

The webhook endpoint requires an HMAC-SHA256 signature in `x-payment-signature`, calculated over the exact JSON request body using `PAYMENT_WEBHOOK_SECRET`.

Example normalized event:

```json
{
  "eventId": "provider-event-123",
  "eventType": "payment.succeeded",
  "entityType": "verification_deposit",
  "entityId": "deposit-uuid",
  "status": "held"
}
```

Allowed verification statuses are `pending`, `held`, `verified`, `failed`, and `refunded`. Allowed payout status is `paid`. Reusing the same provider and event ID returns success without applying the event twice.

## 8. End-To-End Test Checklist

1. Sign up a test user and complete the profile form.
2. Click Save profile and confirm the profile row changes immediately in `profiles`.
3. Confirm the one-minute edit lock expires and the profile reloads from the database.
4. Open `/tasks`; verify the profile completion gate and task start links.
5. Start one task, answer questions, reload, and confirm saved progress remains.
6. Start a sandbox verification payment with each configured provider.
7. Confirm a `verification_deposits` row, provider reference, and audit log.
8. Confirm the callback is accepted once and duplicate callbacks are ignored.
9. Approve the verification from `/admin/payments` and confirm the profile becomes verified.
10. Request a payout of at least `$15` from `/financials`.
11. Approve and mark the payout paid from `/admin/payments`.
12. Verify all failed requests show an actionable error and do not create a false verified state.
