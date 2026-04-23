# Data Model: Branding & Theme Onboarding

**Feature**: 003-branding-theme-onboarding
**Date**: 2026-04-23

## Entities

### store_settings

Stores the branding configuration for each user's store. One row per authenticated user (enforced by unique constraint on `user_id`).

| Column       | Type          | Constraints                                                             | Description                                            |
| ------------ | ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| `id`         | `uuid`        | PK, default `gen_random_uuid()`                                         | Primary key                                            |
| `user_id`    | `uuid`        | NOT NULL, UNIQUE, FK → `auth.users(id)` ON DELETE CASCADE               | Owner of these settings                                |
| `store_name` | `text`        | NOT NULL, CHECK `length(trim(store_name)) > 0`                          | Display name for the store                             |
| `banner_url` | `text`        | nullable                                                                | Public URL of uploaded banner/logo in Supabase Storage |
| `theme`      | `text`        | NOT NULL, DEFAULT `'light'`, CHECK `theme IN ('light', 'dark', 'warm')` | Selected theme preset                                  |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                                               | Row creation timestamp                                 |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                                               | Last modification timestamp                            |

**Relationships**:

- `user_id` → `auth.users(id)` (one-to-one, cascade delete)

**Validation rules**:

- `store_name` must be non-empty after trimming (enforced at DB level + form validation)
- `theme` must be one of the allowed presets (enforced at DB level + form validation)
- `banner_url` is optional — system renders header without banner if null

**State transitions**: None. This is a configuration record, not a stateful entity.

### Supabase Storage: `store-banners` bucket

| Property     | Value                                   |
| ------------ | --------------------------------------- |
| Bucket name  | `store-banners`                         |
| Public       | Yes (public read)                       |
| File path    | `{user_id}/banner.{ext}`                |
| Allowed MIME | `image/jpeg`, `image/png`, `image/webp` |
| Max size     | 2 MB                                    |

**Rules**:

- One banner file per user (overwrite on replacement)
- Old file must be deleted before uploading a new one (stale URL cleanup)
- RLS: authenticated users can only write to their own `{user_id}/` folder

## Migration: `018_store_settings.sql`

```sql
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

-- Index for fast lookup by user_id (unique constraint creates this implicitly)
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

-- ─── Supabase Storage bucket ─────────────────────────────────────────────────
-- NOTE: Storage bucket creation is done via Supabase dashboard or CLI, not SQL.
-- Bucket: store-banners (public)
-- Policies:
--   SELECT: public (anyone can read)
--   INSERT/UPDATE/DELETE: authenticated, path starts with auth.uid()::text
```

## Entity Relationship

```
auth.users (1) ──── (0..1) store_settings
                              │
                              └── banner_url → Supabase Storage: store-banners/{user_id}/banner.*
```
