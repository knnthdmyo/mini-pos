import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient, requireAuth } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

type Period = "daily" | "weekly" | "monthly";

function getPeriodRange(period: Period) {
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

  return { start: start.toISOString(), end: now.toISOString() };
}

export async function GET(request: NextRequest) {
  await requireAuth();

  const period = (request.nextUrl.searchParams.get("period") ?? "daily") as Period;
  if (!["daily", "weekly", "monthly"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const { start, end } = getPeriodRange(period);
  const supabase = createClient();

  // Completed orders in period
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_price, completed_at, order_items(quantity, unit_price, products(name))")
    .eq("status", "completed")
    .gte("completed_at", start)
    .lte("completed_at", end)
    .order("completed_at", { ascending: true });

  // Cost data
  const { data: costData } = await supabase
    .from("inventory_logs")
    .select("change_qty, created_at, ingredients(name, cost_per_unit)")
    .lt("change_qty", 0)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true });

  const wb = XLSX.utils.book_new();

  // --- Orders sheet ---
  const orderRows = (orders ?? []).flatMap((order) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (order.order_items ?? []).map((item: any) => ({
      "Order ID": order.id.slice(0, 8),
      "Completed At": order.completed_at,
      Product: item.products?.name ?? "—",
      Quantity: item.quantity,
      "Unit Price": item.unit_price,
      Subtotal: item.quantity * item.unit_price,
    })),
  );
  const ordersWs = XLSX.utils.json_to_sheet(
    orderRows.length > 0
      ? orderRows
      : [{ "Order ID": "", "Completed At": "", Product: "", Quantity: "", "Unit Price": "", Subtotal: "" }],
  );
  XLSX.utils.book_append_sheet(wb, ordersWs, "Orders");

  // --- Costs sheet ---
  const costRows = (costData ?? []).map((row) => {
    const ingredient = row.ingredients as unknown as { name: string; cost_per_unit: number } | null;
    return {
      Ingredient: ingredient?.name ?? "—",
      "Qty Used": Math.abs(Number(row.change_qty)),
      "Cost Per Unit": ingredient?.cost_per_unit ?? 0,
      "Total Cost": Math.abs(Number(row.change_qty)) * Number(ingredient?.cost_per_unit ?? 0),
      Date: row.created_at,
    };
  });
  const costsWs = XLSX.utils.json_to_sheet(
    costRows.length > 0
      ? costRows
      : [{ Ingredient: "", "Qty Used": "", "Cost Per Unit": "", "Total Cost": "", Date: "" }],
  );
  XLSX.utils.book_append_sheet(wb, costsWs, "Costs");

  // --- Summary sheet ---
  const revenue = (orders ?? []).reduce((s, o) => s + Number(o.total_price), 0);
  const cost = costRows.reduce((s, r) => s + Number(r["Total Cost"]), 0);
  const summaryWs = XLSX.utils.json_to_sheet([
    { Metric: "Period", Value: period },
    { Metric: "From", Value: start },
    { Metric: "To", Value: end },
    { Metric: "Revenue", Value: revenue },
    { Metric: "Cost", Value: cost },
    { Metric: "Profit", Value: revenue - cost },
  ]);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `minis-report-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
