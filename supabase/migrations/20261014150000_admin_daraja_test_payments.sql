-- Admin-only Daraja test payments use a custom KES amount without changing
-- public package prices or the package_tiers catalog.
alter table public.transactions
  add column if not exists payment_metadata jsonb not null default '{}'::jsonb;

alter table public.transactions
  drop constraint if exists transactions_payment_metadata_object_check;
alter table public.transactions
  add constraint transactions_payment_metadata_object_check
  check (jsonb_typeof(payment_metadata) = 'object');
