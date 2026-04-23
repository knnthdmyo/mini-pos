import type { Metadata } from "next";
import "./globals.css";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import type { ThemePreset } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Minis POS",
  description: "Candy & Shake POS System",
};

async function getTheme(): Promise<ThemePreset> {
  const { user } = await getUser();
  if (!user) return "light";

  const supabase = createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("theme")
    .eq("user_id", user.id)
    .single();

  return (data?.theme as ThemePreset) ?? "light";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getTheme();

  return (
    <html lang="en" data-theme={theme}>
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
