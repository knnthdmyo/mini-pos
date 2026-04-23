"use client";

import { useMemo } from "react";

interface Material {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

export interface MaterialRowData {
  ingredientId: string;
  materialName: string;
  unit: string;
  costPerUnit: number;
  quantityUsed: number;
  rowTotal: number;
}

interface MaterialRowEditorProps {
  row: MaterialRowData;
  materials: Material[];
  onChange: (updated: MaterialRowData) => void;
  onRemove: () => void;
}

export default function MaterialRowEditor({
  row,
  materials,
  onChange,
  onRemove,
}: MaterialRowEditorProps) {
  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === row.ingredientId),
    [materials, row.ingredientId],
  );

  function handleMaterialChange(id: string) {
    const mat = materials.find((m) => m.id === id);
    if (mat) {
      const costPerUnit = Number(mat.cost_per_unit);
      onChange({
        ingredientId: mat.id,
        materialName: mat.name,
        unit: mat.unit,
        costPerUnit,
        quantityUsed: row.quantityUsed,
        rowTotal: row.quantityUsed * costPerUnit,
      });
    }
  }

  function handleQuantityChange(val: string) {
    const qty = Number(val) || 0;
    onChange({
      ...row,
      quantityUsed: qty,
      rowTotal: qty * row.costPerUnit,
    });
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-[2]">
        <label className="mb-1 block text-xs text-gray-500">Material</label>
        <select
          value={row.ingredientId}
          onChange={(e) => handleMaterialChange(e.target.value)}
          className="w-full rounded-lg border border-brand-border px-2 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none"
        >
          <option value="">Select...</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="mb-1 block text-xs text-gray-500">Unit</label>
        <input
          type="text"
          value={selectedMaterial?.unit ?? row.unit ?? ""}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-600"
        />
      </div>

      <div className="flex-1">
        <label className="mb-1 block text-xs text-gray-500">Cost/Unit</label>
        <input
          type="text"
          value={row.costPerUnit > 0 ? `₱${row.costPerUnit.toFixed(4)}` : "—"}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-600"
        />
      </div>

      <div className="flex-1">
        <label className="mb-1 block text-xs text-gray-500">Qty Used</label>
        <input
          type="number"
          value={row.quantityUsed || ""}
          onChange={(e) => handleQuantityChange(e.target.value)}
          placeholder="0"
          min="0"
          step="any"
          className="w-full rounded-lg border border-brand-border px-2 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none"
        />
      </div>

      <div className="flex-1">
        <label className="mb-1 block text-xs text-gray-500">Total</label>
        <input
          type="text"
          value={row.rowTotal > 0 ? `₱${row.rowTotal.toFixed(2)}` : "—"}
          readOnly
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-medium text-brand-text"
        />
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="mb-0.5 rounded-lg p-2 text-red-500 hover:bg-red-50"
        aria-label="Remove row"
      >
        ✕
      </button>
    </div>
  );
}
