create table if not exists public.creator_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  creator_type text not null check (creator_type in ('dev', 'gamer', 'mentoria')),
  game text,
  offering text,
  updated_at timestamptz not null default now(),
  constraint creator_profiles_gamer_fields check (creator_type <> 'gamer' or (nullif(trim(game), '') is not null and nullif(trim(offering), '') is not null)),
  constraint creator_profiles_mentoria_fields check (creator_type <> 'mentoria' or nullif(trim(offering), '') is not null)
);
alter table public.creator_profiles enable row level security;
drop policy if exists "Users manage own creator profile" on public.creator_profiles;
create policy "Users manage own creator profile" on public.creator_profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.creator_subscriptions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  unique (creator_id, subscriber_id),
  constraint creator_subscriptions_not_self check (creator_id <> subscriber_id)
);
create index if not exists creator_subscriptions_creator_status_idx on public.creator_subscriptions (creator_id, status, created_at desc);
alter table public.creator_subscriptions enable row level security;
drop policy if exists "Creators view their subscribers" on public.creator_subscriptions;
create policy "Creators view their subscribers" on public.creator_subscriptions for select to authenticated using (auth.uid() = creator_id);
