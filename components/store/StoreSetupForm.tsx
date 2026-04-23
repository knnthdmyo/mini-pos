"use client";

import { useState, useTransition, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { saveStoreSettings } from "@/lib/actions/store";
import { deleteBanner } from "@/lib/actions/store";
import { THEME_PRESETS } from "@/lib/themes";
import type { ThemePreset } from "@/lib/themes";
import ImageUpload from "@/components/ui/ImageUpload";
import ThemePreview from "@/components/store/ThemePreview";

const HexColorPicker = lazy(() =>
  import("react-colorful").then((m) => ({ default: m.HexColorPicker })),
);

interface StoreSetupFormProps {
  mode: "onboarding" | "edit";
  userId: string;
  initialValues?: {
    storeName: string;
    bannerUrl: string | null;
    theme: ThemePreset;
    customPrimary?: string | null;
    customSecondary?: string | null;
  };
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-10 w-10 shrink-0 rounded-lg border-2 border-gray-200 shadow-sm transition-shadow hover:shadow-md"
          style={{ backgroundColor: value }}
          aria-label={`Pick ${label.toLowerCase()}`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v.length <= 7) onChange(v.startsWith("#") ? v : `#${v}`);
          }}
          placeholder="#4F46E5"
          maxLength={7}
          className="w-28 rounded-lg border border-brand-border px-3 py-2 text-sm font-mono text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none"
        />
      </div>
      {open && (
        <Suspense
          fallback={
            <div className="h-[200px] w-full max-w-[200px] animate-pulse rounded-lg bg-gray-100" />
          }
        >
          <HexColorPicker color={value} onChange={onChange} />
        </Suspense>
      )}
    </div>
  );
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
  const [customPrimary, setCustomPrimary] = useState(
    initialValues?.customPrimary ?? "#4F46E5",
  );
  const [customSecondary, setCustomSecondary] = useState(
    initialValues?.customSecondary ?? "#6366F1",
  );
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

    if (theme === "custom") {
      if (!HEX_RE.test(customPrimary)) {
        setError("Primary color must be a valid hex (e.g. #4F46E5).");
        return;
      }
      if (!HEX_RE.test(customSecondary)) {
        setError("Secondary color must be a valid hex (e.g. #6366F1).");
        return;
      }
    }

    startTransition(async () => {
      try {
        if (mode === "edit" && bannerRemoved && initialValues?.bannerUrl) {
          await deleteBanner();
        }

        await saveStoreSettings({
          storeName: trimmed,
          bannerUrl,
          theme,
          customPrimary: theme === "custom" ? customPrimary : null,
          customSecondary: theme === "custom" ? customSecondary : null,
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
          className="mt-1 block w-full rounded-md border border-brand-border px-3 py-2 text-sm text-brand-text bg-brand-surface/40 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
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
                  ? "border-brand-primary bg-brand-primary/10 font-semibold text-brand-primary"
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

      {/* Custom Color Pickers */}
      {theme === "custom" && (
        <div className="space-y-4 rounded-xl border border-brand-border/50 bg-brand-surface/30 p-4">
          <p className="text-sm font-medium text-gray-700">Custom Colors</p>
          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Primary"
              value={customPrimary}
              onChange={setCustomPrimary}
            />
            <ColorField
              label="Secondary"
              value={customSecondary}
              onChange={setCustomSecondary}
            />
          </div>
        </div>
      )}

      {/* Live Preview */}
      <ThemePreview
        storeName={storeName}
        bannerUrl={bannerUrl}
        theme={theme}
        customPrimary={customPrimary}
        customSecondary={customSecondary}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 disabled:opacity-50"
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
