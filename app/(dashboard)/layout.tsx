import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { Suspense } from "react";
import OnboardingCheck from "@/components/materials/OnboardingCheck";
import { getStoreSettings } from "@/lib/actions/store";
import { StoreSettingsProvider } from "@/components/store/StoreSettingsProvider";
import StoreHeader from "@/components/store/StoreHeader";
import { BottomNav } from "@/components/store/BottomNav";

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

  if (!storeSettings) {
    redirect("/setup");
  }

  return (
    <StoreSettingsProvider
      storeName={storeSettings.storeName}
      bannerUrl={storeSettings.bannerUrl}
      theme={storeSettings.theme}
      email={user.email ?? ""}
      customPrimary={storeSettings.customPrimary}
      customSecondary={storeSettings.customSecondary}
    >
      <div className="flex min-h-screen flex-col">
        <Suspense fallback={null}>
          <OnboardingCheck />
        </Suspense>
        <StoreHeader />
        <main className="flex-1 min-h-0 pb-16">{children}</main>
        <BottomNav />
      </div>
    </StoreSettingsProvider>
  );
}
