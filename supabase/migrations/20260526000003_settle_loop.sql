-- SettleMe — The Settle Loop
-- Adds: reminders, push tokens, verification submissions, vendor users,
--       conversations + messages, events_log, admin flag.
-- Plus: RLS, helper functions, triggers, kyc storage bucket, reminder cron.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- =========================================================================
-- profiles: admin flag
-- =========================================================================
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- =========================================================================
-- reminders
-- =========================================================================
create table public.reminders (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('visa_expiry','event_rsvp','agent_followup','tax_deadline')),
  fire_at     timestamptz not null,
  payload     jsonb not null default '{}'::jsonb,
  channel     text not null default 'push' check (channel in ('push','inapp')),
  fired_at    timestamptz,
  created_at  timestamptz not null default now()
);
create index on public.reminders (profile_id, fire_at);
create index on public.reminders (fire_at) where fired_at is null;

-- =========================================================================
-- push_tokens
-- =========================================================================
create table public.push_tokens (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  expo_token    text not null unique,
  platform      text not null check (platform in ('ios','android','web')),
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index on public.push_tokens (profile_id);

-- =========================================================================
-- verification_submissions
-- =========================================================================
create table public.verification_submissions (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  passport_url      text not null,
  selfie_url        text,
  status            text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by       uuid references public.profiles(id) on delete set null,
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now()
);
create index on public.verification_submissions (status, created_at desc);
create index on public.verification_submissions (profile_id, created_at desc);

-- =========================================================================
-- vendor_users
-- =========================================================================
create table public.vendor_users (
  id             uuid primary key default gen_random_uuid(),
  auth_user_id   uuid not null unique references auth.users(id) on delete cascade,
  vendor_id      uuid not null references public.vendors(id) on delete cascade,
  role           text not null default 'owner' check (role in ('owner','agent')),
  created_at     timestamptz not null default now()
);
create index on public.vendor_users (vendor_id);

-- =========================================================================
-- conversations
-- =========================================================================
create table public.conversations (
  id                     uuid primary key default gen_random_uuid(),
  member_id              uuid not null references public.profiles(id) on delete cascade,
  vendor_id              uuid not null references public.vendors(id) on delete cascade,
  source                 text not null default 'manual' check (source in ('agent','manual','admin')),
  status                 text not null default 'open' check (status in ('open','closed','spam')),
  last_message_at        timestamptz not null default now(),
  last_message_preview   text,
  created_at             timestamptz not null default now(),
  unique (member_id, vendor_id)
);
create index on public.conversations (member_id, last_message_at desc);
create index on public.conversations (vendor_id, last_message_at desc);

-- =========================================================================
-- conversation_messages
-- =========================================================================
create table public.conversation_messages (
  id                       uuid primary key default gen_random_uuid(),
  conversation_id          uuid not null references public.conversations(id) on delete cascade,
  sender_kind              text not null check (sender_kind in ('member','vendor','system','agent')),
  sender_profile_id        uuid references public.profiles(id) on delete set null,
  sender_vendor_user_id    uuid references public.vendor_users(id) on delete set null,
  body                     text not null,
  attachments              jsonb not null default '[]'::jsonb,
  read_at                  timestamptz,
  created_at               timestamptz not null default now()
);
create index on public.conversation_messages (conversation_id, created_at);

-- =========================================================================
-- events_log (analytics primitive)
-- =========================================================================
create table public.events_log (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references public.profiles(id) on delete set null,
  vendor_user_id  uuid references public.vendor_users(id) on delete set null,
  event_name      text not null,
  props           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index on public.events_log (event_name, created_at desc);
create index on public.events_log (profile_id, created_at desc) where profile_id is not null;

-- =========================================================================
-- Helper functions
-- =========================================================================
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_admin from public.profiles where auth_user_id = auth.uid()),
    false
  )
$$;

create or replace function public.my_vendor_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select vendor_id from public.vendor_users where auth_user_id = auth.uid()
$$;

-- =========================================================================
-- Triggers
-- =========================================================================

-- After insert on conversation_messages: bump conversations.last_message_*.
create or replace function public.touch_conversation_last_message() returns trigger as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_message_preview = left(new.body, 140)
   where id = new.conversation_id;
  return new;
end $$ language plpgsql;

create trigger trg_conv_msg_touch
after insert on public.conversation_messages
for each row execute function public.touch_conversation_last_message();

-- After insert/update on identity_graph (with visa_expires_on): sync 90/60/30 day reminders.
create or replace function public.sync_visa_reminders() returns trigger as $$
declare
  d int;
begin
  delete from public.reminders
   where profile_id = new.profile_id
     and kind = 'visa_expiry'
     and fired_at is null;

  if new.visa_expires_on is null then
    return new;
  end if;

  foreach d in array array[90, 60, 30] loop
    if (new.visa_expires_on - (d || ' days')::interval)::timestamptz > now() then
      insert into public.reminders (profile_id, kind, fire_at, payload, channel)
      values (
        new.profile_id,
        'visa_expiry',
        (new.visa_expires_on - (d || ' days')::interval)::timestamptz,
        jsonb_build_object(
          'days_before', d,
          'visa_expires_on', new.visa_expires_on,
          'visa_status', new.visa_status
        ),
        'push'
      );
    end if;
  end loop;

  return new;
end $$ language plpgsql;

create trigger trg_identity_visa_reminders
after insert or update of visa_expires_on on public.identity_graph
for each row execute function public.sync_visa_reminders();

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.reminders                enable row level security;
alter table public.push_tokens              enable row level security;
alter table public.verification_submissions enable row level security;
alter table public.vendor_users             enable row level security;
alter table public.conversations            enable row level security;
alter table public.conversation_messages    enable row level security;
alter table public.events_log               enable row level security;

-- reminders: own profile only.
create policy "reminders: own"
  on public.reminders for all
  using (profile_id = public.my_profile_id())
  with check (profile_id = public.my_profile_id());

-- push_tokens: own profile only.
create policy "push: own"
  on public.push_tokens for all
  using (profile_id = public.my_profile_id())
  with check (profile_id = public.my_profile_id());

-- verification_submissions:
-- members read+insert own; admins read all + update status.
create policy "verif: read own or admin"
  on public.verification_submissions for select
  using (profile_id = public.my_profile_id() or public.is_admin());

create policy "verif: insert own"
  on public.verification_submissions for insert
  with check (profile_id = public.my_profile_id());

create policy "verif: admin update"
  on public.verification_submissions for update
  using (public.is_admin())
  with check (public.is_admin());

-- vendor_users: self read; admin all.
create policy "vendor_users: self read"
  on public.vendor_users for select
  using (auth_user_id = auth.uid() or public.is_admin());

create policy "vendor_users: admin write"
  on public.vendor_users for all
  using (public.is_admin())
  with check (public.is_admin());

-- conversations: member side OR vendor side OR admin.
create policy "conv: read"
  on public.conversations for select
  using (
    member_id = public.my_profile_id()
    or vendor_id in (select public.my_vendor_ids())
    or public.is_admin()
  );

create policy "conv: member insert"
  on public.conversations for insert
  with check (member_id = public.my_profile_id());

create policy "conv: write (member or vendor)"
  on public.conversations for update
  using (
    member_id = public.my_profile_id()
    or vendor_id in (select public.my_vendor_ids())
    or public.is_admin()
  );

-- conversation_messages: read if you can see the conversation; write per role.
create policy "msg: read by participants"
  on public.conversation_messages for select
  using (
    conversation_id in (
      select id from public.conversations
      where member_id = public.my_profile_id()
         or vendor_id in (select public.my_vendor_ids())
         or public.is_admin()
    )
  );

create policy "msg: member sends to own conv"
  on public.conversation_messages for insert
  with check (
    sender_kind = 'member'
    and sender_profile_id = public.my_profile_id()
    and conversation_id in (
      select id from public.conversations where member_id = public.my_profile_id()
    )
  );

create policy "msg: vendor sends to own conv"
  on public.conversation_messages for insert
  with check (
    sender_kind = 'vendor'
    and sender_vendor_user_id in (
      select id from public.vendor_users where auth_user_id = auth.uid()
    )
    and conversation_id in (
      select c.id from public.conversations c
      where c.vendor_id in (select public.my_vendor_ids())
    )
  );

create policy "msg: mark read by participants"
  on public.conversation_messages for update
  using (
    conversation_id in (
      select id from public.conversations
      where member_id = public.my_profile_id()
         or vendor_id in (select public.my_vendor_ids())
    )
  );

-- events_log: any authed user can insert; only admins read.
create policy "events_log: insert"
  on public.events_log for insert
  with check (auth.uid() is not null);

create policy "events_log: admin read"
  on public.events_log for select
  using (public.is_admin());

-- =========================================================================
-- Storage: kyc bucket (private)
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('kyc', 'kyc', false)
on conflict (id) do nothing;

-- Member can write under their own profile id prefix; only admins / service role can read.
create policy "kyc: member write own"
  on storage.objects for insert
  with check (
    bucket_id = 'kyc'
    and (storage.foldername(name))[1] = public.my_profile_id()::text
  );

create policy "kyc: admin read"
  on storage.objects for select
  using (
    bucket_id = 'kyc' and public.is_admin()
  );

-- =========================================================================
-- Realtime publication for live conversation updates + reminders
-- =========================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.conversation_messages;
  exception when duplicate_object then null;
            when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.conversations;
  exception when duplicate_object then null;
            when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.reminders;
  exception when duplicate_object then null;
            when undefined_object then null;
  end;
end $$;

-- =========================================================================
-- pg_cron: reminder-tick every 15 minutes.
-- Configure once per environment:
--   alter database postgres set app.settings.reminder_tick_url = 'https://<proj>.functions.supabase.co/reminder-tick';
--   alter database postgres set app.settings.service_role_key  = '<key>';
-- =========================================================================
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'reminder-tick') then
      perform cron.unschedule('reminder-tick');
    end if;
    perform cron.schedule(
      'reminder-tick',
      '*/15 * * * *',
      $cron$
        select net.http_post(
          url := coalesce(current_setting('app.settings.reminder_tick_url', true), ''),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
          ),
          body := '{}'::jsonb
        )
        where coalesce(current_setting('app.settings.reminder_tick_url', true), '') <> '';
      $cron$
    );
  end if;
end $$;
