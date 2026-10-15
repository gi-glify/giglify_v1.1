-- Update the one-time launch offer without changing regular package prices.
update public.package_tiers set offer_price_usd = 5.00 where tier = 'pro';
update public.package_tiers set offer_price_usd = 7.00 where tier = 'elite';
update public.package_tiers set offer_price_usd = 15.00 where tier = 'max';
