# Implementation Plan: Branding & Theme Onboarding (Store Setup)

**Branch**: `003-branding-theme-onboarding` | **Date**: 2026-04-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-branding-theme-onboarding/spec.md`

## Summary

Add a first-time onboarding step that lets users configure store branding (name, banner/logo, theme preset) with persistence in Supabase and global application across all dashboard screens. Users may skip onboarding via a "Skip" button, which creates default settings (store_name = "My Store", theme = "light", banner_url = null) so the system functions immediately with defaults. Theme switching uses Tailwind CSS custom property presets applied via a `data-theme` attribute on the root `<html>` element. The root layout (`app/layout.tsx`) fetches store settings server-side via `getStoreSettings()` and sets `data-theme` directly — eliminating any child-to-parent prop passing. Banner images are uploaded client-side to a Supabase Storage public bucket. The dashboard layout fetches store settings once server-side for redirect-to-setup logic and distributes them via React context, adding zero latency to subsequent navigations.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14 App Router)
**Primary Dependencies**: Next.js 14, Supabase JS (@supabase/ssr), Tailwind CSS 3.x, React 18
**Storage**: Supabase PostgreSQL (`store_settings` table) + Supabase Storage (`store-banners` bucket)
**Testing**: Manual acceptance testing (no test framework configured in project)
**Target Platform**: Web — mobile-first tablet (single-device POS)
**Project Type**: Web application (Next.js App Router, fullstack)
**Performance Goals**: Theme renders on first paint (no flash); onboarding adds 0ms latency to POS flow after completion; banner uploads < 5s
**Constraints**: Single-device, mobile-first (bottom nav h-16, pb-20), Tailwind utility classes only, all mutations via Server Actions with `requireAuth()`, no runtime style computation
**Scale/Scope**: Single user per store, one `store_settings` row per user

## Constitution Check (Pre-Design)

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **I. Speed First** — Onboarding is a one-time step; it adds zero taps and zero latency to the POS order creation flow after initial setup. Settings are loaded server-side in the dashboard layout — no additional fetch per page.
- [x] **II. Simplicity Over Completeness** — This feature is explicitly in the v3 Included list. Only preset themes are offered (no custom color pickers). Branding serves store identity, which is a user-facing need.
- [x] **III. Accuracy in Inventory & Profit** — This feature does not touch inventory, orders, or costing. No impact.
- [x] **IV. Human-Error Tolerant** — Store settings are fully editable after onboarding via a dedicated settings page. Onboarding includes a "Skip" button that creates default settings (store_name = "My Store", theme = "light", banner_url = null) — system functions immediately with defaults.
- [x] **V. Single-Device Optimized** — No multi-device coordination. Settings are loaded per session on the single tablet.
- [x] **VI. Personalization Without Performance Cost** — Settings loaded once in dashboard layout (server component) and cached via React context. Theme uses static CSS class swaps (Tailwind custom properties + `data-theme` attribute). The root layout (`app/layout.tsx`) fetches settings and sets `data-theme` on `<html>` server-side — no child-to-parent prop passing required. Banner served from Supabase Storage with caching headers. Onboarding screen only shown once.
- [x] **Scope** — Feature is in the "Included in v3 (Branding & Theme Onboarding)" list in the constitution.
- [x] **Data Integrity** — One row per user enforced by unique constraint on `user_id`. Stale banner URLs cleaned up on replacement. Mutations go through Server Actions with `requireAuth()`.
- [x] **Evolution Rule** — No POS slowdown (settings pre-loaded), no extra taps to core flows, no inventory accuracy impact.

## Project Structure

### Documentation (this feature)

```text
specs/003-branding-theme-onboarding/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── server-actions.md  # Phase 1 output
└── tasks.md             # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   ├── layout.tsx              # MODIFY — fetch store_settings, provide via StoreSettingsProvider context, redirect to /setup if no settings (does NOT set data-theme — root layout handles that)
│   ├── setup/
│   │   └── page.tsx            # NEW — onboarding page (server component, renders form)
│   └── settings/
│       └── page.tsx            # NEW — edit store settings page
├── globals.css                 # MODIFY — add theme custom properties in @layer base
└── layout.tsx                  # MODIFY — fetch store settings via getStoreSettings(), set data-theme on <html> server-side (defaults to "light" if no settings)

components/
├── store/
│   ├── StoreHeader.tsx         # NEW — reusable header showing store name + banner
│   ├── StoreSetupForm.tsx      # NEW — client component for onboarding/settings form
│   ├── ThemePreview.tsx        # NEW — live preview component (P3)
│   └── StoreSettingsProvider.tsx  # NEW — React context provider for store settings
└── ui/
    └── ImageUpload.tsx         # NEW — reusable image upload component

lib/
├── actions/
│   └── store.ts                # NEW — saveStoreSettings, getStoreSettings, deleteBanner server actions
└── themes.ts                   # NEW — theme preset definitions (color mappings)

supabase/
└── migrations/
    └── 018_store_settings.sql  # NEW — store_settings table + RLS + storage bucket
```

**Structure Decision**: Follows existing Next.js App Router conventions. New pages under `(dashboard)/` group. Shared components in `components/store/`. Server Actions in `lib/actions/store.ts` following the established pattern (`requireAuth()` + Supabase client). The `StoreSetupForm.tsx` component handles both save and skip actions — skip creates default settings via `saveStoreSettings` with preset defaults.

**Architecture Note — `data-theme` propagation**: The root layout (`app/layout.tsx`) calls `getStoreSettings()` server-side and sets `data-theme` on the `<html>` element directly (defaulting to `"light"` if no settings exist). This avoids the Next.js App Router constraint where child layouts cannot pass props to parent layouts. The dashboard layout (`app/(dashboard)/layout.tsx`) independently fetches settings for its redirect-to-setup logic and to provide `StoreSettingsProvider` context, but is not responsible for theme application on the root element.

**Stale Banner Cleanup**: Before uploading a new banner, the `ImageUpload` component (or `saveStoreSettings` action) MUST list and delete existing files in `store-banners/{user_id}/` to prevent orphaned storage objects when the file extension changes.

## Constitution Check (Post-Design)

_Re-evaluated after Phase 1 design artifacts are complete._

- [x] **I. Speed First** — Confirmed. Settings query is a single DB call in the dashboard layout (already performs auth check). No additional network round-trips during POS operation. Theme applied via `data-theme` attribute server-side — zero client-side computation.
- [x] **II. Simplicity Over Completeness** — Confirmed. Three preset themes only. No custom color picker, no font customization, no advanced editing. One shared form component for both onboarding and settings edit.
- [x] **III. Accuracy in Inventory & Profit** — Confirmed. No inventory, orders, or cost tables touched.
- [x] **IV. Human-Error Tolerant** — Confirmed. Settings page allows full editing. Onboarding includes a "Skip" button that creates default settings (store_name = "My Store", theme = "light", banner_url = null) — system functions immediately with defaults. Banner removal supported.
- [x] **V. Single-Device Optimized** — Confirmed. No Realtime subscriptions. Settings loaded once server-side per session.
- [x] **VI. Personalization Without Performance Cost** — Confirmed. CSS custom properties in `@layer base` (static). Root layout (`app/layout.tsx`) fetches settings via `getStoreSettings()` and sets `data-theme` on `<html>` server-side — no FOUC, no child-to-parent prop passing. Banner served from public Supabase Storage bucket (CDN-cacheable). React context distributes settings — no re-fetch on page navigation.
- [x] **Scope** — Confirmed. All planned artifacts fall within v3 scope. Excluded items (custom color picker, font customization, multiple themes per user) are not designed.
- [x] **Data Integrity** — Confirmed. Unique constraint on `user_id` prevents duplicates. RLS policies restrict access to owner. `updated_at` trigger maintains audit trail. Stale banner cleanup: before uploading a new banner, existing files in `store-banners/{user_id}/` are listed and deleted to prevent orphaned storage objects when the file extension changes.
- [x] **Evolution Rule** — Confirmed. POS flow untouched. No additional taps. Inventory system unmodified.

## Complexity Tracking

No constitution violations. No complexity justification required.

## Generated Artifacts

| Artifact                | Path                                                              | Phase   |
| ----------------------- | ----------------------------------------------------------------- | ------- |
| Plan                    | `specs/003-branding-theme-onboarding/plan.md`                     | —       |
| Research                | `specs/003-branding-theme-onboarding/research.md`                 | Phase 0 |
| Data Model              | `specs/003-branding-theme-onboarding/data-model.md`               | Phase 1 |
| Server Action Contracts | `specs/003-branding-theme-onboarding/contracts/server-actions.md` | Phase 1 |
| Quickstart              | `specs/003-branding-theme-onboarding/quickstart.md`               | Phase 1 |
