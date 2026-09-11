-- Replace the old placeholder STK provider with Safaricom M-Pesa.
-- Existing rows are retained under the canonical provider name.

-- Drop legacy checks before rewriting rows; otherwise PostgreSQL rejects mpesa
-- while the old constraint is still active.
alter table public.transactions drop constraint if exists transactions_provider_check;
alter table public.payment_attempts drop constraint if exists payment_attempts_provider_check;
alter table public.payout_accounts drop constraint if exists payout_accounts_method_supported_check;
alter table public.verification_deposits drop constraint if exists verification_deposits_method_supported_check;
alter table public.payment_provider_events drop constraint if exists payment_provider_events_provider_check;

update public.transactions set provider = 'mpesa' where provider = 'palpluss';
update public.payment_attempts set provider = 'mpesa' where provider = 'palpluss';
update public.payout_accounts set method = 'mpesa' where method = 'palpluss';
update public.verification_deposits set method = 'mpesa' where method = 'palpluss';
update public.payment_provider_events set provider = 'mpesa' where provider = 'palpluss';

alter table public.transactions add constraint transactions_provider_check
  check (provider is null or provider in ('mpesa', 'paystack', 'paypal'));
alter table public.payment_attempts add constraint payment_attempts_provider_check
  check (provider in ('mpesa', 'paystack', 'paypal'));
alter table public.payout_accounts add constraint payout_accounts_method_supported_check
  check (method in ('mpesa', 'paystack', 'paypal'));
alter table public.verification_deposits add constraint verification_deposits_method_supported_check
  check (method in ('mpesa', 'paystack', 'paypal'));
alter table public.payment_provider_events add constraint payment_provider_events_provider_check
  check (provider in ('mpesa', 'paystack', 'paypal'));
