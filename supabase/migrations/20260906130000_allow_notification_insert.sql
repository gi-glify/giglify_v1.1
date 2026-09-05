-- Users may create notifications for themselves from authenticated app actions.
drop policy if exists "notifications: insert own" on public.notifications;
create policy "notifications: insert own" on public.notifications
  for insert with check (auth.uid() = user_id);
