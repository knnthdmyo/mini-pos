import { type NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAuth } from "@/lib/supabase/server";
import { getReport, type Period } from "@/lib/actions/reports";

export async function GET(req: NextRequest) {
  // Auth guard
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const raw = searchParams.get("period") ?? "daily";
  const validPeriods: Period[] = ["daily", "weekly", "monthly"];
  const period: Period = validPeriods.includes(raw as Period)
    ? (raw as Period)
    : "daily";

  const report = await getReport(period);

  // ── Sheet 1: Orders ────────────────────────────────────────────────────────
  const ordersRows = report.transactions.map((tx) => ({
    "Order #": tx.order_number,
    Time: new Date(tx.completed_at).toLocaleString("en-PH"),
    "Total (₱)": tx.total_price,
    "Received (₱)": tx.amount_received,
    "Change (₱)": tx.change_amount,
    "Change Given": tx.change_given ? "Yes" : "No",
  }));

  // ── Sheet 2: Costs (item-level rows) ───────────────────────────────────────
  const costRows: Array<Record<string, string | number>> = [];
  for (const tx of report.transactions) {
    for (const item of tx.items) {
      costRows.push({
        "Order #": tx.order_number,
        Time: new Date(tx.completed_at).toLocaleString("en-PH"),
        Item: item.variant_name
          ? `${item.product_name} (${item.variant_name})`
          : item.product_name,
        Qty: item.quantity,
        "Unit Price (₱)": item.unit_price,
        "Subtotal (₱)": item.subtotal,
      });
    }
  }

  // ── Sheet 3: Summary ───────────────────────────────────────────────────────
  const summaryRows = [
    { Metric: "Period", Value: period },
    {
      Metric: "From",
      Value: new Date(report.startDate).toLocaleString("en-PH"),
    },
    { Metric: "To", Value: new Date(report.endDate).toLocaleString("en-PH") },
    { Metric: "Revenue (₱)", Value: report.revenue },
    { Metric: "Cost (₱)", Value: report.cost },
    { Metric: "Profit (₱)", Value: report.profit },
    { Metric: "Transactions", Value: report.transactions.length },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(ordersRows),
    "Orders",
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(costRows), "Costs");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(summaryRows),
    "Summary",
  );

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="report-${period}-${Date.now()}.xlsx"`,
    },
  });
}
