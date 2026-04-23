"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";

type Period = "daily" | "weekly" | "monthly";

export interface TransactionItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  products: { name: string };
}

export interface Transaction {
  id: string;
  total_price: number;
  completed_at: string;
  amount_received: number | null;
  change_amount: number | null;
  change_given: boolean;
  order_items: TransactionItem[];
}

interface ReportResult {
  revenue: number;
  cost: number;
  profit: number;
  startDate: string;
  endDate: string;
  transactions: Transaction[];
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

  // Completed orders in period (with items for transaction table)
  const { data: ordersData } = await supabase
    .from("orders")
    .select(
      "id, total_price, completed_at, amount_received, change_amount, change_given, order_items(product_id, quantity, unit_price, products(name))",
    )
    .eq("status", "completed")
    .gte("completed_at", startISO)
    .lte("completed_at", endISO)
    .order("completed_at", { ascending: false });

  const orders = (ordersData ?? []) as unknown as Transaction[];

  const revenue = orders.reduce((sum, row) => sum + Number(row.total_price), 0);

  // Cost: sum of (|change_qty| × cost_per_unit) for negative log entries in period
  const { data: costData } = await supabase
    .from("inventory_logs")
    .select("change_qty, ingredients(cost_per_unit)")
    .lt("change_qty", 0)
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  const cost = (costData ?? []).reduce((sum, row) => {
    const ingredient = row.ingredients as unknown as { cost_per_unit: number };
    return (
      sum +
      Math.abs(Number(row.change_qty)) * Number(ingredient?.cost_per_unit ?? 0)
    );
  }, 0);

  return {
    revenue,
    cost,
    profit: revenue - cost,
    startDate: startISO,
    endDate: endISO,
    transactions: orders,
  };
}
