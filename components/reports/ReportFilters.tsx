"use client";

import type {
  Metric,
  DatePreset,
  Granularity,
  DateRange,
  ProductOption,
} from "@/lib/actions/reports";

interface ReportFiltersProps {
  metric: Metric;
  onMetricChange: (m: Metric) => void;
  datePreset: DatePreset;
  onDatePresetChange: (p: DatePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (r: DateRange) => void;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  selectedProductIds: string[];
  onProductIdsChange: (ids: string[]) => void;
  products: ProductOption[];
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={[
            "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-brand-primary text-white shadow-sm"
              : "border border-brand-border bg-brand-surface/60 text-brand-text hover:bg-brand-surface",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "Custom", value: "custom" },
];

const METRICS: { label: string; value: Metric }[] = [
  { label: "Sales", value: "sales" },
  { label: "Profit", value: "profit" },
  { label: "Quantity", value: "quantity" },
];

const GRANULARITIES: { label: string; value: Granularity }[] = [
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

export function ReportFilters({
  metric,
  onMetricChange,
  datePreset,
  onDatePresetChange,
  customRange,
  onCustomRangeChange,
  granularity,
  onGranularityChange,
  selectedProductIds,
  onProductIdsChange,
  products,
}: ReportFiltersProps) {
  function toggleProduct(id: string) {
    if (selectedProductIds.includes(id)) {
      onProductIdsChange(selectedProductIds.filter((p) => p !== id));
    } else {
      onProductIdsChange([...selectedProductIds, id]);
    }
  }

  function toDateInputValue(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  return (
    <div className="space-y-4">
      {/* Date range */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Date Range
        </p>
        <ToggleGroup
          options={DATE_PRESETS}
          value={datePreset}
          onChange={onDatePresetChange}
        />
        {datePreset === "custom" && (
          <div className="mt-2 flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-gray-500">From</label>
              <input
                type="date"
                value={toDateInputValue(customRange.start)}
                onChange={(e) => {
                  const d = new Date(e.target.value + "T00:00:00");
                  if (!isNaN(d.getTime())) {
                    onCustomRangeChange({ ...customRange, start: d });
                  }
                }}
                className="rounded-lg border border-brand-border bg-brand-surface/60 px-2 py-1.5 text-xs text-brand-text"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-gray-500">To</label>
              <input
                type="date"
                value={toDateInputValue(customRange.end)}
                onChange={(e) => {
                  const d = new Date(e.target.value + "T23:59:59");
                  if (!isNaN(d.getTime())) {
                    onCustomRangeChange({ ...customRange, end: d });
                  }
                }}
                className="rounded-lg border border-brand-border bg-brand-surface/60 px-2 py-1.5 text-xs text-brand-text"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metric */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Metric
        </p>
        <ToggleGroup
          options={METRICS}
          value={metric}
          onChange={onMetricChange}
        />
      </div>

      {/* Granularity */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Group by
        </p>
        <ToggleGroup
          options={GRANULARITIES}
          value={granularity}
          onChange={onGranularityChange}
        />
      </div>

      {/* Product filter */}
      {products.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Products
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onProductIdsChange([])}
              className={[
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                selectedProductIds.length === 0
                  ? "bg-brand-primary text-white"
                  : "border border-brand-border bg-brand-surface/60 text-brand-text hover:bg-brand-surface",
              ].join(" ")}
            >
              All
            </button>
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleProduct(p.id)}
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  selectedProductIds.includes(p.id)
                    ? "bg-brand-primary text-white"
                    : "border border-brand-border bg-brand-surface/60 text-brand-text hover:bg-brand-surface",
                ].join(" ")}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
