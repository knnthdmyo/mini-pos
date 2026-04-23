"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  getReport,
  getChartData,
  listActiveProducts,
} from "@/lib/actions/reports";
import { deriveDateRange } from "@/lib/reports-utils";
import type {
  Metric,
  DatePreset,
  Granularity,
  PeakBasis,
  DateRange,
  ChartData,
  ProductOption,
  ReportResult,
} from "@/lib/actions/reports";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { SalesOverTimeChart } from "@/components/reports/SalesOverTimeChart";
import { SalesByProductChart } from "@/components/reports/SalesByProductChart";
import { PeakTimesChart } from "@/components/reports/PeakTimesChart";
import { ProfitSummary } from "@/components/reports/ProfitSummary";
import { TransactionTable } from "@/components/reports/TransactionTable";

export default function ReportsPage() {
  const [metric, setMetric] = useState<Metric>("sales");
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [customRange, setCustomRange] = useState<DateRange>({
    start: new Date(),
    end: new Date(),
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [granularity, setGranularity] = useState<Granularity>("hourly");
  const [peakBasis, setPeakBasis] = useState<PeakBasis>("completed_at");

  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [reportData, setReportData] = useState<ReportResult | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dateRange = useMemo(
    () => deriveDateRange(datePreset, customRange),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datePreset, customRange.start.toISOString(), customRange.end.toISOString()],
  );

  // Load products for filter chips on mount
  useEffect(() => {
    listActiveProducts().then(setProducts).catch(() => {});
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    setError(null);
    startTransition(() => {
      Promise.all([
        getChartData({
          start: dateRange.start,
          end: dateRange.end,
          metric,
          granularity,
          peakBasis,
          productIds: selectedProductIds,
        }),
        getReport({
          start: dateRange.start,
          end: dateRange.end,
          productIds: selectedProductIds,
        }),
      ])
        .then(([charts, report]) => {
          setChartData(charts);
          setReportData(report);
        })
        .catch(() => setError("Failed to load report data. Please try again."));
    });
  }, [dateRange, metric, granularity, peakBasis, selectedProductIds]);

  async function handleExport() {
    setIsExporting(true);
    try {
      const preset =
        datePreset === "custom" ? "today" : datePreset === "yesterday" ? "yesterday" : datePreset === "month" ? "month" : datePreset === "year" ? "year" : "today";
      const res = await fetch(`/api/reports/export?period=${preset}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${preset}-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-y-auto bg-brand-bg p-4 pb-20">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <button
            onClick={handleExport}
            disabled={isExporting || !reportData}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            {isExporting ? "Exporting…" : "Export"}
          </button>
        </div>

        {/* Filters */}
        <ReportFilters
          metric={metric}
          onMetricChange={setMetric}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
          granularity={granularity}
          onGranularityChange={setGranularity}
          selectedProductIds={selectedProductIds}
          onProductIdsChange={setSelectedProductIds}
          products={products}
        />

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Chart 1 */}
        <SalesOverTimeChart
          data={chartData?.salesOverTime ?? []}
          metric={metric}
          loading={isPending}
        />

        {/* Chart 2 */}
        <SalesByProductChart
          data={chartData?.salesByProduct ?? []}
          metric={metric}
          loading={isPending}
        />

        {/* Chart 3 */}
        <PeakTimesChart
          data={chartData?.peakTimes ?? []}
          metric={metric}
          peakBasis={peakBasis}
          onPeakBasisChange={setPeakBasis}
          loading={isPending}
        />

        {/* Existing summary + transactions */}
        {reportData && (
          <>
            <ProfitSummary {...reportData} />
            <TransactionTable transactions={reportData.transactions} />
          </>
        )}

        {!isPending && !error && !reportData && (
          <p className="py-8 text-center text-sm text-gray-400">
            Loading report…
          </p>
        )}
      </div>
    </div>
  );
}
