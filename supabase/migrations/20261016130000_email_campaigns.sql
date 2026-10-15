alter table public.profiles
  add column if not exists marketing_email_opt_out boolean not null default false,
  add column if not exists marketing_email_opted_out_at timestamptz;

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  subject text not null check (char_length(trim(subject)) between 1 and 180),
  message text not null check (char_length(trim(message)) between 1 and 8000),
  template text not null default 'custom',
  audience text not null default 'all_confirmed' check (audience = 'all_confirmed'),
  status text not null default 'sending' check (status in ('sending', 'sent', 'partial', 'failed')),
  recipient_count integer not null default 0 check (recipient_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null check (char_length(trim(email)) between 5 and 320),
  recipient_name text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

create index if not exists email_campaigns_created_at_idx on public.email_campaigns(created_at desc);
create index if not exists email_campaign_recipients_campaign_idx on public.email_campaign_recipients(campaign_id, status);

alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;

drop policy if exists "email campaigns: admin read" on public.email_campaigns;
create policy "email campaigns: admin read" on public.email_campaigns
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "email campaign recipients: admin read" on public.email_campaign_recipients;
create policy "email campaign recipients: admin read" on public.email_campaign_recipients
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
