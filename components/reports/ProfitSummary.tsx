interface ProfitSummaryProps {
  revenue: number;
  cost: number;
  profit: number;
  startDate: string;
  endDate: string;
}

function formatPHP(value: number) {
  return `₱${value.toFixed(2)}`;
}

export function ProfitSummary({
  revenue,
  cost,
  profit,
  startDate,
  endDate,
}: ProfitSummaryProps) {
  const start = new Date(startDate).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
  const end = new Date(endDate).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-400">
        {start} – {end}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl glass p-4 shadow-sm text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Revenue
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-text">
            {formatPHP(revenue)}
          </p>
        </div>
        <div className="rounded-2xl glass p-4 shadow-sm text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Cost
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-text">
            {formatPHP(cost)}
          </p>
        </div>
        <div
          className={[
            "rounded-2xl border p-4 shadow-sm text-center",
            profit >= 0
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50",
          ].join(" ")}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Profit
          </p>
          <p
            className={[
              "mt-1 text-2xl font-bold",
              profit >= 0 ? "text-green-700" : "text-red-700",
            ].join(" ")}
          >
            {formatPHP(profit)}
          </p>
        </div>
      </div>
    </div>
  );
}
