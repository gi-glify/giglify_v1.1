alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(trim(name)) between 2 and 100),
  email text not null check (char_length(trim(email)) between 5 and 320),
  message text not null check (char_length(trim(message)) between 10 and 5000),
  status text not null default 'received' check (status in ('received', 'sent', 'failed')), 
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
drop policy if exists "contact messages: read own" on public.contact_messages;
create policy "contact messages: read own" on public.contact_messages
  for select using (auth.uid() = user_id);
