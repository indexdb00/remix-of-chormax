create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists stories_expires_at_idx on public.stories (expires_at desc);
create index if not exists stories_author_created_idx on public.stories (author_id, created_at desc);
alter table public.stories enable row level security;
drop policy if exists "Anyone can view active stories" on public.stories;
create policy "Anyone can view active stories" on public.stories for select using (expires_at > now());
drop policy if exists "Users can create own stories" on public.stories;
create policy "Users can create own stories" on public.stories for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Users can delete own stories" on public.stories;
create policy "Users can delete own stories" on public.stories for delete to authenticated using (auth.uid() = author_id);
