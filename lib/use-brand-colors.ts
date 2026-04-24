"use client";

import { useMemo } from "react";

function cssVar(name: string): string {
  if (typeof window === "undefined") return "99 102 241"; // fallback indigo
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function rgbToHex(rgb: string): string {
  const parts = rgb.split(" ").map(Number);
  if (parts.length < 3) return "#6366f1";
  return (
    "#" +
    parts
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHexAlpha(rgb: string, alpha: number): string {
  const parts = rgb.split(" ").map(Number);
  if (parts.length < 3) return `rgba(99,102,241,${alpha})`;
  return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
}

export function useBrandColors() {
  return useMemo(() => {
    const primary = cssVar("--brand-primary");
    const accent = cssVar("--brand-accent");
    return {
      primary: rgbToHex(primary),
      accent: rgbToHex(accent),
      primaryAlpha: (a: number) => rgbToHexAlpha(primary, a),
      accentAlpha: (a: number) => rgbToHexAlpha(accent, a),
    };
  }, []);
}

function hexToRgbArr(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgbArr(a);
  const [r2, g2, b2] = hexToRgbArr(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

/** Generate palette of shades from primary + accent for pie slices */
export function useBrandPalette(count: number): string[] {
  const { primary, accent } = useBrandColors();
  return useMemo(() => {
    if (count <= 0) return [];
    if (count === 1) return [primary];
    if (count === 2) return [primary, accent];
    const palette: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      palette.push(lerpColor(primary, accent, t));
    }
    return palette;
  }, [count, primary, accent]);
}
