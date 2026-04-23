import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import OnboardingCheck from "@/components/materials/OnboardingCheck";
import { getStoreSettings } from "@/lib/actions/store";
import { StoreSettingsProvider } from "@/components/store/StoreSettingsProvider";
import StoreHeader from "@/components/store/StoreHeader";

const navItems = [
  { href: "/pos", label: "POS", icon: "🛒" },
  { href: "/manage", label: "Inventory", icon: "📋" },
  { href: "/reports", label: "Reports", icon: "📊" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getUser();

  if (!user) {
    redirect("/login");
  }

  const storeSettings = await getStoreSettings();

  // Redirect to setup if no store settings exist
  // /setup lives outside (dashboard) so this won't loop
  if (!storeSettings) {
    redirect("/setup");
  }

  return (
    <StoreSettingsProvider
      storeName={storeSettings.storeName}
      bannerUrl={storeSettings.bannerUrl}
      theme={storeSettings.theme}
      email={user.email ?? ""}
    >
      <div className="flex min-h-screen flex-col">
        <Suspense fallback={null}>
          <OnboardingCheck />
        </Suspense>
        <StoreHeader />
        <main className="flex-1 overflow-hidden pb-16">{children}</main>
        <nav className="fixed bottom-0 inset-x-0 z-50 flex h-16 items-stretch border-t border-gray-200 bg-white">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 active:bg-gray-100"
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </StoreSettingsProvider>
  );
}
