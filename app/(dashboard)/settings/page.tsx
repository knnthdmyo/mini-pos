import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getStoreSettings } from "@/lib/actions/store";
import StoreSetupForm from "@/components/store/StoreSetupForm";

export default async function SettingsPage() {
  const { user } = await getUser();
  if (!user) redirect("/login");

  const settings = await getStoreSettings();
  if (!settings) redirect("/setup");

  return (
    <div className="h-[calc(100dvh-8rem)] overflow-y-auto bg-brand-bg pt-4 pb-20">
      <StoreSetupForm
        mode="edit"
        userId={user.id}
        initialValues={{
          storeName: settings.storeName,
          bannerUrl: settings.bannerUrl,
          theme: settings.theme,
          customPrimary: settings.customPrimary,
          customSecondary: settings.customSecondary,
        }}
      />
    </div>
  );
}
