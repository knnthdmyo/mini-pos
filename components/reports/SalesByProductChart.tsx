"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { Metric, ChartPoint } from "@/lib/actions/reports";

export type ProductChartType = "bar" | "pie";

interface SalesByProductChartProps {
  data: ChartPoint[];
  metric: Metric;
  chartType: ProductChartType;
  onChartTypeChange: (t: ProductChartType) => void;
  loading: boolean;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#818cf8", "#4f46e5", "#4338ca", "#3730a3",
  "#6d28d9", "#7c3aed", "#5b21b6", "#2563eb",
];

function formatValue(value: number | string | undefined, metric: Metric): string {
  if (metric === "quantity") return String(value ?? 0);
  return `₱${Number(value ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SalesByProductChart({
  data,
  metric,
  chartType,
  onChartTypeChange,
  loading,
}: SalesByProductChartProps) {
  const isHorizontal = data.length > 6;
  const barHeight = isHorizontal ? Math.max(280, data.length * 36) : 260;

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800">Sales by Product</h2>
        <div className="flex gap-1">
          <button
            onClick={() => onChartTypeChange("bar")}
            className={[
              "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              chartType === "bar"
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            Bar
          </button>
          <button
            onClick={() => onChartTypeChange("pie")}
            className={[
              "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
              chartType === "pie"
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            Pie
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[260px] flex-1 animate-pulse rounded-lg bg-gray-100" />
      ) : data.length === 0 ? (
        <div className="flex min-h-[260px] flex-1 items-center justify-center text-sm text-gray-400">
          No data for this period
        </div>
      ) : chartType === "pie" ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={40}
              paddingAngle={2}
              label={({ x, y, name, percent }: PieLabelRenderProps) => (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontSize: 10, fill: "#374151" }}
                >
                  <tspan x={x} dy="-0.4em" fontWeight={600}>
                    {name ?? ""}
                  </tspan>
                  <tspan x={x} dy="1.2em">
                    {((percent ?? 0) * 100).toFixed(0)}%
                  </tspan>
                </text>
              )}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _key, entry) => [
                formatValue(value as number | undefined, metric),
                entry.payload?.label ?? "",
              ]}
              contentStyle={{
                borderRadius: "8px",
                fontSize: "12px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : isHorizontal ? (
        <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                metric === "quantity" ? String(v) : `₱${v}`
              }
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              width={110}
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
            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
