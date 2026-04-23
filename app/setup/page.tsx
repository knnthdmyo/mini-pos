import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StoreSetupForm from "@/components/store/StoreSetupForm";

export default async function SetupPage() {
  const { user } = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 pt-12 pb-20">
      <StoreSetupForm mode="onboarding" userId={user.id} />
    </div>
  );
}
