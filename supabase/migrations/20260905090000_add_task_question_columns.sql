-- Bring databases created from the original schema up to the question-bank schema.
alter table public.tasks
  add column if not exists task_code text,
  add column if not exists field text;

create unique index if not exists tasks_task_code_key on public.tasks (task_code);

create table if not exists public.task_questions (
  id uuid primary key default uuid_generate_v4(),
  task_code text not null references public.tasks(task_code) on delete cascade,
  question_number int not null check (question_number >= 1 and question_number <= 10),
  question_text text not null,
  model_answer text not null,
  created_at timestamptz not null default now(),
  unique(task_code, question_number)
);

create index if not exists idx_task_questions_code on public.task_questions (task_code);

alter table public.task_questions enable row level security;

drop policy if exists "task_questions: read for active tasks" on public.task_questions;
create policy "task_questions: read for active tasks" on public.task_questions
  for select using (
    exists (
      select 1 from public.tasks t
      where t.task_code = task_questions.task_code
        and t.is_active = true
    )
  );
