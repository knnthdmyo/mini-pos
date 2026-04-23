export type ThemePreset = "light" | "dark" | "warm";

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
];

export const VALID_THEMES: ThemePreset[] = ["light", "dark", "warm"];
