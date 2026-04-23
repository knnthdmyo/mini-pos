"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import MaterialRowEditor, {
  type MaterialRowData,
} from "@/components/costing/MaterialRowEditor";
import CostSummaryCard from "@/components/costing/CostSummaryCard";
import { Button } from "@/components/ui/Button";
import { Toast, useToast } from "@/components/ui/Toast";
import { saveCosting } from "@/lib/actions/costing";

interface Material {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

interface InitialData {
  id: string;
  overheadCost: number;
  laborCost: number;
  otherCost: number;
  yieldQuantity: number;
  profitMargin: number;
  srp: number;
  srpOverride: boolean;
  updatedAt: string;
  materialRows: {
    id: string;
    ingredientId: string | null;
    materialName: string;
    unit: string;
    costPerUnit: number;
    quantityUsed: number;
    rowTotal: number;
  }[];
}

interface CostingBuilderProps {
  variantId?: string | null;
  productId: string;
  productName: string;
  materials: Material[];
  initialData?: InitialData | null;
}

function emptyRow(): MaterialRowData {
  return {
    ingredientId: "",
    materialName: "",
    unit: "",
    costPerUnit: 0,
    quantityUsed: 0,
    rowTotal: 0,
  };
}

export default function CostingBuilder({
  variantId,
  productId,
  productName,
  materials,
  initialData,
}: CostingBuilderProps) {
  // ── State ──────────────────────────────────────────────────────

  const [rows, setRows] = useState<MaterialRowData[]>(() => {
    if (initialData?.materialRows?.length) {
      return initialData.materialRows.map((r) => ({
        ingredientId: r.ingredientId ?? "",
        materialName: r.materialName,
        unit: r.unit,
        costPerUnit: r.costPerUnit,
        quantityUsed: r.quantityUsed,
        rowTotal: r.rowTotal,
      }));
    }
    return [emptyRow()];
  });

  const [overheadCost, setOverheadCost] = useState(
    initialData?.overheadCost ?? 0,
  );
  const [laborCost, setLaborCost] = useState(initialData?.laborCost ?? 0);
  const [otherCost, setOtherCost] = useState(initialData?.otherCost ?? 0);
  const [yieldQuantity, setYieldQuantity] = useState(
    initialData?.yieldQuantity ?? 0,
  );
  const [profitMargin, setProfitMargin] = useState(
    initialData?.profitMargin ?? 0,
  );
  const [srpOverride, setSrpOverride] = useState(
    initialData?.srpOverride ?? false,
  );
  const [manualSrp, setManualSrp] = useState(initialData?.srp ?? 0);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast, showToast, dismiss } = useToast();

  // ── Computed values ────────────────────────────────────────────

  const totalMaterialCost = useMemo(
    () => rows.reduce((sum, r) => sum + r.rowTotal, 0),
    [rows],
  );

  const totalProductionCost = useMemo(
    () => totalMaterialCost + overheadCost + laborCost + otherCost,
    [totalMaterialCost, overheadCost, laborCost, otherCost],
  );

  const costPerItem = useMemo(
    () => (yieldQuantity > 0 ? totalProductionCost / yieldQuantity : 0),
    [totalProductionCost, yieldQuantity],
  );

  const suggestedSrp = useMemo(
    () =>
      costPerItem > 0 && profitMargin >= 0
        ? costPerItem * (1 + profitMargin / 100)
        : 0,
    [costPerItem, profitMargin],
  );

  const srp = srpOverride ? manualSrp : suggestedSrp;

  // Reset manual SRP when switching away from override
  useEffect(() => {
    if (!srpOverride) {
      setManualSrp(suggestedSrp);
    }
  }, [srpOverride, suggestedSrp]);

  // ── Handlers ───────────────────────────────────────────────────

  const handleRowChange = useCallback(
    (index: number, updated: MaterialRowData) => {
      setRows((prev) => prev.map((r, i) => (i === index ? updated : r)));
    },
    [],
  );

  const handleRowRemove = useCallback((index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [emptyRow()] : next;
    });
  }, []);

  const handleSrpChange = useCallback((value: number) => {
    setSrpOverride(true);
    setManualSrp(value);
  }, []);

  const handleSrpOverrideClear = useCallback(() => {
    setSrpOverride(false);
  }, []);

  // ── Validation ─────────────────────────────────────────────────

  function validate(): string[] {
    const errors: string[] = [];
    const validRows = rows.filter((r) => r.ingredientId);
    if (validRows.length === 0) errors.push("Add at least one material row");
    if (yieldQuantity <= 0) errors.push("Yield must be greater than 0");
    if (profitMargin < 0) errors.push("Profit margin cannot be negative");
    if (srp <= 0) errors.push("SRP must be greater than 0");
    return errors;
  }

  // ── Save ───────────────────────────────────────────────────────

  async function handleSave() {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    setSaving(true);

    try {
      const validRows = rows.filter((r) => r.ingredientId);
      await saveCosting({
        variantId,
        productId,
        overheadCost,
        laborCost,
        otherCost,
        yieldQuantity,
        totalMaterialCost,
        totalProductionCost,
        costPerItem,
        profitMargin,
        srp,
        srpOverride,
        materialRows: validRows.map((r) => ({
          ingredientId: r.ingredientId,
          materialName: r.materialName,
          unit: r.unit,
          costPerUnit: r.costPerUnit,
          quantityUsed: r.quantityUsed,
          rowTotal: r.rowTotal,
        })),
      });
      showToast("Costing saved! Product price updated.", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to save costing",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Costing: {productName}
        </h2>
        {initialData?.updatedAt && (
          <span className="text-xs text-gray-400">
            Last saved: {new Date(initialData.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Material rows */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Materials</h3>
        {rows.map((row, i) => (
          <MaterialRowEditor
            key={i}
            row={row}
            materials={materials}
            onChange={(updated) => handleRowChange(i, updated)}
            onRemove={() => handleRowRemove(i)}
          />
        ))}
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          + Add Material Row
        </button>

        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-500">Total Material Cost: </span>
          <span className="font-semibold text-gray-900">
            ₱{totalMaterialCost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Additional costs */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Additional Costs
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Overhead (₱)
            </label>
            <input
              type="number"
              value={overheadCost || ""}
              onChange={(e) => setOverheadCost(Number(e.target.value) || 0)}
              min="0"
              step="any"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Labor (₱)
            </label>
            <input
              type="number"
              value={laborCost || ""}
              onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
              min="0"
              step="any"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              Other (₱)
            </label>
            <input
              type="number"
              value={otherCost || ""}
              onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
              min="0"
              step="any"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-500">Total Production Cost: </span>
          <span className="font-semibold text-gray-900">
            ₱{totalProductionCost.toFixed(2)}
          </span>
          <span className="ml-2 text-xs text-gray-400">
            (materials ₱{totalMaterialCost.toFixed(2)} + overhead ₱
            {overheadCost.toFixed(2)} + labor ₱{laborCost.toFixed(2)} + other ₱
            {otherCost.toFixed(2)})
          </span>
        </div>
      </div>

      {/* Yield */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Batch Yield
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">
              Yield Quantity (pcs)
            </label>
            <input
              type="number"
              value={yieldQuantity || ""}
              onChange={(e) => setYieldQuantity(Number(e.target.value) || 0)}
              placeholder="e.g. 150"
              min="0"
              step="any"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            {yieldQuantity <= 0 && totalProductionCost > 0 && (
              <p className="mt-1 text-xs text-red-600">
                Enter yield to compute cost per item
              </p>
            )}
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-500">Cost/Item: </span>
            <span className="font-semibold text-gray-900">
              {costPerItem > 0 ? `₱${costPerItem.toFixed(4)}` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing summary (margin + SRP + profit) */}
      {costPerItem > 0 && (
        <CostSummaryCard
          totalProductionCost={totalProductionCost}
          costPerItem={costPerItem}
          yieldQuantity={yieldQuantity}
          profitMargin={profitMargin}
          srp={srp}
          srpOverride={srpOverride}
          onSrpChange={handleSrpChange}
          onSrpOverrideClear={handleSrpOverrideClear}
          onMarginChange={setProfitMargin}
        />
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <ul className="list-inside list-disc text-sm text-red-700">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
        size="lg"
      >
        {saving ? "Saving..." : "Save Costing"}
      </Button>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </div>
  );
}
