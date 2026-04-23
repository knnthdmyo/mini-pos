"use client";

import { useMemo } from "react";

interface CostSummaryCardProps {
  totalProductionCost: number;
  costPerItem: number;
  yieldQuantity: number;
  profitMargin: number;
  srp: number;
  srpOverride: boolean;
  onSrpChange: (value: number) => void;
  onSrpOverrideClear: () => void;
  onMarginChange: (value: number) => void;
}

export default function CostSummaryCard({
  totalProductionCost,
  costPerItem,
  yieldQuantity,
  profitMargin,
  srp,
  srpOverride,
  onSrpChange,
  onSrpOverrideClear,
  onMarginChange,
}: CostSummaryCardProps) {
  const netProfitPerItem = useMemo(
    () => (costPerItem > 0 ? srp - costPerItem : 0),
    [srp, costPerItem],
  );

  const totalProfitPerBatch = useMemo(
    () => netProfitPerItem * yieldQuantity,
    [netProfitPerItem, yieldQuantity],
  );

  const marginError = profitMargin < 0;

  return (
    <div className="space-y-4">
      {/* Margin input */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Profit Margin (%)
        </label>
        <input
          type="number"
          value={profitMargin || ""}
          onChange={(e) => onMarginChange(Number(e.target.value) || 0)}
          placeholder="e.g. 50"
          min="0"
          step="any"
          className={[
            "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none",
            marginError
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-brand-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30",
          ].join(" ")}
        />
        {marginError && (
          <p className="mt-1 text-xs text-red-600">Margin cannot be negative</p>
        )}
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Total Cost</p>
          <p className="text-lg font-bold text-brand-text">
            ₱{totalProductionCost.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Cost/Item</p>
          <p className="text-lg font-bold text-brand-text">
            {costPerItem > 0 ? `₱${costPerItem.toFixed(4)}` : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/10 p-3">
          <p className="text-xs text-brand-primary">
            SRP {srpOverride && "(manual)"}
          </p>
          <input
            type="number"
            value={srp || ""}
            onChange={(e) => onSrpChange(Number(e.target.value) || 0)}
            min="0"
            step="any"
            className="w-full border-0 bg-transparent p-0 text-lg font-bold text-brand-text focus:outline-none"
          />
          {srpOverride && (
            <button
              onClick={onSrpOverrideClear}
              className="mt-1 text-xs text-brand-primary/70 hover:text-brand-primary"
            >
              Reset to suggested
            </button>
          )}
        </div>

        <div
          className={[
            "rounded-xl border p-3",
            netProfitPerItem >= 0
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50",
          ].join(" ")}
        >
          <p className="text-xs text-gray-500">Profit/Item</p>
          <p
            className={[
              "text-lg font-bold",
              netProfitPerItem >= 0 ? "text-green-700" : "text-red-700",
            ].join(" ")}
          >
            {costPerItem > 0 ? `₱${netProfitPerItem.toFixed(4)}` : "—"}
          </p>
        </div>

        <div
          className={[
            "rounded-xl border p-3",
            totalProfitPerBatch >= 0
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50",
          ].join(" ")}
        >
          <p className="text-xs text-gray-500">Profit/Batch</p>
          <p
            className={[
              "text-lg font-bold",
              totalProfitPerBatch >= 0 ? "text-green-700" : "text-red-700",
            ].join(" ")}
          >
            {yieldQuantity > 0 ? `₱${totalProfitPerBatch.toFixed(2)}` : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Yield</p>
          <p className="text-lg font-bold text-brand-text">
            {yieldQuantity > 0 ? `${yieldQuantity} pcs` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
