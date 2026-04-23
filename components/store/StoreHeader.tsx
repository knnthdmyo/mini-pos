"use client";

import { useStoreSettings } from "@/components/store/StoreSettingsProvider";

export default function StoreHeader() {
  const { storeName, bannerUrl } = useStoreSettings();

  return (
    <header className="relative flex items-center gap-3 bg-brand-surface px-4 py-3">
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerUrl}
          alt={`${storeName} banner`}
          className="h-10 w-10 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-lg font-bold text-brand-primary">
          {storeName.charAt(0).toUpperCase()}
        </div>
      )}
      <h1 className="text-lg font-bold text-brand-text">{storeName}</h1>
    </header>
  );
}
