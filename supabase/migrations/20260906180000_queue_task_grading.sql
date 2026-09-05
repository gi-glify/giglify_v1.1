-- Queue grading so quota exhaustion delays work instead of failing submissions.
create table if not exists public.grading_jobs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.task_submissions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'retry', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists grading_jobs_queue_idx on public.grading_jobs(status, next_attempt_at, created_at);

create table if not exists public.grading_usage (
  usage_date date primary key default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.grading_usage enable row level security;

-- Atomically reserve one Gemini request for the configured conservative budget.
create or replace function public.reserve_grading_request(p_daily_limit integer)
returns boolean as $$
declare
  reserved boolean;
begin
  insert into public.grading_usage (usage_date, request_count)
  values (current_date, 1)
  on conflict (usage_date) do update
    set request_count = public.grading_usage.request_count + 1,
        updated_at = now()
    where public.grading_usage.request_count < greatest(p_daily_limit, 1)
  returning true into reserved;
  return coalesce(reserved, false);
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.reserve_grading_request(integer) from public, anon, authenticated;
grant execute on function public.reserve_grading_request(integer) to service_role;

alter table public.grading_jobs enable row level security;
drop policy if exists "grading jobs: read own" on public.grading_jobs;
create policy "grading jobs: read own" on public.grading_jobs
  for select using (auth.uid() = user_id);
drop policy if exists "grading jobs: insert own" on public.grading_jobs;
create policy "grading jobs: insert own" on public.grading_jobs
  for insert with check (auth.uid() = user_id);
