-- Worker-owned saved tasks for returning to interesting marketplace work.
create table if not exists public.saved_tasks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create index if not exists saved_tasks_task_idx on public.saved_tasks(task_id);

alter table public.saved_tasks enable row level security;

drop policy if exists "saved tasks: read own" on public.saved_tasks;
create policy "saved tasks: read own"
  on public.saved_tasks for select
  using (auth.uid() = user_id);

drop policy if exists "saved tasks: insert own" on public.saved_tasks;
create policy "saved tasks: insert own"
  on public.saved_tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved tasks: delete own" on public.saved_tasks;
create policy "saved tasks: delete own"
  on public.saved_tasks for delete
  using (auth.uid() = user_id);
