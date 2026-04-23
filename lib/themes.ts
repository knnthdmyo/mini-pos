export type ThemePreset = "light" | "dark" | "warm" | "floral" | "custom";

export const THEME_PRESETS: {
  value: ThemePreset;
  label: string;
  description: string;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Clean white with indigo accents",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Slate tones with sky-blue accents",
  },
  {
    value: "warm",
    label: "Warm",
    description: "Amber cream with orange accents",
  },
  {
    value: "floral",
    label: "Floral",
    description: "Soft pink with rose accents",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Pick your own colors",
  },
];

export const VALID_THEMES: ThemePreset[] = [
  "light",
  "dark",
  "warm",
  "floral",
  "custom",
];

/** Convert a hex color string to "R G B" for CSS custom properties. */
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Lighten an RGB triplet string towards white by a ratio (0–1). */
function lighten(rgb: string, ratio: number): string {
  const [r, g, b] = rgb.split(" ").map(Number);
  return [
    Math.round(r + (255 - r) * ratio),
    Math.round(g + (255 - g) * ratio),
    Math.round(b + (255 - b) * ratio),
  ].join(" ");
}

/** Darken an RGB triplet string towards black by a ratio (0–1). */
function darken(rgb: string, ratio: number): string {
  const [r, g, b] = rgb.split(" ").map(Number);
  return [
    Math.round(r * (1 - ratio)),
    Math.round(g * (1 - ratio)),
    Math.round(b * (1 - ratio)),
  ].join(" ");
}

/** Determine if a color is "dark" based on relative luminance. */
function isDark(rgb: string): boolean {
  const [r, g, b] = rgb.split(" ").map(Number);
  return r * 0.299 + g * 0.587 + b * 0.114 < 128;
}

/**
 * Generate all 7 brand CSS variable values from a primary and secondary hex.
 * Returns an object like { "--brand-bg": "R G B", ... }.
 */
export function generateCustomVars(
  primaryHex: string,
  secondaryHex: string,
): Record<string, string> {
  const primary = hexToRgb(primaryHex);
  const secondary = hexToRgb(secondaryHex);
  const dark = isDark(primary);

  return {
    "--brand-bg": dark ? "15 23 42" : lighten(secondary, 0.92),
    "--brand-surface": dark ? "30 41 59" : lighten(secondary, 0.85),
    "--brand-primary": primary,
    "--brand-accent": secondary,
    "--brand-text": dark ? "248 250 252" : darken(primary, 0.7),
    "--brand-muted": dark ? "148 163 184" : darken(secondary, 0.3),
    "--brand-border": dark ? "51 65 85" : lighten(secondary, 0.7),
  };
}
