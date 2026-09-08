-- Ensure imported active tasks and their worker-safe prompts are visible to
-- authenticated workers after the question-bank migration.
alter table public.tasks enable row level security;
drop policy if exists "tasks: read active tasks" on public.tasks;
create policy "tasks: read active tasks" on public.tasks for select
  using (is_active = true);

alter table public.task_question_prompts enable row level security;
drop policy if exists "task question prompts: read active tasks" on public.task_question_prompts;
create policy "task question prompts: read active tasks" on public.task_question_prompts for select
  using (exists (
    select 1 from public.tasks t
    where t.task_code = task_question_prompts.task_code
      and t.is_active = true
  ));
