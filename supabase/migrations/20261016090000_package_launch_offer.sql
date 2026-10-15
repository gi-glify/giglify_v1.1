alter table public.package_tiers
  add column if not exists offer_price_usd numeric(10,2);

alter table public.package_tiers drop constraint if exists package_tiers_offer_price_check;
alter table public.package_tiers add constraint package_tiers_offer_price_check
  check (offer_price_usd is null or (offer_price_usd > 0 and offer_price_usd < price_usd));

update public.package_tiers set offer_price_usd = null where tier = 'free';
update public.package_tiers set offer_price_usd = 3.00 where tier = 'pro';
update public.package_tiers set offer_price_usd = 7.00 where tier = 'elite';
update public.package_tiers set offer_price_usd = 10.00 where tier = 'max';

alter table public.transactions
  add column if not exists package_offer_applied boolean not null default false;
