"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { VALID_THEMES } from "@/lib/themes";
import type { ThemePreset } from "@/lib/themes";

// ── Types ──────────────────────────────────────────────────────────

export interface StoreSettings {
  id: string;
  storeName: string;
  bannerUrl: string | null;
  theme: ThemePreset;
  customPrimary: string | null;
  customSecondary: string | null;
}

// ── getStoreSettings ───────────────────────────────────────────────

export async function getStoreSettings(): Promise<StoreSettings | null> {
  const user = await requireAuth();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("store_settings")
    .select("id, store_name, banner_url, theme, custom_primary, custom_secondary")
    .eq("user_id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    // No row found
    return null;
  }

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    storeName: data.store_name,
    bannerUrl: data.banner_url,
    theme: data.theme as ThemePreset,
    customPrimary: data.custom_primary,
    customSecondary: data.custom_secondary,
  };
}

// ── saveStoreSettings ──────────────────────────────────────────────

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export async function saveStoreSettings(input: {
  storeName: string;
  bannerUrl: string | null;
  theme: string;
  customPrimary?: string | null;
  customSecondary?: string | null;
}): Promise<void> {
  const user = await requireAuth();
  const supabase = createClient();

  const trimmedName = input.storeName.trim();
  if (trimmedName.length === 0) {
    throw new Error("INVALID_STORE_NAME");
  }

  if (!VALID_THEMES.includes(input.theme as ThemePreset)) {
    throw new Error("INVALID_THEME");
  }

  // Validate custom colors when theme is "custom"
  if (input.theme === "custom") {
    if (!input.customPrimary || !HEX_RE.test(input.customPrimary)) {
      throw new Error("INVALID_CUSTOM_PRIMARY");
    }
    if (!input.customSecondary || !HEX_RE.test(input.customSecondary)) {
      throw new Error("INVALID_CUSTOM_SECONDARY");
    }
  }

  const { error } = await supabase
    .from("store_settings")
    .upsert(
      {
        user_id: user.id,
        store_name: trimmedName,
        banner_url: input.bannerUrl,
        theme: input.theme,
        custom_primary: input.theme === "custom" ? input.customPrimary : null,
        custom_secondary: input.theme === "custom" ? input.customSecondary : null,
      },
      { onConflict: "user_id" },
    );

  if (error) throw new Error(error.message);

  revalidatePath("/(dashboard)");
}

// ── deleteBanner ───────────────────────────────────────────────────

export async function deleteBanner(): Promise<void> {
  const user = await requireAuth();
  const supabase = createClient();

  const { data: settings, error: fetchError } = await supabase
    .from("store_settings")
    .select("banner_url")
    .eq("user_id", user.id)
    .single();

  if (fetchError) throw new Error("NO_SETTINGS");

  if (settings.banner_url) {
    // Extract the path from the public URL to delete from storage
    const url = new URL(settings.banner_url);
    const pathParts = url.pathname.split("/storage/v1/object/public/store-banners/");
    if (pathParts[1]) {
      await supabase.storage
        .from("store-banners")
        .remove([decodeURIComponent(pathParts[1])]);
    }
  }

  const { error } = await supabase
    .from("store_settings")
    .update({ banner_url: null })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/(dashboard)");
}
