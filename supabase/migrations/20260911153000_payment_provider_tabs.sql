-- Align verification payments with the approved provider tabs.
-- Legacy Stripe/M-Pesa rows remain readable; new requests use Paystack,
-- PayPal, or PalPluss.

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where contype = 'c'
      and conrelid in ('public.payout_accounts'::regclass, 'public.verification_deposits'::regclass)
      and pg_get_constraintdef(oid) ilike '%stripe%'
  loop
    execute format('alter table %s drop constraint if exists %I', constraint_row.table_name, constraint_row.conname);
  end loop;
end $$;

alter table public.payout_accounts
  add constraint payout_accounts_method_supported_check
  check (method in ('palpluss', 'paystack', 'paypal', 'mpesa', 'stripe'));

alter table public.verification_deposits
  add constraint verification_deposits_method_supported_check
  check (method in ('palpluss', 'paystack', 'paypal', 'mpesa', 'stripe'));

