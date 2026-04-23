"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";

export type Period = "daily" | "weekly" | "monthly";

export interface OrderItemRow {
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface TransactionRow {
  id: string;
  order_number: string;
  completed_at: string;
  total_price: number;
  amount_received: number;
  change_amount: number;
  change_given: boolean;
  items: OrderItemRow[];
}

export interface ReportResult {
  revenue: number;
  cost: number;
  profit: number;
  startDate: string;
  endDate: string;
  transactions: TransactionRow[];
}

function getPeriodRange(period: Period): { startISO: string; endISO: string } {
  const now = new Date();
  let start: Date;

  if (period === "daily") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "weekly") {
    const day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startISO: start.toISOString(), endISO: now.toISOString() };
}

export async function getReport(period: Period): Promise<ReportResult> {
  await requireAuth();

  const { startISO, endISO } = getPeriodRange(period);
  const supabase = createClient();

  // Fetch completed orders with items in period
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(
      `id, total_price, amount_received, change_amount, change_given, completed_at,
       order_items(quantity, unit_price, products(name), product_variants(name))`,
    )
    .eq("status", "completed")
    .gte("completed_at", startISO)
    .lte("completed_at", endISO)
    .order("completed_at", { ascending: false });

  if (ordersError) throw new Error(ordersError.message);

  const orders = ordersData ?? [];

  const revenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0);

  const transactions: TransactionRow[] = orders.map((o, idx) => {
    const rawItems = (o.order_items ?? []) as unknown as Array<{
      quantity: number;
      unit_price: number;
      products: { name: string } | null;
      product_variants: { name: string } | null;
    }>;

    const items: OrderItemRow[] = rawItems.map((oi) => ({
      product_name: oi.products?.name ?? "Unknown",
      variant_name: oi.product_variants?.name ?? null,
      quantity: oi.quantity,
      unit_price: Number(oi.unit_price),
      subtotal: oi.quantity * Number(oi.unit_price),
    }));

    return {
      id: o.id,
      order_number: `ORD-${String(orders.length - idx).padStart(3, "0")}`,
      completed_at: o.completed_at ?? "",
      total_price: Number(o.total_price),
      amount_received: Number(o.amount_received ?? 0),
      change_amount: Number(o.change_amount ?? 0),
      change_given: Boolean(o.change_given ?? true),
      items,
    };
  });

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
    transactions,
  };
}
