-- Complete the requester task lifecycle: save drafts, revise rejected tasks,
-- and retain the published worker-task reference after approval.
alter table public.requester_task_drafts
  add column if not exists published_task_id uuid references public.tasks(id) on delete set null,
  add column if not exists published_task_code text;

drop policy if exists "requester drafts: update own editable" on public.requester_task_drafts;
create policy "requester drafts: update own editable"
  on public.requester_task_drafts for update
  using (auth.uid() = requester_id and status in ('draft', 'rejected'))
  with check (auth.uid() = requester_id and status in ('draft', 'pending_review'));

drop policy if exists "requester drafts: delete own editable" on public.requester_task_drafts;
create policy "requester drafts: delete own editable"
  on public.requester_task_drafts for delete
  using (auth.uid() = requester_id and status in ('draft', 'rejected'));

create index if not exists requester_task_drafts_published_idx
  on public.requester_task_drafts(published_task_id)
  where published_task_id is not null;
