# Giglify Launch Suggestions

This backlog reflects the current queued Gemini grading build. Items marked P0 are launch blockers; P1 items should follow immediately after controlled beta release.

## P0: Launch Blockers

1. Apply and verify migrations `20260906170000_secure_task_grading.sql` and `20260906180000_queue_task_grading.sql` in staging and production.
2. Deploy `grade-task-submission` and `process-grading-queue` with `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.6-flash`, `GEMINI_GRADING_MODEL=gemini-3.6-flash`, `GEMINI_DAILY_GRADING_LIMIT`, and a strong `GRADING_QUEUE_SECRET`.
3. Configure a scheduler to invoke `process-grading-queue` every 1-5 minutes. Add stale-job recovery for jobs left in `processing` after a worker timeout.
4. Add an admin grading-review screen for `manual_review` and `failed` jobs. Admins need to inspect feedback, override scores, approve/reject payment, and notify workers.
5. Enforce task eligibility server-side. Profile completion, subscription, device rules, daily limits, active status, and duplicate attempts must be checked by a trusted start/submission function.
6. Finish the wallet ledger and payout reservation flow. Approved rewards and payout requests need atomic balance reservations, idempotency, and reconciliation.
7. Complete provider testing for M-Pesa, PayPal, and Stripe: successful, failed, cancelled, duplicate, delayed, refunded, and webhook-reordered cases.
8. Add end-to-end tests for the complete grading path: submit, queued, quota deferred, retry, full pay, half pay, no pay, manual review, failed retry, notification, and wallet credit.
9. Configure production observability: structured Edge Function logs, queue depth alerts, Gemini quota alerts, payment alerts, database backups, uptime monitoring, and an incident contact.

## P1: Trust And Operations

1. Show task status and grading progress in the worker UI: submitted, queued, processing, manual review, graded, paid, and rejected.
2. Display the percentage score and per-question feedback from the saved grading result.
3. Add a worker appeal flow for rejected and half-pay grades, with an admin decision and audit trail.
4. Add clear payout estimates, provider fees, supported countries, verification requirements, grading rules, and refund rules before payment.
5. Add queue fairness controls: FIFO ordering, per-user submission limits, maximum attempts, and protection against fake queue rows.
6. Separate AI chat and grading into different Google projects or define separate budgets so chat traffic cannot consume grading capacity.
7. Add empty, loading, retry, offline, and delayed-quota states consistently across tasks, wallet, profile, notifications, and AI chat.
8. Add accessibility checks for keyboard navigation, focus states, labels, contrast, reduced motion, and screen-reader announcements.

## P2: Product Improvements

1. Add sorting by reward, estimated time, newest, and best match.
2. Add saved tasks and a resume-work queue for interrupted submissions.
3. Add worker quality metrics, reviewer feedback, and transparent quality rules.
4. Add authenticated AI chat persistence only if the retention policy and delete controls are clearly defined.
5. Add feature flags for payment providers, task types, grading thresholds, and AI models.
6. Add referrals, achievements, and streaks only after payments, grading, and the ledger are reliable.

## Release Checklist

- [ ] Production secrets are separate from local and staging values.
- [ ] Both new migrations are applied and verified against a backup.
- [ ] Worker queries return prompts only; model answers are not visible in network responses.
- [ ] RLS has been tested as anonymous, normal user, and admin.
- [ ] Direct task URLs cannot bypass profile, tier, device, or daily limits.
- [ ] Queue scheduler is active and has a stale-job recovery path.
- [ ] Gemini quota exhaustion leaves jobs queued and does not show workers a failure.
- [ ] Manual-review and failed-grading queues have an owner and an operational SLA.
- [ ] Payment webhooks reject invalid signatures and safely handle duplicate events.
- [ ] All payment, grading, reward, and payout transitions are idempotent.
- [ ] No secret keys, model answers, admin controls, or balance controls are exposed to the browser.
- [ ] Rollback, support, refund, and data-deletion procedures are documented.
