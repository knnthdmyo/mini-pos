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
  PeakBasis,
  DateRange,
  ChartData,
  ProductOption,
  ReportResult,
} from "@/lib/actions/reports";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { SalesByProductChart } from "@/components/reports/SalesByProductChart";
import type { ProductChartType } from "@/components/reports/SalesByProductChart";
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
  const [peakBasis, setPeakBasis] = useState<PeakBasis>("completed_at");
  const [productChartType, setProductChartType] = useState<ProductChartType>("bar");
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    listActiveProducts().then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    startTransition(() => {
      Promise.all([
        getChartData({
          start: dateRange.start,
          end: dateRange.end,
          metric,
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
  }, [dateRange, metric, peakBasis, selectedProductIds]);

  async function handleExport() {
    setIsExporting(true);
    try {
      const preset =
        datePreset === "custom"
          ? "today"
          : datePreset === "yesterday"
            ? "yesterday"
            : datePreset === "month"
              ? "month"
              : datePreset === "year"
                ? "year"
                : "today";
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

  const filterProps = {
    metric,
    onMetricChange: setMetric,
    datePreset,
    onDatePresetChange: setDatePreset,
    customRange,
    onCustomRangeChange: setCustomRange,
    selectedProductIds,
    onProductIdsChange: setSelectedProductIds,
    products,
  };

  const charts = (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Charts row: 33 / 66 on desktop, stacked on mobile */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-1/3 lg:min-h-0">
          <SalesByProductChart
            data={chartData?.salesByProduct ?? []}
            metric={metric}
            chartType={productChartType}
            onChartTypeChange={setProductChartType}
            loading={isPending}
          />
        </div>
        <div className="lg:w-2/3 lg:min-h-0">
          <PeakTimesChart
            data={chartData?.peakTimes ?? []}
            metric={metric}
            peakBasis={peakBasis}
            onPeakBasisChange={setPeakBasis}
            loading={isPending}
          />
        </div>
      </div>

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
  );

  return (
    <>
      {/* ── Mobile: stacked layout with collapsible filters ── */}
      <div className="flex h-[calc(100dvh-4rem)] flex-col md:hidden">
        {/* Header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-brand-border/30 bg-brand-surface/40 px-4 py-3">
          <h1 className="text-lg font-bold text-brand-text">Reports</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={[
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                showFilters
                  ? "border-brand-primary/60 bg-brand-primary/10 text-brand-primary"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              {showFilters ? "Hide Filters" : "Filters"}
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !reportData}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              {isExporting ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="shrink-0 border-b border-brand-border/30 bg-brand-bg p-3">
            <ReportFilters {...filterProps} />
          </div>
        )}

        {/* Charts */}
        <div className="flex-1 overflow-y-auto bg-brand-bg p-4 pb-20">
          {charts}
        </div>
      </div>

      {/* ── Desktop: two-column layout (filters left, charts right) ── */}
      <div className="hidden md:flex h-[calc(100dvh-4rem)] divide-x divide-gray-200 overflow-hidden">
        {/* Left sidebar — filters */}
        <div className="w-72 shrink-0 overflow-y-auto bg-brand-bg p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-text">Reports</h2>
            <button
              onClick={handleExport}
              disabled={isExporting || !reportData}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              {isExporting ? "Exporting…" : "Export"}
            </button>
          </div>
          <ReportFilters {...filterProps} />
        </div>

        {/* Right content — charts */}
        <div className="flex-1 overflow-y-auto bg-brand-bg p-6 pb-20">
          <div className="mx-auto max-w-4xl">
            {charts}
          </div>
        </div>
      </div>
    </>
  );
}
