create table if not exists public.news_article_cache (
  id              uuid primary key default gen_random_uuid(),
  original_url    text        not null unique,
  title           text,
  description     text,
  image_url       text,
  source          text,
  published_at    timestamptz,
  body            text,
  body_paragraphs jsonb       not null default '[]'::jsonb,
  provider        text        not null default 'apify',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists news_article_cache_original_url_idx
  on public.news_article_cache (original_url);

create index if not exists news_article_cache_updated_at_idx
  on public.news_article_cache (updated_at desc);

alter table public.news_article_cache enable row level security;

create policy "news_article_cache anon read"
  on public.news_article_cache for select
  to anon, authenticated
  using (true);
