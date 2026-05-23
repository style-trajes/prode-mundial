create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamptz default now()
);
create table if not exists prode_groups (
  id bigserial primary key,
  name text not null,
  code text unique not null,
  owner_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);
create table if not exists group_members (
  id bigserial primary key,
  group_id bigint references prode_groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  unique(group_id,user_id)
);
create table if not exists predictions (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  group_id bigint references prode_groups(id) on delete cascade,
  match_id int not null,
  home_score int,
  away_score int,
  winner text,
  created_at timestamptz default now(),
  unique(user_id,group_id,match_id)
);
create table if not exists leaderboard (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete cascade,
  group_id bigint references prode_groups(id) on delete cascade,
  points int default 0,
  exact_hits int default 0,
  result_hits int default 0,
  unique(user_id,group_id)
);
create table if not exists bets (
  id bigserial primary key,
  group_id bigint references prode_groups(id) on delete cascade,
  challenger_id uuid references profiles(id) on delete cascade,
  challenged_id uuid references profiles(id) on delete cascade,
  match_id int not null,
  stake text not null,
  status text default 'pending',
  created_at timestamptz default now()
);
create table if not exists messages (
  id bigserial primary key,
  group_id bigint references prode_groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table prode_groups enable row level security;
alter table group_members enable row level security;
alter table predictions enable row level security;
alter table leaderboard enable row level security;
alter table bets enable row level security;
alter table messages enable row level security;

create policy "p1" on profiles for select using (true);
create policy "p2" on profiles for insert with check (auth.uid()=id);
create policy "p3" on profiles for update using (auth.uid()=id);
create policy "g1" on prode_groups for select using (id in (select group_id from group_members where user_id=auth.uid()));
create policy "g2" on prode_groups for insert with check (auth.uid()=owner_id);
create policy "gm1" on group_members for select using (group_id in (select group_id from group_members where user_id=auth.uid()));
create policy "gm2" on group_members for insert with check (auth.uid()=user_id);
create policy "pr1" on predictions for select using (group_id in (select group_id from group_members where user_id=auth.uid()));
create policy "pr2" on predictions for insert with check (auth.uid()=user_id);
create policy "pr3" on predictions for update using (auth.uid()=user_id);
create policy "lb1" on leaderboard for select using (group_id in (select group_id from group_members where user_id=auth.uid()));
create policy "lb2" on leaderboard for insert with check (auth.uid()=user_id);
create policy "lb3" on leaderboard for update using (auth.uid()=user_id);
create policy "b1" on bets for select using (group_id in (select group_id from group_members where user_id=auth.uid()));
create policy "b2" on bets for insert with check (auth.uid()=challenger_id);
create policy "b3" on bets for update using (auth.uid()=challenged_id or auth.uid()=challenger_id);
create policy "m1" on messages for select using (group_id in (select group_id from group_members where user_id=auth.uid()));
create policy "m2" on messages for insert with check (auth.uid()=user_id);

alter publication supabase_realtime add table messages;
