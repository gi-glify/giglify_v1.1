# Giglify Handover

Updated: 2026-09-08

## Current State

Giglify is a React/Vite + Supabase microtask platform. It supports workers completing tasks and requesters applying to post tasks.

The current branch contains the latest source changes and generated TypeScript build artifacts. Do not reset or discard unrelated work in the working tree.

## Recent Features

- Email verification gate before dashboard access.
- Database-backed policy consent using `profiles.terms_accepted_at` and `terms_version`.
- About, privacy, data policy, terms, contact, thank-you, custom 404, cookie banner, SEO metadata, OG image, robots, and sitemap.
- Theme transition animation and visible help/policy links on authenticated pages.
- Profile persistence, read-only profile display, edit lock, appeal workflow, profile pictures, and notification toasts.
- Gemini chat as Gig Buddy with persisted chats and generic user-facing errors.
- Gemini SAQ grading queue with daily quota stalling/retry behavior.
- Task catalog search, difficulty, device, pay, and category filters.
- MCQ/SAQ question resource importer and secure MCQ validation.
- Requester KYC application and requester task draft workflow.
- Minimum worker withdrawal is `$50` and is enforced in frontend and Edge Function.
- Dashboard now has a `Post a task` CTA linking to requester KYC.
- Task filtering now includes normalized category matching and `MCQ`/`SAQ` question-type chips.
- Task catalog reads now retry older schemas and the task/prompt RLS policies are reasserted in the question-bank migration.
- Follow-up migration `20260908210000_fix_task_catalog_visibility.sql` re-applies those catalog read policies for already-deployed databases.

## Question Resources

Source files are in `docs/resources/`:

- `AI_Training.md`: 2 expert SAQ task sets, 20 questions total.
- `Coding.md`: 9 MCQs.
- `Data_Labeling.md`: 9 MCQs.
- `Design.md`: 7 MCQs.
- `Research.md`: 8 MCQs.
- `Translation.md`: 8 MCQs.
- `Writing.md`: 9 MCQs.

The importer currently parses 8 task sets and 70 questions.

Run the parser without DB access:

```bash
npm run import:resources -- --dry-run
```

Import into Supabase using a service-role key:

```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
npm run import:resources
```

The importer is in `scripts/import-question-resources.mjs`. It upserts by task code and question number. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit it.
If the importer returns `42501`, the supplied key is anon/publishable rather than service-role. Get the secret from Supabase Project Settings > API and rerun the command.

## Required Supabase Deployment

Apply migrations:

```bash
supabase db push
```

Deploy the new functions:

```bash
supabase functions deploy validate-mcq-answer
supabase functions deploy process-requester-applications
supabase functions deploy admin-requester-action
```

The existing project also requires the previously deployed payment, contact, AI chat, grading, and queue functions.

Set requester scheduler protection:

```bash
supabase secrets set REQUESTER_CRON_SECRET="long-random-secret"
```

Schedule an hourly or daily POST to `process-requester-applications` with header `x-cron-secret`. It changes applications whose 72-hour window has elapsed from `pending` to `review-ready` and creates an in-app notification.

## Important Routes

- `/`: public landing page.
- `/auth`: signup/signin and email verification message.
- `/dashboard`: worker dashboard and requester CTA.
- `/tasks`: task catalog and filters.
- `/tasks/:taskCode`: MCQ/SAQ task runner.
- `/deposit`: one-time payout-account verification payment only.
- `/financials`: balance and withdrawal requests; minimum is `$50`.
- `/requester/apply`: requester KYC application.
- `/requester/tasks`: requester task draft submission after review-ready/approved status.
- `/admin/payments`: admin payment, requester, appeal, and payout review surface.
- `/about`, `/privacy`, `/data-policy`, `/terms`, `/contact`: policy/support pages.

## Security Rules

- MCQ correct options are stored in `task_questions`, not worker-facing `task_question_prompts`.
- SAQ model answers are private and used by the Gemini grading functions.
- Worker rewards are calculated server-side/database-side; do not trust browser reward values.
- Requester KYC files are stored in the private `requester-kyc` bucket.
- Service-role keys belong only in Supabase secrets or server-side scripts.
- Requester drafts remain pending admin review and should not be treated as published tasks until an admin approves them.

## Known Limitations / Next Work

1. The hosted Supabase migration and question importer must still be run against the project after reviewing the dry-run output.
2. Supabase Edge Functions are not locally type-checked because Deno is not installed in the workspace. Deploy/test them in Supabase after migration.
3. The requester scheduler must be configured externally; the Edge Function does not run automatically without a cron trigger.
4. Requester task approval is implemented as a protected draft workflow. Provider billing, escrow, and requester payout settlement still need a separate payment-provider integration before launch.
5. The Vite bundle is above 500 kB after minification. Code-splitting can be addressed after functional launch checks.
6. Legal copy in the About page is starter copy and requires legal review before production launch.

## Verification At Handover

- `npm run import:resources -- --dry-run`: parses 8 task sets and 70 questions.
- `npm test`: 9 tests pass.
- `npm run build`: passes.
- `git diff --check`: passes.

## Working Convention

Any follow-up work in this chat should update this file when architecture, deployment commands, routes, migrations, known limitations, or verification results change. This file is the continuation point if the conversation is resumed in a new session.
