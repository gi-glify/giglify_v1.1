# Payment System Requirements

Develop a complete payment system for a client with the following requirements:

## Core Goals

- Users must verify ownership of a single payout account and prove they control a funding source before they can receive payouts.
- The system must ensure that all work is performed under one verified work account and that all payouts go only to one verified payout account per user.
- The client fully controls and triggers the actual payouts (the system only prepares and validates them).

## Verification / Deposit Mechanism

- Before a user can receive any payout, they must successfully complete a small verification deposit of **$3** (or equivalent) into the platform.
- Based on the location (Now Kenya), convert these dollars into kenya currency at the rate of $1 = KSh124.50
- This deposit works like a temporary authorization/hold (similar to how PayPal or card processors sometimes place a small temporary charge to verify a payment method).
- Accepted payment methods for the $3 verification deposit:
  - M-Pesa
  - PayPal
  - Stripe (cards and other supported methods)
- The $3 is held/verified and then added to her total tally to be withdrawn with the other funds

## Key Rules

- One verified work account ↔ one verified payout account per user.
- Payouts are never automatic; they are always initiated and managed by the client/admin.
- The system must clearly track the verification status of each user (unverified → deposit pending → verified).
- Support proper audit logs for deposits, verification status changes, and payout requests.

## Technical Expectations

- Design the architecture, database schema, API endpoints, and user flows.
- Include security best practices (especially around payment verification, preventing multiple accounts, and securing payout destinations).
- Support the three payment gateways mentioned (M-Pesa, PayPal, Stripe).
- Provide a _MD_ plan to build an admin page that will be verifiying some things

## Expected Response Structure

1. High-level system overview  
2. User flow (verification + payout)  
3. Admin/client flow  
4. Suggested database models  
5. API design outline  
6. Security considerations  
7. Any open questions or recommended decisions

## Addition

You can offer a _Suggestion.MD_ on things to improve before we start building