"use client";

import { useState, useCallback, useEffect } from "react";
import { getReport } from "@/lib/actions/reports";
import { ProfitSummary } from "@/components/reports/ProfitSummary";

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
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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

  return (
    <div className="h-[calc(100dvh-8rem)] overflow-y-auto bg-gray-50 p-4 pb-20">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>

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
                  ? "bg-indigo-600 text-white shadow"
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

        {!isPending && !error && data && <ProfitSummary {...data} />}

        {!isPending && !error && !data && (
          <p className="py-8 text-center text-sm text-gray-400">
            Select a period above to load the report.
          </p>
        )}
      </div>
    </div>
  );
}
