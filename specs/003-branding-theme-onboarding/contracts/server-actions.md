# Server Action Contracts: Branding & Theme Onboarding

**Feature**: 003-branding-theme-onboarding
**File**: `lib/actions/store.ts`
**Date**: 2026-04-23

All actions follow the project convention: `"use server"` directive, `requireAuth()` as first call, Supabase server client for DB operations.

---

## `saveStoreSettings`

Save or update store branding settings for the authenticated user.

**Signature**:

```typescript
export async function saveStoreSettings(data: {
  storeName: string;
  bannerUrl: string | null;
  theme: "light" | "dark" | "warm";
}): Promise<void>;
```

**Behavior**:

1. Call `requireAuth()` → get `user`
2. Validate `storeName` is non-empty after trimming
3. Validate `theme` is one of `'light' | 'dark' | 'warm'`
4. Upsert into `store_settings` with `user_id = user.id`
   - If row exists → update `store_name`, `banner_url`, `theme`
   - If no row → insert new row
5. Call `revalidatePath('/(dashboard)')` to refresh layout data

**Errors**:
| Error | Condition |
|---|---|
| `UNAUTHORIZED` | No valid session |
| `INVALID_STORE_NAME` | Store name is empty or whitespace-only |
| `INVALID_THEME` | Theme value not in allowed list |

**Called from**: `StoreSetupForm` (onboarding), `StoreSetupForm` (settings edit)

---

## `getStoreSettings`

Fetch store settings for the authenticated user. Used server-side in layouts.

**Signature**:

```typescript
export async function getStoreSettings(): Promise<StoreSettings | null>;
```

**Return type**:

```typescript
interface StoreSettings {
  id: string;
  storeName: string;
  bannerUrl: string | null;
  theme: "light" | "dark" | "warm";
}
```

**Behavior**:

1. Call `requireAuth()` → get `user`
2. Query `store_settings` where `user_id = user.id`
3. Return mapped result or `null` if no row exists

**Errors**:
| Error | Condition |
|---|---|
| `UNAUTHORIZED` | No valid session |

**Called from**: `(dashboard)/layout.tsx` (server component)

---

## `deleteBanner`

Delete the current banner image from Supabase Storage and clear the URL in the database.

**Signature**:

```typescript
export async function deleteBanner(): Promise<void>;
```

**Behavior**:

1. Call `requireAuth()` → get `user`
2. Query current `store_settings` for `banner_url`
3. If `banner_url` exists, delete the file from `store-banners` bucket
4. Update `store_settings` set `banner_url = null`
5. Call `revalidatePath('/(dashboard)')`

**Errors**:
| Error | Condition |
|---|---|
| `UNAUTHORIZED` | No valid session |
| `NO_SETTINGS` | No store_settings row exists for user |

**Called from**: `StoreSetupForm` (when user removes banner)

---

## Client-Side Upload (Not a Server Action)

Banner upload happens client-side using the Supabase browser client directly. This is not a Server Action — it's called from `StoreSetupForm` before invoking `saveStoreSettings`.

**Flow**:

1. Validate file type (JPEG, PNG, WebP) and size (≤ 2 MB) client-side
2. Generate path: `{user.id}/banner.{ext}`
3. Delete existing file at that path (if any)
4. Upload: `supabase.storage.from('store-banners').upload(path, file, { upsert: true })`
5. Get public URL: `supabase.storage.from('store-banners').getPublicUrl(path)`
6. Pass `bannerUrl` to `saveStoreSettings`
