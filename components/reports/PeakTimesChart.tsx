"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Metric, PeakBasis, ChartPoint } from "@/lib/actions/reports";

interface PeakTimesChartProps {
  data: ChartPoint[];
  metric: Metric;
  peakBasis: PeakBasis;
  onPeakBasisChange: (b: PeakBasis) => void;
  loading: boolean;
}

function formatValue(value: number | string | undefined, metric: Metric): string {
  if (metric === "quantity") return String(value ?? 0);
  return `₱${Number(value ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PeakTimesChart({
  data,
  metric,
  peakBasis,
  onPeakBasisChange,
  loading,
}: PeakTimesChartProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800">Peak Times</h2>
        <div className="flex gap-1">
          <button
            onClick={() => onPeakBasisChange("created_at")}
            className={[
              "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              peakBasis === "created_at"
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            Placed
          </button>
          <button
            onClick={() => onPeakBasisChange("completed_at")}
            className={[
              "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              peakBasis === "completed_at"
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            Completed
          </button>
        </div>
      </div>
      {loading ? (
        <div className="min-h-[240px] flex-1 animate-pulse rounded-lg bg-gray-100" />
      ) : (
        <div className="min-h-[240px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                metric === "quantity" ? String(v) : `₱${v}`
              }
              width={metric === "quantity" ? 30 : 52}
            />
            <Tooltip
              formatter={(value) => [
                formatValue(value as number | undefined, metric),
                metric === "quantity" ? "Qty" : metric === "profit" ? "Profit" : "Sales",
              ]}
              contentStyle={{
                borderRadius: "8px",
                fontSize: "12px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
