"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";

type Period = "daily" | "weekly" | "monthly";

interface ReportResult {
  revenue: number;
  cost: number;
  profit: number;
  startDate: string;
  endDate: string;
}

export async function getReport(period: Period): Promise<ReportResult> {
  await requireAuth();

  const now = new Date();
  let start: Date;

  if (period === "daily") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "weekly") {
    const day = now.getDay(); // 0=Sun
    start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startISO = start.toISOString();
  const endISO = now.toISOString();

  const supabase = createClient();

  // Revenue: sum of completed orders in period
  const { data: revenueData } = await supabase
    .from("orders")
    .select("total_price")
    .eq("status", "completed")
    .gte("completed_at", startISO)
    .lte("completed_at", endISO);

  const revenue = (revenueData ?? []).reduce(
    (sum, row) => sum + Number(row.total_price),
    0
  );

  // Cost: sum of (|change_qty| × cost_per_unit) for negative log entries in period
  const { data: costData } = await supabase
    .from("inventory_logs")
    .select("change_qty, ingredients(cost_per_unit)")
    .lt("change_qty", 0)
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  const cost = (costData ?? []).reduce((sum, row) => {
    const ingredient = row.ingredients as unknown as { cost_per_unit: number };
    return sum + Math.abs(Number(row.change_qty)) * Number(ingredient?.cost_per_unit ?? 0);
  }, 0);

  return {
    revenue,
    cost,
    profit: revenue - cost,
    startDate: startISO,
    endDate: endISO,
  };
}
