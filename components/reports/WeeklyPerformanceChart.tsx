"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Metric, ChartPoint } from "@/lib/actions/reports";

interface WeeklyPerformanceChartProps {
  data: ChartPoint[];
  metric: Metric;
  loading: boolean;
}

function formatValue(value: number | string | undefined, metric: Metric): string {
  if (metric === "quantity") return String(value ?? 0);
  return `₱${Number(value ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function WeeklyPerformanceChart({
  data,
  metric,
  loading,
}: WeeklyPerformanceChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-800">
        Weekly Performance
      </h2>
      {loading ? (
        <div className="h-[260px] animate-pulse rounded-lg bg-gray-100" />
      ) : data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              interval={0}
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, fill: "#6366f1" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
