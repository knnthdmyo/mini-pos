"use client";

import { useState, useTransition } from "react";
import { getReport } from "@/lib/actions/reports";
import type { Transaction } from "@/lib/actions/reports";
import { ProfitSummary } from "@/components/reports/ProfitSummary";
import { TransactionTable } from "@/components/reports/TransactionTable";

type Period = "daily" | "weekly" | "monthly";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today", value: "daily" },
  { label: "This Week", value: "weekly" },
  { label: "This Month", value: "monthly" },
];

interface ReportResult {
  revenue: number;
  cost: number;
  profit: number;
  startDate: string;
  endDate: string;
  transactions: Transaction[];
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  function handleSelect(p: Period) {
    setPeriod(p);
    setError(null);
    startTransition(async () => {
      const result = await getReport(p);
      if ("error" in result) {
        setError(result.error as string);
      } else {
        setData(result as ReportResult);
      }
    });
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto pb-20 p-4">
      <h1 className="text-xl font-bold text-gray-900">Reports</h1>

      {/* Period tabs */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => handleSelect(p.value)}
            disabled={isPending}
            className={[
              "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
              period === p.value
                ? "bg-indigo-600 text-white shadow"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
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

      {!isPending && !error && data && <ProfitSummary {...data} />}

      {/* Download Excel */}
      {!isPending && !error && data && (
        <button
          disabled={isExporting}
          onClick={async () => {
            setIsExporting(true);
            try {
              const res = await fetch(`/api/reports/export?period=${period}`);
              if (!res.ok) throw new Error("Export failed");
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `minis-report-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`;
              a.click();
              URL.revokeObjectURL(url);
            } finally {
              setIsExporting(false);
            }
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
            />
          </svg>
          {isExporting ? "Exporting…" : "Download Excel"}
        </button>
      )}

      {/* Transaction history */}
      {!isPending && !error && data && (
        <>
          <h2 className="text-base font-semibold text-gray-900">
            Transactions
          </h2>
          <TransactionTable transactions={data.transactions} />
        </>
      )}

      {!isPending && !error && !data && (
        <p className="text-center text-sm text-gray-400">
          Select a period above to load the report.
        </p>
      )}
    </div>
  );
}
