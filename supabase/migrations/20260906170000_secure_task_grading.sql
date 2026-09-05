-- Keep worker-visible prompts separate from private grading answers.
create table if not exists public.task_question_prompts (
  id uuid primary key,
  task_code text not null references public.tasks(task_code) on delete cascade,
  question_number int not null check (question_number >= 1 and question_number <= 10),
  question_text text not null,
  unique(task_code, question_number)
);

insert into public.task_question_prompts (id, task_code, question_number, question_text)
select id, task_code, question_number, question_text
from public.task_questions
where task_code is not null
on conflict (id) do update set
  task_code = excluded.task_code,
  question_number = excluded.question_number,
  question_text = excluded.question_text;

create or replace function public.sync_task_question_prompt()
returns trigger as $$
begin
  insert into public.task_question_prompts (id, task_code, question_number, question_text)
  values (new.id, new.task_code, new.question_number, new.question_text)
  on conflict (id) do update set
    task_code = excluded.task_code,
    question_number = excluded.question_number,
    question_text = excluded.question_text;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists sync_task_question_prompt on public.task_questions;
create trigger sync_task_question_prompt
  after insert or update of task_code, question_number, question_text on public.task_questions
  for each row execute procedure public.sync_task_question_prompt();

alter table public.task_question_prompts enable row level security;
drop policy if exists "task question prompts: read active tasks" on public.task_question_prompts;
create policy "task question prompts: read active tasks" on public.task_question_prompts
  for select using (
    exists (
      select 1 from public.tasks t
      where t.task_code = task_question_prompts.task_code
        and t.is_active = true
    )
  );

-- Remove the old policy that exposed model_answer through PostgREST.
drop policy if exists "task_questions: read for active tasks" on public.task_questions;

alter table public.task_submissions
  add column if not exists grading_status text not null default 'pending',
  add column if not exists grading_percentage numeric(5,2),
  add column if not exists grading_decision text,
  add column if not exists grading_confidence numeric(5,2),
  add column if not exists grading_feedback jsonb,
  add column if not exists graded_at timestamptz,
  add column if not exists reward_approved numeric(10,2);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'task_submissions_grading_status_check') then
    alter table public.task_submissions add constraint task_submissions_grading_status_check
      check (grading_status in ('pending', 'processing', 'graded', 'manual_review', 'failed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'task_submissions_grading_percentage_check') then
    alter table public.task_submissions add constraint task_submissions_grading_percentage_check
      check (grading_percentage is null or (grading_percentage >= 0 and grading_percentage <= 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'task_submissions_grading_confidence_check') then
    alter table public.task_submissions add constraint task_submissions_grading_confidence_check
      check (grading_confidence is null or (grading_confidence >= 0 and grading_confidence <= 100));
  end if;
end $$;

-- The approved amount is calculated by the trusted grader, never by the browser.
create or replace function public.handle_submission_approved()
returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.completed_at := now();
    new.reward_paid := coalesce(new.reward_approved, (select reward from public.tasks where id = new.task_id));

    update public.wallets
      set balance = balance + new.reward_paid,
          updated_at = now()
      where user_id = new.user_id;

    insert into public.transactions (user_id, type, amount, status, description, related_submission_id)
    values (new.user_id, 'task-reward', new.reward_paid, 'completed', 'Reward for task ' || new.task_id, new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.protect_task_submission_workflow()
returns trigger as $$
begin
  if auth.uid() = old.user_id then
    if old.status <> 'in-progress' and new.submitted_content is distinct from old.submitted_content then
      raise exception 'Submitted task answers cannot be changed';
    end if;
    if new.status is distinct from old.status and not (old.status = 'in-progress' and new.status = 'submitted') then
      raise exception 'Task status can only be changed by the grading service';
    end if;
    if new.grading_status is distinct from old.grading_status
      or new.grading_percentage is distinct from old.grading_percentage
      or new.grading_decision is distinct from old.grading_decision
      or new.grading_confidence is distinct from old.grading_confidence
      or new.grading_feedback is distinct from old.grading_feedback
      or new.graded_at is distinct from old.graded_at
      or new.reward_approved is distinct from old.reward_approved then
      raise exception 'Task grading can only be changed by the grading service';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_task_submission_workflow on public.task_submissions;
create trigger protect_task_submission_workflow
  before update on public.task_submissions
  for each row execute procedure public.protect_task_submission_workflow();
