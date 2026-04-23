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
import { WeeklyPerformanceChart } from "@/components/reports/WeeklyPerformanceChart";
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
  const [productChartType, setProductChartType] = useState<ProductChartType>("pie");
  const [showFilters, setShowFilters] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

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

      {reportData && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {new Date(reportData.startDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
              {" – "}
              {new Date(reportData.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <button
              onClick={() => setShowTransactions(true)}
              className="rounded-xl border border-brand-primary/40 bg-brand-primary/5 px-3 py-1.5 text-xs font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
            >
              View Transactions
            </button>
          </div>
          <ProfitSummary {...reportData} />
        </div>
      )}

      {/* Charts row: 33 / 66 on desktop, stacked on mobile */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-2/5 lg:min-h-0">
          <SalesByProductChart
            data={chartData?.salesByProduct ?? []}
            metric={metric}
            chartType={productChartType}
            onChartTypeChange={setProductChartType}
            loading={isPending}
          />
        </div>
        <div className="lg:w-3/5 lg:min-h-0">
          <PeakTimesChart
            data={chartData?.peakTimes ?? []}
            metric={metric}
            peakBasis={peakBasis}
            onPeakBasisChange={setPeakBasis}
            loading={isPending}
          />
        </div>
      </div>

      <WeeklyPerformanceChart
        data={chartData?.weeklyPerformance ?? []}
        metric={metric}
        loading={isPending}
      />



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
          <div className="mb-4">
            <h2 className="text-lg font-bold text-brand-text">Reports</h2>
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
      {/* Transactions modal */}
      {showTransactions && reportData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowTransactions(false)}
          />
          <div className="relative flex max-h-[85dvh] w-full max-w-4xl flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Transactions</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  {isExporting ? "Exporting…" : "Export"}
                </button>
                <button
                  onClick={() => setShowTransactions(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TransactionTable transactions={reportData.transactions} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
