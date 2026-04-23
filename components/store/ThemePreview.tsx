"use client";

import type { ThemePreset } from "@/lib/themes";
import { generateCustomVars } from "@/lib/themes";

interface ThemePreviewProps {
  storeName: string;
  bannerUrl: string | null;
  theme: ThemePreset;
  customPrimary?: string;
  customSecondary?: string;
}

const PRESET_VARS: Record<Exclude<ThemePreset, "custom">, Record<string, string>> = {
  light: {
    "--brand-bg": "249 250 251",
    "--brand-surface": "255 255 255",
    "--brand-primary": "79 70 229",
    "--brand-accent": "99 102 241",
    "--brand-text": "17 24 39",
    "--brand-muted": "107 114 128",
    "--brand-border": "229 231 235",
  },
  dark: {
    "--brand-bg": "15 23 42",
    "--brand-surface": "30 41 59",
    "--brand-primary": "56 189 248",
    "--brand-accent": "14 165 233",
    "--brand-text": "248 250 252",
    "--brand-muted": "148 163 184",
    "--brand-border": "51 65 85",
  },
  warm: {
    "--brand-bg": "255 251 235",
    "--brand-surface": "254 243 199",
    "--brand-primary": "217 119 6",
    "--brand-accent": "245 158 11",
    "--brand-text": "69 26 3",
    "--brand-muted": "146 64 14",
    "--brand-border": "253 230 138",
  },
  floral: {
    "--brand-bg": "255 241 242",
    "--brand-surface": "255 228 230",
    "--brand-primary": "225 29 72",
    "--brand-accent": "244 63 94",
    "--brand-text": "76 5 25",
    "--brand-muted": "159 18 57",
    "--brand-border": "254 205 211",
  },
};

export default function ThemePreview({
  storeName,
  bannerUrl,
  theme,
  customPrimary,
  customSecondary,
}: ThemePreviewProps) {
  const vars =
    theme === "custom" && customPrimary && customSecondary
      ? generateCustomVars(customPrimary, customSecondary)
      : PRESET_VARS[theme === "custom" ? "light" : theme];

  const style = Object.fromEntries(
    Object.entries(vars).map(([k, v]) => [k, v]),
  ) as React.CSSProperties;

  const displayName = storeName.trim() || "My Store";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Preview</label>
      <div
        style={style}
        className="overflow-hidden rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3 bg-[rgb(var(--brand-surface))] px-4 py-3">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt="Preview banner"
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
              style={{
                backgroundColor: `rgb(${vars["--brand-primary"]} / 0.1)`,
                color: `rgb(${vars["--brand-primary"]})`,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className="text-lg font-bold"
            style={{ color: `rgb(${vars["--brand-text"]})` }}
          >
            {displayName}
          </span>
        </div>
        <div
          className="px-4 py-2"
          style={{ backgroundColor: `rgb(${vars["--brand-bg"]})` }}
        >
          <p
            className="text-xs"
            style={{ color: `rgb(${vars["--brand-muted"]})` }}
          >
            This is how your store header will look.
          </p>
        </div>
      </div>
    </div>
  );
}
