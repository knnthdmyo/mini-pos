# Quickstart: Branding & Theme Onboarding

**Feature**: 003-branding-theme-onboarding
**Date**: 2026-04-23

## Prerequisites

- Node.js 18+
- Supabase project with Auth configured (existing setup)
- Environment variables set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Setup Steps

### 1. Apply Database Migration

```bash
# Run the new migration
supabase db push
# Or apply manually:
# supabase migration up
```

This creates the `store_settings` table with RLS policies.

### 2. Create Supabase Storage Bucket

Via Supabase Dashboard:

1. Go to **Storage** → **New Bucket**
2. Name: `store-banners`
3. Public bucket: **Yes**
4. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
5. Max file size: `2 MB`

Add storage policies:

- **SELECT** (public): Allow all reads
- **INSERT/UPDATE/DELETE** (authenticated): Restrict to `auth.uid()::text = (storage.foldername(name))[1]`

### 3. Install Dependencies

No new dependencies required. Uses existing `@supabase/ssr` and Tailwind CSS.

### 4. Run Development Server

```bash
npm run dev
```

### 5. Verify

1. Log in with an existing or new account
2. You should be redirected to `/setup` (no `store_settings` row exists)
3. Enter a store name, optionally upload a banner, select a theme
4. Save → redirected to `/pos` with branding applied
5. Navigate to `/settings` to edit store settings
6. Verify store name + banner appear in all dashboard screen headers
7. Verify theme colors apply across all pages

## Key Files

| File                                         | Purpose                                   |
| -------------------------------------------- | ----------------------------------------- |
| `supabase/migrations/018_store_settings.sql` | Database table + RLS                      |
| `lib/actions/store.ts`                       | Server Actions (save, get, delete)        |
| `lib/themes.ts`                              | Theme preset definitions                  |
| `app/globals.css`                            | CSS custom properties for themes          |
| `tailwind.config.ts`                         | Brand color references                    |
| `app/(dashboard)/layout.tsx`                 | Fetch settings, redirect, provide context |
| `app/(dashboard)/setup/page.tsx`             | Onboarding page                           |
| `app/(dashboard)/settings/page.tsx`          | Edit settings page                        |
| `components/store/StoreSettingsProvider.tsx` | React context                             |
| `components/store/StoreHeader.tsx`           | Header with name + banner                 |
| `components/store/StoreSetupForm.tsx`        | Form component (shared)                   |
| `components/ui/ImageUpload.tsx`              | Image upload widget                       |
