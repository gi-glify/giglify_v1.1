-- Fields used by the profile and KYC forms.
alter table public.profiles
  add column if not exists profile_picture text,
  add column if not exists id_type text,
  add column if not exists id_number text,
  add column if not exists address text,
  add column if not exists full_legal_name text,
  add column if not exists payout_method text,
  add column if not exists payout_account text,
  add column if not exists proof_of_payment text;
