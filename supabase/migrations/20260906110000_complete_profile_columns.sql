-- Bring older profiles tables up to the complete profile form contract.
alter table public.profiles
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists bio text,
  add column if not exists skills text[] default '{}',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists date_of_birth date,
  add column if not exists payout_method_added boolean not null default false,
  add column if not exists profile_picture text,
  add column if not exists id_type text,
  add column if not exists id_number text,
  add column if not exists address text,
  add column if not exists full_legal_name text,
  add column if not exists payout_method text,
  add column if not exists payout_account text,
  add column if not exists proof_of_payment text;
