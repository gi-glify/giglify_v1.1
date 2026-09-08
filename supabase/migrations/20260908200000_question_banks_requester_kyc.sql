-- Typed resource question banks and requester task workflow.

alter table public.tasks
  add column if not exists task_type text not null default 'saq',
  add column if not exists context text not null default '',
  add column if not exists source_file text,
  add column if not exists source_set text;

alter table public.tasks drop constraint if exists tasks_category_check;
alter table public.tasks add constraint tasks_category_check
  check (category in ('academic', 'ai-training', 'coding', 'data-labeling', 'design', 'research', 'translation', 'writing', 'rlhf', 'data-verification'));

alter table public.tasks drop constraint if exists tasks_task_type_check;
alter table public.tasks add constraint tasks_task_type_check check (task_type in ('mcq', 'saq'));

alter table public.task_questions
  add column if not exists question_type text not null default 'saq',
  add column if not exists context text not null default '',
  add column if not exists options jsonb not null default '[]'::jsonb,
  add column if not exists correct_option text;

alter table public.task_questions drop constraint if exists task_questions_question_type_check;
alter table public.task_questions add constraint task_questions_question_type_check check (question_type in ('mcq', 'saq'));

alter table public.task_question_prompts
  add column if not exists question_type text not null default 'saq',
  add column if not exists context text not null default '',
  add column if not exists options jsonb not null default '[]'::jsonb;

alter table public.task_question_prompts drop constraint if exists task_question_prompts_question_type_check;
alter table public.task_question_prompts add constraint task_question_prompts_question_type_check check (question_type in ('mcq', 'saq'));

-- Reassert the worker-facing catalog policies so imported tasks are visible
-- to authenticated users while answer keys remain private.
alter table public.tasks enable row level security;
drop policy if exists "tasks: read active tasks" on public.tasks;
create policy "tasks: read active tasks" on public.tasks for select
  using (is_active = true);
alter table public.task_question_prompts enable row level security;
drop policy if exists "task question prompts: read active tasks" on public.task_question_prompts;
create policy "task question prompts: read active tasks" on public.task_question_prompts for select
  using (exists (
    select 1 from public.tasks t
    where t.task_code = task_question_prompts.task_code and t.is_active = true
  ));

create or replace function public.sync_task_question_prompt()
returns trigger as $$
begin
  insert into public.task_question_prompts (id, task_code, question_number, question_text, question_type, context, options)
  values (new.id, new.task_code, new.question_number, new.question_text, new.question_type, new.context, new.options)
  on conflict (id) do update set
    task_code = excluded.task_code,
    question_number = excluded.question_number,
    question_text = excluded.question_text,
    question_type = excluded.question_type,
    context = excluded.context,
    options = excluded.options;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Existing worker prompts are backfilled by the public fields only.
insert into public.task_question_prompts (id, task_code, question_number, question_text, question_type, context, options)
select id, task_code, question_number, question_text, question_type, context, options
from public.task_questions
on conflict (id) do update set
  question_text = excluded.question_text,
  question_type = excluded.question_type,
  context = excluded.context,
  options = excluded.options;

create table if not exists public.requester_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  legal_name text not null check (char_length(trim(legal_name)) between 2 and 160),
  organization_name text,
  phone text not null,
  country text not null,
  id_type text not null,
  id_number text not null,
  id_document_path text not null,
  task_brief text not null check (char_length(trim(task_brief)) between 20 and 5000),
  status text not null default 'pending' check (status in ('pending', 'review-ready', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  review_available_at timestamptz not null default (now() + interval '72 hours'),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  admin_note text
);

create table if not exists public.requester_task_drafts (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 5 and 160),
  context text not null check (char_length(trim(context)) between 20 and 5000),
  category text not null check (category in ('academic', 'ai-training', 'coding', 'data-labeling', 'design', 'research', 'translation', 'writing')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  reward numeric(10,2) not null check (reward > 0),
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'pending_review' check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  admin_note text
);

alter table public.requester_applications enable row level security;
alter table public.requester_task_drafts enable row level security;

drop policy if exists "requester applications: read own" on public.requester_applications;
create policy "requester applications: read own" on public.requester_applications for select using (auth.uid() = user_id);
drop policy if exists "requester applications: insert own" on public.requester_applications;
create policy "requester applications: insert own" on public.requester_applications for insert with check (auth.uid() = user_id);
drop policy if exists "requester applications: update own pending" on public.requester_applications;
create policy "requester applications: update own pending" on public.requester_applications for update using (auth.uid() = user_id and status = 'pending');
drop policy if exists "requester applications: admin read" on public.requester_applications;
create policy "requester applications: admin read" on public.requester_applications for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
drop policy if exists "requester applications: admin update" on public.requester_applications;
create policy "requester applications: admin update" on public.requester_applications for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "requester drafts: read own" on public.requester_task_drafts;
create policy "requester drafts: read own" on public.requester_task_drafts for select using (auth.uid() = requester_id);
drop policy if exists "requester drafts: insert eligible" on public.requester_task_drafts;
create policy "requester drafts: insert eligible" on public.requester_task_drafts for insert with check (
  auth.uid() = requester_id and exists (
    select 1 from public.requester_applications a
    where a.user_id = auth.uid() and a.status in ('review-ready', 'approved')
  )
);
drop policy if exists "requester drafts: admin read" on public.requester_task_drafts;
create policy "requester drafts: admin read" on public.requester_task_drafts for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
drop policy if exists "requester drafts: admin update" on public.requester_task_drafts;
create policy "requester drafts: admin update" on public.requester_task_drafts for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

insert into storage.buckets (id, name, public)
values ('requester-kyc', 'requester-kyc', false)
on conflict (id) do update set public = false;

drop policy if exists "requester kyc: insert own" on storage.objects;
create policy "requester kyc: insert own" on storage.objects for insert
with check (bucket_id = 'requester-kyc' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "requester kyc: read own" on storage.objects;
create policy "requester kyc: read own" on storage.objects for select
using (bucket_id = 'requester-kyc' and (storage.foldername(name))[1] = auth.uid()::text);

create index if not exists requester_applications_due_idx on public.requester_applications(status, review_available_at);
create index if not exists requester_task_drafts_requester_idx on public.requester_task_drafts(requester_id, status, created_at);
