# Giglify

Giglify is a task marketplace with a customer-facing web app and a separate administrator console. The customer app lives at the repository root; the admin app lives in [`giglify-admin/`](giglify-admin/).

## Production architecture

- React and Vite frontend in the repository root.
- Supabase Auth, Postgres, Storage, and Edge Functions.
- Daraja M-Pesa STK Push for package and verification payments.
- Separate `giglify-admin` frontend for protected operational workflows.
- Verified provider callbacks activate tiers and update the customer entitlement.

## Payment configuration

The live payment path is Daraja, not PalPluss. The Buy Goods/Till configuration uses:

- Store/head-office shortcode: `1237946`
- Till number: `1708580`
- Callback endpoint: `https://skgkdtfoxlkvpvmmefub.supabase.co/functions/v1/payment-webhook`

Keep all credentials and amounts in Supabase Edge Function secrets. Never put provider secrets in `VITE_*` variables, source files, or this README.

Required server-side configuration includes:

```text
DARAJA_ENVIRONMENT
DARAJA_CONSUMER_KEY
DARAJA_CONSUMER_SECRET
DARAJA_SHORTCODE
DARAJA_SHORTCODE_TYPE
DARAJA_TILL_NUMBER
DARAJA_PASSKEY
DARAJA_CALLBACK_SECRET
DARAJA_PRO_AMOUNT_KES
DARAJA_ELITE_AMOUNT_KES
DARAJA_MAX_AMOUNT_KES
PACKAGE_PAYMENT_CALLBACK_URL
VERIFICATION_PAYMENT_CALLBACK_URL
```

Current worker packages are one month each: Free is 4 tasks/month (one every 7 days, rewards under $5); Pro is $19 for 30/month (one/day, up to $9.90); Elite is $49 for 90/month (three/day, up to $20); and Max is $99 with unlimited tasks and no reward cap. The payout-account activation fee is $5 (KES 655 at the configured 131 KES/USD rate), and the minimum withdrawal is $70.

Paid package access receives an in-product and email warning during the 24 hours before expiry. The warning is idempotent and is issued when the signed-in user opens the app during that window. Written/short-answer submissions are graded by the server-side AI grading queue against the private task rubric; approved submissions notify the worker in-app and by email.

The callback secret is an application-generated secret. It is not supplied by Safaricom. Rotate any credentials that were previously exposed before accepting production traffic.

## Go-live checklist

1. Confirm the production Supabase project is linked and all reviewed migrations are applied.
2. Confirm the required Edge Function secrets exist and contain real live values, not placeholders.
3. Deploy the payment initiators, webhook, settlement, admin, and support functions from `supabase/functions/`.
4. Deploy the customer frontend and configure the production Auth site URL and redirect URLs.
5. Deploy `giglify-admin` separately with its own `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Confirm the Daraja callback URL is registered and reachable over HTTPS.
7. Make one controlled low-value live payment and verify the Daraja callback, transaction, and tier activation in Supabase.
8. Confirm the admin console can review payments, requesters, tasks, submissions, users, and audit history.
9. Remove temporary test-price or test-payment configuration before opening the site to normal traffic.
10. Rotate exposed development credentials and record the production support and refund process.

## Useful commands

Run these only from an authenticated release environment:

```bash
supabase secrets list --project-ref skgkdtfoxlkvpvmmefub
supabase migration list --project-ref skgkdtfoxlkvpvmmefub
supabase functions list --project-ref skgkdtfoxlkvpvmmefub
```

Do not paste secret values into shell history, chat, Git, browser logs, or issue trackers.

## Repository boundaries

- Customer app and Supabase migrations/functions: this repository root.
- Admin UI and its independent deployment: [`giglify-admin/`](giglify-admin/).
- Production credentials: Supabase secrets and provider dashboards only.
