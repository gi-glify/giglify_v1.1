# Analytics Setup

Use a privacy-first analytics provider and load it only after the user accepts the cookie banner. Do not send email addresses, ID numbers, payment details, task answers, or other personal data as analytics properties.

## Recommended: Plausible

1. Create a Plausible site for the production hostname.
2. Add the provider script to `index.html` only after consent, or inject it from a consent-aware React component.
3. Track aggregate events such as `signup_started`, `email_verified`, `task_started`, `task_submitted`, and `payout_requested`.
4. Confirm that private routes use `noindex` metadata and that no personal data appears in event payloads.
5. Test consent, withdrawal of consent, ad blockers, and mobile navigation before launch.

## Google Analytics Alternative

If Google Analytics is required, create a GA4 property, configure consent mode, load `gtag.js` only after analytics consent, disable advertising features unless explicitly needed, and define retention settings. Keep analytics separate from payment, KYC, and task-answer data.

## Release Checks

- [ ] Analytics is disabled before consent.
- [ ] Cookie/local-storage preference can be withdrawn.
- [ ] Events contain no PII or task content.
- [ ] Staging and production measurement IDs are separate.
- [ ] A privacy notice explains the provider, purpose, retention, and user choices.
