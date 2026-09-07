# Developmental Loopholes And Errors

This code-level audit reflects the queued Gemini grading implementation. It is not a substitute for an authenticated penetration test. Reproduce each finding in staging before release.

## Resolved In The Current Build

### Model-answer exposure

Worker questions now come from `task_question_prompts`, which contains question text only. The worker-facing API and `TaskRunner` no longer select or render `model_answer`; the old `task_questions` read policy is removed by the security migration.

### Editing after submission

The submission trigger prevents a worker from changing submitted content, grading fields, or workflow status after submission. The task runner displays a pending-approval state for an already submitted task.

### Synchronous grading failure on quota exhaustion

Submission now creates a `grading_jobs` row. `process-grading-queue` reserves a conservative daily request budget, claims jobs safely, and retries provider quota/server responses instead of failing the worker submission.

## Critical Remaining Findings

### 1. Task access is still gated partly in the UI

The task list disables Start based on profile completion, but a direct `/tasks/:taskCode` request can still reach the runner and create an in-progress submission. The server must enforce profile, tier, device, active-task, daily-limit, and duplicate-attempt rules.

Impact: users can bypass restrictions with a crafted URL or direct API request.

Fix: add a trusted task-start function or database procedure and call it from the runner. Do not rely on disabled buttons or route visibility.

### 2. Client-controlled profile privilege fields

The own-profile update policy still needs to exclude subscription, profile completion, balance-related fields, admin flags, payment status, edit controls, and timestamps from browser writes.

Impact: a user may attempt to self-upgrade or alter eligibility through a direct API request.

Fix: use a narrow update function for editable profile fields and service-role functions for privileged state.

### 3. Payout requests do not reserve available balance atomically

`create-payout-request` validates the minimum amount and payout account, but the visible implementation does not reserve an authoritative available balance before creating a request.

Impact: repeated or concurrent requests can exceed earnings and create double-payment exposure.

Fix: lock the wallet in a database transaction, verify available balance, reserve the amount, and make approval/payment transitions idempotent.

## High Priority Remaining Findings

### 4. Queue scheduling and stuck-job recovery are operational dependencies

The queue processor is deployed as an Edge Function but does not run automatically until a scheduler is configured. A crash can also leave a job in `processing`.

Impact: valid submissions can remain pending indefinitely.

Fix: schedule the processor every 1-5 minutes, alert on queue age, and requeue processing jobs older than a defined timeout.

### 5. Manual-review results lack a complete admin workflow

Low-confidence grades are stored as `manual_review`, but the admin interface needs dedicated controls to inspect, override, approve, reject, and notify.

Impact: those tasks can remain pending with no accountable resolution path.

Fix: add an admin grading queue with role checks, audit events, reason fields, and an SLA.

### 6. Queue rows need stronger ownership validation

The browser can insert a user-owned queue row. The grader validates submission ownership, but the processor may spend queue work on fabricated rows before the grader rejects them.

Impact: queue noise and possible denial of grading capacity.

Fix: create jobs only inside a trusted submit function, or enforce that `grading_jobs.user_id` matches the referenced submission in a database trigger/function. Add a uniqueness and foreign-key check for the user/submission pair.

### 7. AI chat remains an abuse and quota path

`ai-chat` has `verify_jwt = false` and its handler currently does not require an authenticated user. The Gemini key is protected, but an anonymous caller can still consume project quota unless another gateway limit exists.

Impact: chat traffic can exhaust the same project quota used by grading.

Fix: require authentication in the handler, add per-user rate limits and request-size limits, and use a separate Google project or budget for chat.

### 8. Grading quota is conservative, not an exact Google quota meter

`GEMINI_DAILY_GRADING_LIMIT` is an application-side budget. Google controls the actual project quota, which can vary by model and account. A provider `429` is still possible and is handled by retrying later.

Impact: the application may underuse capacity or defer jobs longer than necessary.

Fix: monitor actual provider responses, tune the budget, parse retry intervals, and alert when the budget repeatedly differs from provider capacity.

## Medium Priority Findings

### 9. Payment webhook state handling is inconsistent

The payment webhook currently maps a verified verification deposit to `deposit_pending`, while the admin action maps approval to `verified`.

Impact: provider-confirmed payments can leave users locked or create conflicting payment states.

Fix: define one payment state machine, make events idempotent, and reconcile provider events against local records.

### 10. Payout and grading transitions need broader idempotency tests

The grading job is unique per submission, but the full flow still needs tests for duplicate submissions, duplicate worker runs, repeated admin actions, reordered payment webhooks, and worker retries.

Fix: add database constraints and integration tests for every state transition.

### 11. Signature comparison is not constant-time

The payment webhook compares HMAC signatures character by character.

Fix: compare decoded byte arrays with a constant-time implementation or vetted cryptographic helper.

### 12. Edge Functions were not locally type-checked

The local environment does not have Deno installed, so the new grading and queue functions were not checked with `deno check`.

Fix: run Deno checks and a deployed staging smoke test in CI before production deployment.

### 13. Generated JavaScript is tracked beside TypeScript

The repository contains generated `.js`, `.d.ts`, and source-map files next to source files.

Impact: stale generated code can be reviewed or deployed accidentally.

Fix: choose one source of truth and enforce generation in CI with a clean-tree check.

### 14. Auth state has limited session-change handling

The application initializes the current user but should subscribe to Supabase auth state changes for token expiry, sign-out in another tab, and account switching.

Fix: register `supabase.auth.onAuthStateChange`, clear user-specific state on sign-out, and clean up the subscription.

## Required Test Matrix

- Anonymous access to every protected route and Edge Function.
- Direct task URL access below the profile threshold.
- Direct updates to subscription, admin, payment, balance, and completion fields.
- Network inspection confirming model answers never reach the browser.
- Duplicate and concurrent task submissions.
- Queue processor crash and stale `processing` recovery.
- Daily budget exhaustion, provider `429`, `503`, and retry-after handling.
- Manual-review creation and admin resolution.
- Duplicate payment webhooks and reordered webhook events.
- Two concurrent payout requests against one balance.
- AI abuse, oversized history, invalid model configuration, and anonymous calls.
