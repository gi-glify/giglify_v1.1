-- Enforce one profile edit unless an administrator approves an appeal.
alter table public.profiles
  add column if not exists profile_edit_count integer not null default 0,
  add column if not exists profile_edit_appeal_approved boolean not null default false;

create table if not exists public.profile_edit_appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) >= 10),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists profile_edit_appeals_user_idx on public.profile_edit_appeals(user_id);
alter table public.profile_edit_appeals enable row level security;

drop policy if exists "profile_edit_appeals: read own" on public.profile_edit_appeals;
create policy "profile_edit_appeals: read own" on public.profile_edit_appeals
  for select using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
drop policy if exists "profile_edit_appeals: insert own" on public.profile_edit_appeals;
create policy "profile_edit_appeals: insert own" on public.profile_edit_appeals
  for insert with check (auth.uid() = user_id);

create or replace function public.enforce_profile_edit_limit()
returns trigger as $$
begin
  if auth.uid() = old.id and (
    new.profile_edit_count is distinct from old.profile_edit_count or
    new.profile_edit_appeal_approved is distinct from old.profile_edit_appeal_approved
  ) then
    raise exception 'Profile edit controls can only be changed by an administrator';
  end if;
  if auth.uid() = old.id and (
    new.phone is distinct from old.phone or new.country is distinct from old.country or
    new.bio is distinct from old.bio or new.skills is distinct from old.skills or
    new.profile_picture is distinct from old.profile_picture or new.id_type is distinct from old.id_type or
    new.id_number is distinct from old.id_number or new.date_of_birth is distinct from old.date_of_birth or
    new.address is distinct from old.address or new.full_legal_name is distinct from old.full_legal_name or
    new.payout_method is distinct from old.payout_method or new.payout_account is distinct from old.payout_account or
    new.proof_of_payment is distinct from old.proof_of_payment or new.payout_method_added is distinct from old.payout_method_added
  ) then
    if old.profile_edit_count >= 1 and not old.profile_edit_appeal_approved then
      raise exception 'Profile editing is locked until an appeal is approved';
    end if;
    new.profile_edit_count := old.profile_edit_count + 1;
    new.profile_edit_appeal_approved := false;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_profile_edit_limit on public.profiles;
create trigger enforce_profile_edit_limit
  before update on public.profiles
  for each row execute procedure public.enforce_profile_edit_limit();
