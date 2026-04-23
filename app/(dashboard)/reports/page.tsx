"use client";

import { useState, useCallback, useEffect } from "react";
import { getReport } from "@/lib/actions/reports";
import { ProfitSummary } from "@/components/reports/ProfitSummary";
import { TransactionTable } from "@/components/reports/TransactionTable";
import type { ReportResult } from "@/lib/actions/reports";

type Period = "daily" | "weekly" | "monthly";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today", value: "daily" },
  { label: "This Week", value: "weekly" },
  { label: "This Month", value: "monthly" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSelect = useCallback(async (p: Period) => {
    setPeriod(p);
    setError(null);
    setIsPending(true);
    try {
      const result = await getReport(p);
      if ("error" in result) {
        setError(result.error as string);
      } else {
        setData(result as ReportResult);
      }
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    handleSelect("daily");
  }, [handleSelect]);

  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/reports/export?period=${period}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${period}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="h-[calc(100dvh-8rem)] overflow-y-auto bg-brand-bg p-4 pb-20">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <button
            onClick={handleExport}
            disabled={isExporting || !data}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {isExporting ? "Exporting…" : "Export"}
          </button>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleSelect(p.value)}
              disabled={isPending}
              className={[
                "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
                period === p.value
                  ? "bg-brand-primary text-white shadow"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isPending && (
          <p className="text-center text-sm text-gray-400">Loading…</p>
        )}

        {error && !isPending && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!isPending && !error && data && (
          <>
            <ProfitSummary {...data} />
            <TransactionTable transactions={data.transactions} />
          </>
        )}

        {!isPending && !error && !data && (
          <p className="py-8 text-center text-sm text-gray-400">
            Select a period above to load the report.
          </p>
        )}
      </div>
    </div>
  );
}
