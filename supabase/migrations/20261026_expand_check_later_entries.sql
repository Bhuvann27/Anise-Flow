-- ANISE Flow: expand the existing Instagram Research store into the generic Check Later inbox.
alter table public.instagram_research add column if not exists name text;
alter table public.instagram_research add column if not exists source_category text;
alter table public.instagram_research add column if not exists profile_url text;
alter table public.instagram_research add column if not exists contact text;
alter table public.instagram_research add column if not exists potential_score integer not null default 5;

update public.instagram_research
set
  name = coalesce(name, account_name, nullif(handle, '')),
  source_category = coalesce(source_category, category, 'Instagram'),
  profile_url = coalesce(profile_url, instagram_url);

alter table public.instagram_research alter column handle drop not null;
alter table public.instagram_research alter column source_category set default 'Instagram';
alter table public.instagram_research alter column category set default 'Instagram';
alter table public.instagram_research add constraint instagram_research_potential_score_check check (potential_score between 1 and 10);
create index if not exists instagram_research_source_category_idx on public.instagram_research(source_category);
