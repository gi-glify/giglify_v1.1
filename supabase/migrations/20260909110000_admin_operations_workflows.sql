-- Admin operations support for submission review and provider-authoritative payouts.
alter table public.payout_requests
  add column if not exists provider_event_id text,
  add column if not exists reconciled_at timestamptz;

create index if not exists payout_requests_status_created_idx
  on public.payout_requests(status, created_at desc);
create index if not exists task_submissions_review_idx
  on public.task_submissions(grading_status, status, completed_at desc);
create index if not exists grading_jobs_status_created_idx
  on public.grading_jobs(status, created_at desc);
