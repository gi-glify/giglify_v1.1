-- The profile form writes these fields, including databases created from the
-- original schema before the complete profile definition was introduced.
alter table public.profiles
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
