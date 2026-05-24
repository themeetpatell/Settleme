-- SettleMe — initial schema
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.profiles (auth_user_id);

create table public.identity_graph (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  origin_country text,
  dest_country text,
  dest_city text,
  corridor text,
  arrival_date date,
  visa_status text,
  visa_expires_on date,
  family_size int default 1,
  dependents jsonb default '[]'::jsonb,
  preferred_language text default 'en',
  updated_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null,
  city text,
  diaspora text,
  description text,
  member_count int not null default 0,
  cover_url text,
  created_at timestamptz not null default now()
);
create index on public.communities (kind);
create index on public.communities (city, diaspora);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (community_id, profile_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'post',
  parent_id uuid references public.posts(id) on delete cascade,
  body text not null,
  upvotes int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.posts (community_id, created_at desc);
create index on public.posts (parent_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_name text,
  description text,
  city text not null,
  diaspora text,
  kind text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  capacity int,
  cover_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.events (city, starts_at);
create index on public.events (diaspora, starts_at);

create table public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  city text not null,
  diaspora text,
  description text,
  contact_phone text,
  contact_email text,
  whatsapp text,
  rating numeric(3,2) default 0,
  review_count int not null default 0,
  verified_at timestamptz,
  cover_url text,
  created_at timestamptz not null default now()
);
create index on public.vendors (category, city);

create table public.vendor_reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (vendor_id, profile_id)
);

create table public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.ai_threads (profile_id, updated_at desc);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.ai_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content jsonb not null,
  model text,
  usage jsonb,
  created_at timestamptz not null default now()
);
create index on public.ai_messages (thread_id, created_at);

create table public.qa_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer_md text not null,
  corridor text not null,
  category text not null,
  keywords text[] not null default '{}',
  updated_at timestamptz not null default now()
);
create index on public.qa_questions (corridor, category);
create index on public.qa_questions using gin (keywords);

create table public.subscriptions (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  tier text not null default 'free',
  status text not null default 'active',
  platform text,
  started_at timestamptz,
  renews_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Triggers
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_identity_touch before update on public.identity_graph
  for each row execute function public.touch_updated_at();
create trigger trg_ai_threads_touch before update on public.ai_threads
  for each row execute function public.touch_updated_at();
create trigger trg_qa_touch before update on public.qa_questions
  for each row execute function public.touch_updated_at();
create trigger trg_subs_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

create or replace function public.bump_community_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = new.community_id;
  elsif tg_op = 'DELETE' then
    update public.communities set member_count = greatest(0, member_count - 1) where id = old.community_id;
  end if;
  return null;
end $$ language plpgsql;

create trigger trg_community_member_count
after insert or delete on public.community_members
for each row execute function public.bump_community_count();

create or replace function public.handle_new_auth_user() returns trigger as $$
begin
  insert into public.profiles (auth_user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$ language plpgsql security definer;

create trigger trg_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
