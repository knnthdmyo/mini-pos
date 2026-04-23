import type { Metadata } from "next";
import "./globals.css";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import type { ThemePreset } from "@/lib/themes";
import { generateCustomVars } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Minis POS",
  description: "Candy & Shake POS System",
};

async function getThemeData(): Promise<{
  theme: ThemePreset;
  customStyle: string | null;
}> {
  const { user } = await getUser();
  if (!user) return { theme: "light", customStyle: null };

  const supabase = createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("theme, custom_primary, custom_secondary")
    .eq("user_id", user.id)
    .single();

  const theme = (data?.theme as ThemePreset) ?? "light";

  if (theme === "custom" && data?.custom_primary && data?.custom_secondary) {
    const vars = generateCustomVars(data.custom_primary, data.custom_secondary);
    const css = Object.entries(vars)
      .map(([k, v]) => `${k}: ${v};`)
      .join(" ");
    return { theme, customStyle: `[data-theme="custom"] { ${css} }` };
  }

  return { theme, customStyle: null };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, customStyle } = await getThemeData();

  return (
    <html lang="en" data-theme={theme}>
      <head>
        {customStyle && <style dangerouslySetInnerHTML={{ __html: customStyle }} />}
      </head>
      <body className="bg-brand-bg text-brand-text antialiased">{children}</body>
    </html>
  );
}
