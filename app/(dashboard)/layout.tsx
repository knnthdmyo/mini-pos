import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { getMaterialsCount } from "@/lib/actions/materials";
import OnboardingModal from "@/components/materials/OnboardingModal";

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count } = await getMaterialsCount();

  return (
    <div className="flex min-h-screen flex-col">
      <OnboardingModal showOnboarding={count === 0} />
      <main className="flex-1 overflow-hidden">{children}</main>
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
        <form action={logout} className="flex flex-1">
          <button
            type="submit"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-gray-400 hover:bg-gray-50 hover:text-red-500"
          >
            <span className="text-lg leading-none">🚪</span>
            <span className="text-xs font-medium">Sign out</span>
          </button>
        </form>
      </nav>
    </div>
  );
}
