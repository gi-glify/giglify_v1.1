# Giglify

Giglify is a task marketplace with a customer-facing web app and a separate administrator console. The customer app lives at the repository root; the admin app lives in [`giglify-admin/`](giglify-admin/).

## Production architecture

- React and Vite frontend in the repository root.
- Supabase Auth, Postgres, Storage, and Edge Functions.
- Daraja M-Pesa STK Push for package and verification payments.
- Separate `giglify-admin` frontend for protected operational workflows.
- Verified provider callbacks activate tiers and update the customer entitlement.
- Resend inbound support replies are stored in the protected admin inbox.

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
PACKAGE_PAYMENT_CALLBACK_URL
VERIFICATION_PAYMENT_CALLBACK_URL
```

Current worker packages are one month each: Free is 4 tasks/month (one every 7 days, rewards under $5); Pro is normally $19, with a one-time launch offer of $3; Elite is normally $49, with a one-time launch offer of $7; and Max is normally $99, with a one-time launch offer of $10. After a user completes one paid package purchase, later package purchases use the regular price. M-Pesa package amounts use 131 KES/USD, so launch pricing is KES 393, KES 917, and KES 1,310. The payout-account activation fee is $5 (KES 655 at the configured 131 KES/USD rate), and the minimum withdrawal is $70.

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

The customer app includes `vercel.json` and `public/_redirects` SPA fallbacks, and email confirmations return to the site root before the app routes authenticated users to the dashboard. Keep the host fallback enabled so direct links from Supabase Auth do not return a server-side 404.

## Support inbox setup

The admin console includes `/inbox` for replies sent by users. The current design keeps `Team@giglify.co.ke` in its existing mailbox and forwards a copy of each reply to Resend Receiving.

1. In Resend, open **Receiving** and copy the generated inbound address.
2. In Resend **Webhooks**, create an `email.received` webhook pointing to `https://skgkdtfoxlkvpvmmefub.supabase.co/functions/v1/resend-inbound-email`.
3. Copy the webhook signing secret and store it server-side:

   ```bash
   supabase secrets set RESEND_WEBHOOK_SECRET=whsec_... --project-ref skgkdtfoxlkvpvmmefub
   ```

4. In the mailbox provider for `Team@giglify.co.ke`, create a forwarding rule to the Resend inbound address. Preserve the original sender and subject when the provider offers that option.
5. Send a test reply to an email from the admin composer. The message should appear in the admin console under **Support inbox**.

The public inbound function accepts only signed Resend webhook requests, ignores duplicate event deliveries, and stores message text without exposing it to unauthenticated users. Admins can mark messages read and open the existing branded composer to reply.

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
