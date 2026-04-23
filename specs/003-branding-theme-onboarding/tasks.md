# Tasks: Branding & Theme Onboarding (Store Setup)

**Input**: Design documents from `/specs/003-branding-theme-onboarding/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration, storage bucket, and project scaffolding

- [x] T001 Create database migration for `store_settings` table with RLS policies and `updated_at` trigger in `supabase/migrations/018_store_settings.sql` — include `theme` column with `DEFAULT 'light'`
- [x] T002 [P] Create Supabase Storage bucket `store-banners` (public, allowed MIME: image/jpeg, image/png, image/webp, max 2 MB) with RLS policies restricting writes to `{user_id}/` folder — via Supabase Dashboard or CLI per `quickstart.md` _(manual step — must be done via Dashboard)_

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Theme system, settings context, and server action infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Add CSS custom properties for `light`, `dark`, and `warm` theme presets in `app/globals.css` under `@layer base`, scoped to `[data-theme="light"]`, `[data-theme="dark"]`, `[data-theme="warm"]` selectors — define `--brand-bg`, `--brand-primary`, `--brand-accent`, `--brand-text`, `--brand-surface` etc.
- [x] T004 [P] Extend `tailwind.config.ts` to add `brand` color references using CSS custom properties (`bg: 'var(--brand-bg)'`, `primary: 'var(--brand-primary)'`, etc.) under `theme.extend.colors.brand`
- [x] T005 [P] Create theme preset definitions with display names and color mappings in `lib/themes.ts` — export `THEME_PRESETS` array and `ThemePreset` type (`'light' | 'dark' | 'warm'`)
- [x] T006 [P] Implement `getStoreSettings` server action in `lib/actions/store.ts` — `requireAuth()`, query `store_settings` by `user_id`, return `StoreSettings | null` per contract
- [x] T007 [P] Create `StoreSettingsProvider` React context in `components/store/StoreSettingsProvider.tsx` — provide `storeName`, `bannerUrl`, `theme` to all dashboard children, with `useStoreSettings()` hook
- [x] T008 Modify `app/layout.tsx` to call `getStoreSettings()` server-side and set `data-theme` on the `<html>` element directly — default to `"light"` if no settings exist. This is the ONLY place theme is applied to the DOM (depends on T006)

**Checkpoint**: Foundation ready — theme CSS custom properties resolve, brand colors available in Tailwind, settings context exists, `getStoreSettings` action available

---

## Phase 3: User Story 1 — First-Time Store Setup (Priority: P1) 🎯 MVP

**Goal**: New users are redirected to an onboarding screen where they enter a store name, upload a banner, select a theme, and save — or skip to use defaults. Settings are persisted and the user is redirected to the dashboard with branding applied.

**Independent Test**: Create a new user account, log in, verify redirect to `/setup`, complete the form (or tap Skip), save, and verify settings are stored in `store_settings` and theme is applied.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create `ImageUpload` client component in `components/ui/ImageUpload.tsx` — file input with client-side validation (JPEG/PNG/WebP, ≤ 2 MB), preview, upload to Supabase Storage `store-banners/{user_id}/banner.{ext}` using browser client, return public URL via `getPublicUrl()`. Before uploading a new banner, list and delete existing files in `store-banners/{user_id}/` to prevent orphaned storage objects when the file extension changes
- [x] T010 [P] [US1] Implement `saveStoreSettings` server action in `lib/actions/store.ts` — `requireAuth()`, validate `storeName` non-empty and `theme` in allowed list, upsert into `store_settings`, call `revalidatePath('/(dashboard)')` per contract
- [x] T011 [P] [US1] Implement `deleteBanner` server action in `lib/actions/store.ts` — `requireAuth()`, delete file from `store-banners` bucket, set `banner_url = null`, call `revalidatePath('/(dashboard)')` per contract
- [x] T012 [US1] Create `StoreSetupForm` client component in `components/store/StoreSetupForm.tsx` — form with store name input (required), `ImageUpload` for banner, theme preset selector using `THEME_PRESETS` from `lib/themes.ts`, calls `saveStoreSettings` on submit, handles loading/error states. Handle partial failure: if banner upload fails, still allow `saveStoreSettings` with `bannerUrl = null` and show upload error inline (depends on T009, T010, T011, T005)
- [x] T013 [US1] Add "Skip" / "Set up later" button to `StoreSetupForm` in `components/store/StoreSetupForm.tsx` — when tapped, call `saveStoreSettings` with default values (`storeName = "My Store"`, `theme = "light"`, `bannerUrl = null`), then redirect to `/pos`. Ensures onboarding is dismissible per constitution UX Rules (depends on T012)
- [x] T014 [US1] Create onboarding page in `app/(dashboard)/setup/page.tsx` — server component that renders `StoreSetupForm` in onboarding mode, redirects to `/pos` after successful save (depends on T012, T013)
- [x] T015 [US1] Modify `app/(dashboard)/layout.tsx` — call `getStoreSettings()` for redirect-to-setup logic: if no settings and path ≠ `/setup`, redirect to `/setup`. Wrap children in `StoreSettingsProvider` with fetched settings. Does NOT propagate theme to root layout — theme application on `<html>` is handled by T008 in `app/layout.tsx` (depends on T006, T007)

**Checkpoint**: New users are redirected to `/setup`, can complete onboarding or skip with defaults, settings are persisted, theme is applied. User Story 1 is fully functional.

---

## Phase 4: User Story 2 — Global Branding Application (Priority: P1)

**Goal**: Store name and banner are visible in the header of all dashboard screens (POS, Queue, Batch, Inventory, Reports). Selected theme is applied globally.

**Independent Test**: Save store settings, navigate to POS, Queue, Reports, Batch, and Inventory screens — verify store name + banner appear in each header and theme colors are consistent.

### Implementation for User Story 2

- [x] T016 [US2] Create `StoreHeader` component in `components/store/StoreHeader.tsx` — reads from `useStoreSettings()` context, renders store name and banner (if present), uses `brand-*` Tailwind colors, handles missing banner gracefully
- [x] T017 [US2] Integrate `StoreHeader` into all dashboard screen pages: `app/(dashboard)/pos/page.tsx`, `app/(dashboard)/queue/page.tsx`, `app/(dashboard)/batch/page.tsx`, `app/(dashboard)/inventory/page.tsx`, `app/(dashboard)/reports/page.tsx` — add header above existing content

**Checkpoint**: Store name and banner display consistently across all dashboard screens. Theme colors apply globally. User Story 2 is fully functional.

---

## Phase 5: User Story 3 — Edit Store Settings (Priority: P2)

**Goal**: Users who have completed onboarding can access a settings page to update store name, replace banner, or change theme. Changes take effect immediately.

**Independent Test**: Navigate to `/settings` after onboarding, modify each field, save, and verify updates are reflected on all screens without manual reload.

### Implementation for User Story 3

- [x] T018 [US3] Create settings page in `app/(dashboard)/settings/page.tsx` — server component that fetches current `store_settings` via `getStoreSettings()` and renders `StoreSetupForm` in edit mode (pre-populated with current values)
- [x] T019 [US3] Add a gear icon to the bottom nav bar in `app/(dashboard)/layout.tsx` linking to `/settings`

**Checkpoint**: Users can edit all store settings after onboarding. Changes persist and reflect immediately. User Story 3 is fully functional.

---

## Phase 6: User Story 4 — Live Preview During Setup (Priority: P3)

**Goal**: Users see a real-time preview of their store header (name, banner, theme colors) while filling out the onboarding or settings form, before saving.

**Independent Test**: On the setup/settings form, type a store name, upload a banner, switch themes — verify the preview area updates in real time without saving.

### Implementation for User Story 4

- [x] T020 [US4] Create `ThemePreview` component in `components/store/ThemePreview.tsx` — renders a mock store header preview with live-bound `storeName`, `bannerUrl` (local object URL), and `theme` props, applies theme CSS custom properties scoped to the preview container
- [x] T021 [US4] Integrate `ThemePreview` into `StoreSetupForm` in `components/store/StoreSetupForm.tsx` — pass current form state (store name, selected banner, selected theme) as props, update preview on every form change

**Checkpoint**: Preview updates in real time as the user modifies form fields. User Story 4 is fully functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge case hardening and final validation

- [x] T022 [P] Verify edge cases: empty store name validation error, file type rejection for non-images, file size rejection for > 2 MB, banner-less header rendering (no broken image), network failure during upload preserves other form data, skip button creates defaults correctly
- [x] T023 [P] Verify theme renders on first paint with no flash of unstyled content (FOUC) — confirm `data-theme` is set server-side in the HTML response by `app/layout.tsx`
- [x] T024 Run `quickstart.md` end-to-end validation: apply migration, create storage bucket, start dev server, test full onboarding → skip → global branding → settings edit → theme switching flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — delivers the onboarding flow
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) — can run in parallel with US1 for the StoreHeader component, but full testing requires US1 (settings must exist)
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) — can run in parallel with US1/US2 for the settings page, but full testing requires US1 (onboarding must be completed first)
- **US4 (Phase 6)**: Depends on US1 (Phase 3) — modifies StoreSetupForm created in US1
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **US2 (P1)**: Can start after Foundational (Phase 2) — StoreHeader is independent, but integration testing requires saved settings from US1
- **US3 (P2)**: Can start after Foundational (Phase 2) — settings page is independent, but requires StoreSetupForm from US1
- **US4 (P3)**: Depends on US1 — modifies the StoreSetupForm component

### Within Each User Story

- Models/types before services
- Server actions before client components
- Client components before pages
- Core implementation before integration

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel
- **Phase 2**: T003, T004, T005, T006, T007 can ALL run in parallel (different files); T008 depends on T006
- **Phase 3**: T009, T010, T011 can run in parallel (different files); T012 depends on T009, T010, T011; T013 depends on T012; T014 depends on T012, T013; T015 depends on T006, T007
- **Phase 4**: T016 can start as soon as Phase 2 is done; T017 depends on T016
- **Phase 5**: T018 depends on US1 (StoreSetupForm); T019 is independent
- **Phase 6**: T020 is independent; T021 depends on T020 and T012
- **Phase 7**: T022 and T023 can run in parallel; T024 runs last

---

## Parallel Example: Phase 2 (Foundational)

```
# Parallel foundational tasks (different files):
T003: Add theme CSS custom properties in app/globals.css
T004: Extend tailwind.config.ts with brand colors
T005: Create theme presets in lib/themes.ts
T006: Implement getStoreSettings in lib/actions/store.ts
T007: Create StoreSettingsProvider in components/store/StoreSettingsProvider.tsx

# Then (depends on T006):
T008: Modify app/layout.tsx — call getStoreSettings(), set data-theme on <html>
```

## Parallel Example: User Story 1

```
# Launch all independent tasks for US1 together:
T009: Create ImageUpload in components/ui/ImageUpload.tsx
T010: Implement saveStoreSettings in lib/actions/store.ts
T011: Implement deleteBanner in lib/actions/store.ts

# Then sequentially:
T012: Create StoreSetupForm (depends on T009, T010, T011)
T013: Add Skip button to StoreSetupForm (depends on T012)
T014: Create setup page (depends on T012, T013)
T015: Modify dashboard layout (depends on T006, T007)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration + storage bucket)
2. Complete Phase 2: Foundational (theme CSS, brand colors, context, server action)
3. Complete Phase 3: User Story 1 (onboarding form + skip + redirect)
4. **STOP and VALIDATE**: New user can complete onboarding (or skip), settings persisted, theme applied
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (First-Time Setup) → Test → Deploy (MVP!)
3. Add US2 (Global Branding) → Test → Deploy (store identity visible everywhere)
4. Add US3 (Edit Settings) → Test → Deploy (ongoing management)
5. Add US4 (Live Preview) → Test → Deploy (polish)
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No test framework configured — validation is manual per quickstart.md
- Storage bucket creation (T002) is a manual step via Supabase Dashboard
- Server actions: `saveStoreSettings`, `getStoreSettings`, `deleteBanner` (all in `lib/actions/store.ts`) — no `uploadBanner` server action; banner upload is client-side via Supabase Storage browser client
