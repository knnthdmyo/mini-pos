"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";

// ── Legacy type kept for export route compat ─────────────────────────────────
export type Period = "daily" | "weekly" | "monthly";

// ── Chart filter types ────────────────────────────────────────────────────────
export type Metric = "sales" | "profit" | "quantity";
export type DatePreset = "today" | "yesterday" | "month" | "year" | "custom";
export type Granularity = "hourly" | "daily" | "weekly" | "monthly";
export type PeakBasis = "created_at" | "completed_at";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartData {
  salesByProduct: ChartPoint[];
  peakTimes: ChartPoint[]; // 10am–10pm (13 entries)
}

export interface ProductOption {
  id: string;
  name: string;
}

// ── Existing report types ─────────────────────────────────────────────────────
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

// ── Date helpers ─────────────────────────────────────────────────────────────
function hourLabel(hour: number): string {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
}

// ── listActiveProducts ────────────────────────────────────────────────────────
export async function listActiveProducts(): Promise<ProductOption[]> {
  await requireAuth();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductOption[];
}

// ── getChartData ──────────────────────────────────────────────────────────────
export async function getChartData(filters: {
  start: Date;
  end: Date;
  metric: Metric;
  peakBasis: PeakBasis;
  productIds?: string[];
}): Promise<ChartData> {
  await requireAuth();
  const { start, end, metric, peakBasis, productIds } = filters;
  const supabase = createClient();

  // Query 1: orders + items + products
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(
      `id, completed_at, created_at,
       order_items(quantity, unit_price, product_id,
         products(id, name))`,
    )
    .eq("status", "completed")
    .gte("completed_at", start.toISOString())
    .lte("completed_at", end.toISOString());

  if (ordersError) throw new Error(ordersError.message);
  const orders = ordersData ?? [];

  // Collect all product IDs in result
  const allProductIds = new Set<string>();
  for (const o of orders) {
    for (const oi of (o.order_items ?? []) as unknown as Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      products: { id: string; name: string } | null;
    }>) {
      if (oi.product_id) allProductIds.add(oi.product_id);
    }
  }

  // Query 2: product_costings for those product IDs
  const costMap = new Map<string, number>();
  if (allProductIds.size > 0) {
    const { data: costData } = await supabase
      .from("product_costings")
      .select("product_id, cost_per_item")
      .in("product_id", Array.from(allProductIds));
    for (const c of costData ?? []) {
      costMap.set(c.product_id, Number(c.cost_per_item));
    }
  }

  // Filter set for product pills
  const filterIds = productIds && productIds.length > 0 ? new Set(productIds) : null;

  // Aggregation maps
  const productMap = new Map<string, number>();
  // Peak times: always 24 buckets
  const peakArr = Array.from({ length: 24 }, (_, i) => ({
    label: hourLabel(i),
    value: 0,
  }));

  for (const o of orders) {
    const completedDate = new Date(o.completed_at as string);
    const basisDate = new Date(
      peakBasis === "created_at"
        ? (o.created_at as string)
        : (o.completed_at as string),
    );
    const hour = basisDate.getHours();

    for (const oi of (o.order_items ?? []) as unknown as Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      products: { id: string; name: string } | null;
    }>) {
      if (filterIds && !filterIds.has(oi.product_id)) continue;

      const qty = Number(oi.quantity);
      const price = Number(oi.unit_price);
      const cost = costMap.get(oi.product_id) ?? 0;
      let itemValue: number;
      if (metric === "quantity") {
        itemValue = qty;
      } else if (metric === "profit") {
        itemValue = (price - cost) * qty;
      } else {
        itemValue = price * qty;
      }

      // Sales by product
      const pname = oi.products?.name ?? "Unknown";
      productMap.set(pname, (productMap.get(pname) ?? 0) + itemValue);

      // Peak times
      peakArr[hour].value += itemValue;

    }
  }

  // Build salesByProduct sorted by value desc
  const salesByProduct: ChartPoint[] = Array.from(productMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({
      label,
      value: Math.round(value * 100) / 100,
    }));

  return {
    salesByProduct,
    peakTimes: peakArr.slice(10, 23).map((p) => ({
      ...p,
      value: Math.round(p.value * 100) / 100,
    })),
  };
}

// ── getWeeklyPerformance ──────────────────────────────────────────────────────
export async function getWeeklyPerformance(filters: {
  weekStart: Date;
  metric: Metric;
  peakBasis: PeakBasis;
}): Promise<ChartPoint[]> {
  await requireAuth();
  const { weekStart, metric, peakBasis } = filters;
  const supabase = createClient();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const basisCol = peakBasis === "created_at" ? "created_at" : "completed_at";

  const { data: ordersData, error } = await supabase
    .from("orders")
    .select(
      `id, completed_at, created_at,
       order_items(quantity, unit_price, product_id,
         products(id, name))`,
    )
    .eq("status", "completed")
    .gte(basisCol, weekStart.toISOString())
    .lt(basisCol, weekEnd.toISOString());

  if (error) throw new Error(error.message);
  const orders = ordersData ?? [];

  // Cost lookup
  const allPids = new Set<string>();
  for (const o of orders) {
    for (const oi of (o.order_items ?? []) as unknown as Array<{ product_id: string }>) {
      if (oi.product_id) allPids.add(oi.product_id);
    }
  }
  const costMap = new Map<string, number>();
  if (allPids.size > 0) {
    const { data: costData } = await supabase
      .from("product_costings")
      .select("product_id, cost_per_item")
      .in("product_id", Array.from(allPids));
    for (const c of costData ?? []) {
      costMap.set(c.product_id, Number(c.cost_per_item));
    }
  }

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayArr = DAY_NAMES.map((label) => ({ label, value: 0 }));

  for (const o of orders) {
    const basisDate = new Date(
      peakBasis === "created_at"
        ? (o.created_at as string)
        : (o.completed_at as string),
    );
    const dow = (basisDate.getDay() + 6) % 7; // 0=Mon

    for (const oi of (o.order_items ?? []) as unknown as Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>) {
      const qty = Number(oi.quantity);
      const price = Number(oi.unit_price);
      const cost = costMap.get(oi.product_id) ?? 0;
      let val: number;
      if (metric === "quantity") val = qty;
      else if (metric === "profit") val = (price - cost) * qty;
      else val = price * qty;

      dayArr[dow].value += val;
    }
  }

  return dayArr.map((d) => ({
    label: d.label,
    value: Math.round(d.value * 100) / 100,
  }));
}

// ── getReport (updated signature) ────────────────────────────────────────────
export async function getReport(filters: {
  start: Date;
  end: Date;
  productIds?: string[];
}): Promise<ReportResult> {
  await requireAuth();
  const { start, end, productIds } = filters;
  const supabase = createClient();

  // Fetch completed orders with items in range
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(
      `id, total_price, amount_received, change_amount, change_given, completed_at,
       order_items(quantity, unit_price, product_id, products(name), product_variants(name))`,
    )
    .eq("status", "completed")
    .gte("completed_at", start.toISOString())
    .lte("completed_at", end.toISOString())
    .order("completed_at", { ascending: false });

  if (ordersError) throw new Error(ordersError.message);

  let orders = (ordersData ?? []) as unknown as Array<{
    id: string;
    total_price: number;
    amount_received: number;
    change_amount: number;
    change_given: boolean;
    completed_at: string;
    order_items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      products: { name: string } | null;
      product_variants: { name: string } | null;
    }>;
  }>;

  // Apply product filter: keep orders that have at least one matching item
  const filterIds = productIds && productIds.length > 0 ? new Set(productIds) : null;
  if (filterIds) {
    orders = orders.filter((o) =>
      o.order_items.some((oi) => filterIds.has(oi.product_id)),
    );
  }

  // Collect product IDs for cost lookup
  const allPids = new Set<string>();
  for (const o of orders) {
    for (const oi of o.order_items) allPids.add(oi.product_id);
  }

  const costMap = new Map<string, number>();
  if (allPids.size > 0) {
    const { data: costData } = await supabase
      .from("product_costings")
      .select("product_id, cost_per_item")
      .in("product_id", Array.from(allPids));
    for (const c of costData ?? []) {
      costMap.set(c.product_id, Number(c.cost_per_item));
    }
  }

  const revenue = orders.reduce((sum, o) => sum + Number(o.total_price), 0);

  // Cost from product_costings × quantity
  let cost = 0;
  for (const o of orders) {
    for (const oi of o.order_items) {
      const filtered = filterIds ? filterIds.has(oi.product_id) : true;
      if (!filtered) continue;
      const costPerItem = costMap.get(oi.product_id) ?? 0;
      cost += costPerItem * Number(oi.quantity);
    }
  }

  const transactions: TransactionRow[] = orders.map((o, idx) => {
    const items: OrderItemRow[] = o.order_items
      .filter((oi) => (filterIds ? filterIds.has(oi.product_id) : true))
      .map((oi) => ({
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

  return {
    revenue,
    cost,
    profit: revenue - cost,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    transactions,
  };
}
