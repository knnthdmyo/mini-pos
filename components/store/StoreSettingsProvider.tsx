"use client";

import { createContext, useContext } from "react";
import type { ThemePreset } from "@/lib/themes";

interface StoreSettingsContextValue {
  storeName: string;
  bannerUrl: string | null;
  theme: ThemePreset;
  email: string;
}

const StoreSettingsContext = createContext<StoreSettingsContextValue | null>(
  null,
);

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error(
      "useStoreSettings must be used within StoreSettingsProvider",
    );
  }
  return ctx;
}

export function StoreSettingsProvider({
  storeName,
  bannerUrl,
  theme,
  email,
  children,
}: StoreSettingsContextValue & { children: React.ReactNode }) {
  return (
    <StoreSettingsContext.Provider
      value={{ storeName, bannerUrl, theme, email }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}
