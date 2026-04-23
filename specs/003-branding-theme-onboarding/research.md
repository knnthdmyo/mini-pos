# Research: Branding & Theme Onboarding

**Feature**: 003-branding-theme-onboarding
**Date**: 2026-04-23

## R1: Supabase Storage for Banner Image Uploads

**Decision**: Use Supabase Storage with a public `store-banners` bucket. Upload from the client component using `supabase.storage.from('store-banners').upload()`, then retrieve the public URL via `getPublicUrl()`.

**Rationale**: Supabase Storage is already part of the stack (Supabase is the project's backend). A public bucket avoids the need for signed URLs since banners are displayed in headers across all pages. The `@supabase/ssr` client already instantiated in `lib/supabase/client.ts` can be used directly.

**Alternatives considered**:

- **Signed URLs (private bucket)**: Adds complexity (URL expiry, refresh logic) for no security benefit — banners are inherently public-facing.
- **External CDN (Cloudinary, S3)**: Adds a new dependency and configuration. Unnecessary when Supabase Storage is already available.
- **Base64 in database**: Bloats the database row, hurts query performance, and makes the image non-cacheable.

**Implementation notes**:

- Bucket policy: public read, authenticated write
- File path convention: `{user_id}/banner.{ext}` — one banner per user, overwritten on replacement
- Old file is deleted before uploading replacement (stale URL cleanup per constitution)
- Client-side validation: file type (JPEG, PNG, WebP) and size (≤ 2 MB) before upload
- Server-side: RLS policy restricts writes to the authenticated user's folder

## R2: Tailwind Theme Presets via CSS Custom Properties

**Decision**: Define theme color palettes as CSS custom properties in `globals.css` under `@layer base`, scoped to `[data-theme="light"]`, `[data-theme="dark"]`, and `[data-theme="warm"]` selectors. Reference these properties in `tailwind.config.ts` via `theme.extend.colors`. Apply the theme by setting `data-theme` on the `<html>` element server-side.

**Rationale**: This approach satisfies the constitution requirement of "static CSS class swaps" with no runtime style computation. CSS custom properties are resolved by the browser at paint time, not JavaScript. Setting `data-theme` server-side in the root layout prevents any flash of unstyled content (FOUC). Tailwind utility classes still work normally — `bg-brand-primary`, `text-brand-accent`, etc.

**Alternatives considered**:

- **Tailwind `darkMode: 'class'`**: Only supports two modes (light/dark). We need three presets. The `data-theme` attribute approach is more extensible.
- **CSS-in-JS / runtime style injection**: Violates constitution (no runtime style computation). Also increases bundle size.
- **Multiple Tailwind builds**: Overcomplicated. One config with CSS custom properties is simpler and standard.

**Theme preset definitions**:

- `light`: White backgrounds, indigo accents (current default look)
- `dark`: Slate/gray backgrounds, sky/blue accents, white text
- `warm`: Amber/cream backgrounds, orange accents, warm neutrals

**Implementation notes**:

- `globals.css`: Add `[data-theme="light"] { --brand-bg: ...; --brand-primary: ...; }` etc. in `@layer base`
- `tailwind.config.ts`: Add `colors: { brand: { bg: 'var(--brand-bg)', primary: 'var(--brand-primary)', ... } }`
- `app/layout.tsx`: Render `<html data-theme={theme}>` with theme from store settings
- Bottom nav and existing components reference `brand-*` colors where theming applies

## R3: Onboarding Redirect Pattern in Next.js App Router

**Decision**: Check for store settings in the `(dashboard)/layout.tsx` server component. If no `store_settings` row exists for the authenticated user and the current path is not `/setup`, redirect to `/setup`. After saving, redirect to `/pos`.

**Rationale**: The dashboard layout already performs an auth check (`supabase.auth.getUser()`). Adding a store settings query here is a single additional DB call that happens once per session. This is the established pattern in the project (auth redirect is already in this layout). Server-side redirect avoids any client-side flash.

**Alternatives considered**:

- **Middleware**: More complex, harder to test, and would require duplicating the Supabase client setup. The layout approach is consistent with existing auth patterns.
- **Client-side redirect in a useEffect**: Causes a flash of the dashboard before redirect. Violates UX requirement.
- **Separate onboarding route group**: Adds unnecessary complexity. The `/setup` page can live within the `(dashboard)` group since it shares the same auth requirement.

**Implementation notes**:

- Query: `supabase.from('store_settings').select('*').eq('user_id', user.id).single()`
- If no row exists and path ≠ `/setup`, redirect to `/setup`
- Pass `storeSettings` to `StoreSettingsProvider` context for all child pages
- On first save, insert row; on subsequent saves, update (upsert pattern)

## R4: Store Settings Caching Strategy

**Decision**: Fetch store settings once in the `(dashboard)/layout.tsx` server component and pass them down via a React context provider (`StoreSettingsProvider`). No re-fetching per page navigation within the dashboard.

**Rationale**: Constitution Principle VI requires settings be "loaded once at app initialization and cached for the session." The Next.js App Router's layout component persists across navigations within its route group — it does not re-render when navigating between `/pos`, `/queue`, `/reports`, etc. This gives us session-level caching for free.

**Alternatives considered**:

- **Client-side fetch + localStorage**: Adds client-side complexity, potential stale data, and a loading state. Server component fetch is simpler.
- **SWR / React Query**: Overkill for a single, rarely-changing record. Adds a dependency.
- **Next.js `unstable_cache`**: Could work but the layout already handles this naturally.

**Implementation notes**:

- `StoreSettingsProvider` wraps children in `(dashboard)/layout.tsx`
- Provides: `storeName`, `bannerUrl`, `theme`
- `StoreHeader` component consumes context to render name + banner in headers
- After saving settings on `/setup` or `/settings`, call `revalidatePath('/(dashboard)')` to refresh the layout data
