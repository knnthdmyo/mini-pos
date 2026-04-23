"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveStoreSettings } from "@/lib/actions/store";
import { deleteBanner } from "@/lib/actions/store";
import { THEME_PRESETS } from "@/lib/themes";
import type { ThemePreset } from "@/lib/themes";
import ImageUpload from "@/components/ui/ImageUpload";
import ThemePreview from "@/components/store/ThemePreview";

interface StoreSetupFormProps {
  mode: "onboarding" | "edit";
  userId: string;
  initialValues?: {
    storeName: string;
    bannerUrl: string | null;
    theme: ThemePreset;
  };
}

export default function StoreSetupForm({
  mode,
  userId,
  initialValues,
}: StoreSetupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [storeName, setStoreName] = useState(initialValues?.storeName ?? "");
  const [bannerUrl, setBannerUrl] = useState<string | null>(
    initialValues?.bannerUrl ?? null,
  );
  const [theme, setTheme] = useState<ThemePreset>(
    initialValues?.theme ?? "light",
  );
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Track if banner was removed (for edit mode)
  const [bannerRemoved, setBannerRemoved] = useState(false);

  function handleBannerUpload(url: string | null) {
    setBannerUrl(url);
    setUploadError(null);
    if (url === null) {
      setBannerRemoved(true);
    } else {
      setBannerRemoved(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = storeName.trim();
    if (!trimmed) {
      setError("Store name is required.");
      return;
    }

    startTransition(async () => {
      try {
        // If banner was removed in edit mode, delete from storage
        if (mode === "edit" && bannerRemoved && initialValues?.bannerUrl) {
          await deleteBanner();
        }

        await saveStoreSettings({
          storeName: trimmed,
          bannerUrl,
          theme,
        });

        router.push("/pos");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save settings.",
        );
      }
    });
  }

  function handleSkip() {
    startTransition(async () => {
      try {
        await saveStoreSettings({
          storeName: "My Store",
          bannerUrl: null,
          theme: "light",
        });
        router.push("/pos");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save defaults.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "onboarding" ? "Set Up Your Store" : "Store Settings"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {mode === "onboarding"
            ? "Personalize your store with a name, banner, and theme."
            : "Update your store branding and theme."}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Store Name */}
      <div>
        <label
          htmlFor="store-name"
          className="block text-sm font-medium text-gray-700"
        >
          Store Name <span className="text-red-500">*</span>
        </label>
        <input
          id="store-name"
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="e.g. Sweet Treats POS"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Banner Upload */}
      <ImageUpload
        userId={userId}
        currentUrl={bannerUrl}
        onUpload={handleBannerUpload}
        onError={(msg) => setUploadError(msg)}
      />
      {uploadError && <p className="text-sm text-amber-600">{uploadError}</p>}

      {/* Theme Selection */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">
          Theme
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setTheme(preset.value)}
              className={`rounded-lg border-2 p-3 text-center text-sm transition-colors ${
                theme === preset.value
                  ? "border-indigo-600 bg-indigo-50 font-semibold text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="font-medium">{preset.label}</div>
              <div className="mt-0.5 text-xs text-gray-500">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Live Preview */}
      <ThemePreview storeName={storeName} bannerUrl={bannerUrl} theme={theme} />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending
            ? "Saving..."
            : mode === "onboarding"
              ? "Save & Continue"
              : "Save Changes"}
        </button>

        {mode === "onboarding" && (
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Set up later
          </button>
        )}
      </div>
    </form>
  );
}
