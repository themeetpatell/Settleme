-- SettleMe — Row Level Security

alter table public.profiles enable row level security;
alter table public.identity_graph enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_reviews enable row level security;
alter table public.ai_threads enable row level security;
alter table public.ai_messages enable row level security;
alter table public.qa_questions enable row level security;
alter table public.subscriptions enable row level security;

create or replace function public.my_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;

create policy "profiles: read all" on public.profiles for select using (true);
create policy "profiles: insert own" on public.profiles for insert with check (auth_user_id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (auth_user_id = auth.uid());

create policy "identity: own only" on public.identity_graph
  for all using (profile_id = public.my_profile_id())
  with check (profile_id = public.my_profile_id());

create policy "communities: read all" on public.communities for select using (true);

create policy "members: read all" on public.community_members for select using (true);
create policy "members: join self" on public.community_members for insert with check (profile_id = public.my_profile_id());
create policy "members: leave self" on public.community_members for delete using (profile_id = public.my_profile_id());

create policy "posts: read all" on public.posts for select using (true);
create policy "posts: write as self" on public.posts for insert with check (author_id = public.my_profile_id());
create policy "posts: edit own" on public.posts for update using (author_id = public.my_profile_id());

create policy "events: read all" on public.events for select using (true);
create policy "events: write as self" on public.events for insert with check (created_by = public.my_profile_id());

create policy "rsvps: read all" on public.event_rsvps for select using (true);
create policy "rsvps: write self" on public.event_rsvps for insert with check (profile_id = public.my_profile_id());
create policy "rsvps: update self" on public.event_rsvps for update using (profile_id = public.my_profile_id());
create policy "rsvps: delete self" on public.event_rsvps for delete using (profile_id = public.my_profile_id());

create policy "vendors: read all" on public.vendors for select using (true);

create policy "reviews: read all" on public.vendor_reviews for select using (true);
create policy "reviews: write as verified self" on public.vendor_reviews
  for insert with check (
    profile_id = public.my_profile_id()
    and exists (
      select 1 from public.profiles p
      where p.id = public.my_profile_id() and p.verified_at is not null
    )
  );
create policy "reviews: edit own" on public.vendor_reviews for update using (profile_id = public.my_profile_id());

create policy "threads: own only" on public.ai_threads
  for all using (profile_id = public.my_profile_id())
  with check (profile_id = public.my_profile_id());

create policy "messages: own thread" on public.ai_messages
  for all using (
    thread_id in (select id from public.ai_threads where profile_id = public.my_profile_id())
  )
  with check (
    thread_id in (select id from public.ai_threads where profile_id = public.my_profile_id())
  );

create policy "qa: read all" on public.qa_questions for select using (true);

create policy "subs: own only" on public.subscriptions for select using (profile_id = public.my_profile_id());
