create table if not exists public.support_inbox_messages (
  id uuid primary key default gen_random_uuid(),
  provider_email_id text not null unique,
  message_id text,
  sender_name text,
  sender_email text not null,
  recipients text[] not null default '{}',
  subject text not null,
  text_body text not null,
  thread_key text not null,
  received_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint support_inbox_sender_email_length check (char_length(sender_email) between 5 and 320),
  constraint support_inbox_subject_length check (char_length(subject) between 1 and 180),
  constraint support_inbox_body_length check (char_length(text_body) between 1 and 20000)
);

create index if not exists support_inbox_messages_received_at_idx
  on public.support_inbox_messages (received_at desc);

create index if not exists support_inbox_messages_unread_idx
  on public.support_inbox_messages (read_at, received_at desc);

create index if not exists support_inbox_messages_thread_idx
  on public.support_inbox_messages (thread_key, received_at desc);

alter table public.support_inbox_messages enable row level security;
