"use client";

import { useRef, useState, useEffect } from "react";
import { useStoreSettings } from "@/components/store/StoreSettingsProvider";
import { logout } from "@/lib/actions/auth";
import Link from "next/link";

export default function StoreHeader() {
  const { storeName, bannerUrl, email } = useStoreSettings();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="relative z-50 flex items-center gap-3 glass-heavy px-4 py-3">
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

      {/* User email dropdown */}
      <div ref={menuRef} className="relative ml-auto">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-[48px] items-center gap-1 rounded-lg px-2 text-sm text-brand-text/70 hover:text-brand-text"
        >
          <span className="max-w-[160px] truncate">{email.split("@")[0]}</span>
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl glass-modal py-1 shadow-lg">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex min-h-[48px] items-center px-4 text-sm text-brand-text hover:bg-brand-primary/10"
            >
              Settings
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex min-h-[48px] w-full items-center px-4 text-sm text-red-600 hover:bg-red-500/10"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
