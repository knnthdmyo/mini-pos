"use client";

import { Badge } from "@/components/ui/Badge";

interface IngredientRowProps {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
  cost_per_unit: number;
  low_stock_threshold: number | null;
  children?: React.ReactNode; // StockAdjustForm injected here
}

export function IngredientRow({
  name,
  unit,
  stock_qty,
  cost_per_unit,
  low_stock_threshold,
  children,
}: IngredientRowProps) {
  const isNegative = stock_qty < 0;
  const isLow =
    low_stock_threshold !== null && stock_qty <= low_stock_threshold;

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-4 shadow-sm",
        isNegative
          ? "border-red-300 bg-red-50"
          : isLow
            ? "border-amber-300 bg-amber-50"
            : "border-gray-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{name}</span>
            {isNegative && <Badge variant="danger">Negative stock ⚠</Badge>}
            {!isNegative && isLow && <Badge variant="warning">Low stock</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {stock_qty.toFixed(2)} {unit} &middot; ₱{cost_per_unit.toFixed(4)}/
            {unit}
            {low_stock_threshold !== null && (
              <>
                {" "}
                &middot; threshold: {low_stock_threshold} {unit}
              </>
            )}
          </p>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
