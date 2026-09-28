-- Run this in the Supabase SQL editor after creating the project.

create table if not exists sessions (
  id text primary key,
  host_id uuid not null,
  created_at timestamptz default now()
);

create table if not exists session_members (
  session_id text references sessions(id) on delete cascade,
  user_id uuid not null,
  name text,
  primary key (session_id, user_id)
);

create table if not exists swipes (
  session_id text references sessions(id) on delete cascade,
  user_id uuid not null,
  restaurant_id bigint not null,
  direction text not null,
  created_at timestamptz default now(),
  primary key (session_id, user_id, restaurant_id)
);

alter table sessions enable row level security;
alter table session_members enable row level security;
alter table swipes enable row level security;

create policy "members read sessions" on sessions for select using (true);
create policy "host insert session" on sessions for insert with check (auth.uid() = host_id);
create policy "members read members" on session_members for select using (true);
create policy "self join" on session_members for insert with check (auth.uid() = user_id);
create policy "members read swipes" on swipes for select using (true);
create policy "self swipe" on swipes for insert with check (auth.uid() = user_id);
create policy "self update swipe" on swipes for update using (auth.uid() = user_id);
