"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/pos", label: "POS", icon: "🛒" },
  { href: "/manage", label: "Inventory", icon: "📋" },
  { href: "/reports", label: "Reports", icon: "📊" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex h-16 items-stretch glass-heavy rounded-t-2xl">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
              isActive
                ? "text-brand-primary font-semibold"
                : "text-brand-muted hover:text-brand-primary/70",
            ].join(" ")}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-1 h-1 w-6 rounded-full bg-brand-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
