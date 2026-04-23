-- Migration: 018_store_settings.sql
-- Feature: Branding & Theme Onboarding (Store Setup)

-- ─── store_settings ───────────────────────────────────────────────────────────
create table if not exists public.store_settings (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          not null unique references auth.users(id) on delete cascade,
  store_name  text          not null check (length(trim(store_name)) > 0),
  banner_url  text,
  theme       text          not null default 'light' check (theme in ('light', 'dark', 'warm')),
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

-- RLS policies
alter table public.store_settings enable row level security;

create policy "Users can read own settings"
  on public.store_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.store_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.store_settings for update
  using (auth.uid() = user_id);

-- Auto-update updated_at on modification
create or replace function public.update_store_settings_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger store_settings_updated_at
  before update on public.store_settings
  for each row execute procedure public.update_store_settings_timestamp();

-- ─── Supabase Storage: store-banners bucket ──────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-banners',
  'store-banners',
  true,
  2097152,  -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Public read access
create policy "Public read store-banners"
  on storage.objects for select
  using (bucket_id = 'store-banners');

-- Authenticated users can upload to their own folder
create policy "Users upload own banners"
  on storage.objects for insert
  with check (
    bucket_id = 'store-banners'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update their own files
create policy "Users update own banners"
  on storage.objects for update
  using (
    bucket_id = 'store-banners'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own files
create policy "Users delete own banners"
  on storage.objects for delete
  using (
    bucket_id = 'store-banners'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
