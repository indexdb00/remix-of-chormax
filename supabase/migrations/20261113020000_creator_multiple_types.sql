alter table public.creator_profiles
  add column if not exists creator_types text[] not null default '{}'::text[];

update public.creator_profiles
set creator_types = array[creator_type]
where cardinality(creator_types) = 0;

alter table public.creator_profiles
  drop constraint if exists creator_profiles_types_valid;

alter table public.creator_profiles
  add constraint creator_profiles_types_valid
  check (
    creator_types <@ array['dev', 'gamer', 'mentoria']::text[]
    and cardinality(creator_types) between 1 and 3
  );
