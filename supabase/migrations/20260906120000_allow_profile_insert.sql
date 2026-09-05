-- Allow a signed-in user to create their own profile if the signup trigger
-- did not create it. The id must match the authenticated user.
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
