"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Metric, PeakBasis, ChartPoint } from "@/lib/actions/reports";
import { getWeeklyPerformance } from "@/lib/actions/reports";

interface WeeklyPerformanceChartProps {
  metric: Metric;
  peakBasis: PeakBasis;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - ((day + 6) % 7));
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatRange(monday: Date): string {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sun)}`;
}

function formatValue(value: number | string | undefined, metric: Metric): string {
  if (metric === "quantity") return String(value ?? 0);
  return `₱${Number(value ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function WeeklyPerformanceChart({
  metric,
  peakBasis,
}: WeeklyPerformanceChartProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [data, setData] = useState<ChartPoint[]>([]);
  const [isPending, startTransition] = useTransition();

  const isCurrentWeek =
    getMonday(new Date()).getTime() === weekStart.getTime();

  const fetchData = useCallback(() => {
    startTransition(() => {
      getWeeklyPerformance({ weekStart, metric, peakBasis })
        .then(setData)
        .catch(() => setData([]));
    });
  }, [weekStart, metric, peakBasis]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    if (isCurrentWeek) return;
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800">
          Weekly Performance
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevWeek}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="min-w-[140px] text-center text-xs font-medium text-gray-600">
            {formatRange(weekStart)}
          </span>
          <button
            onClick={nextWeek}
            disabled={isCurrentWeek}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {isPending ? (
        <div className="h-[260px] animate-pulse rounded-lg bg-gray-100" />
      ) : data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
          No data for this week
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
