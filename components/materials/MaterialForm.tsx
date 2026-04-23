"use client";

import { useState, useMemo } from "react";
import { addMaterial, updateMaterial } from "@/lib/actions/materials";
import { Button } from "@/components/ui/Button";

interface MaterialFormProps {
  onSuccess?: () => void;
  initialData?: {
    id: string;
    name: string;
    unit: string;
    stock_qty: number;
    cost_per_unit: number;
  };
}

const UNITS = ["g", "kg", "pc", "ml", "L"] as const;

export default function MaterialForm({
  onSuccess,
  initialData,
}: MaterialFormProps) {
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name ?? "");
  const [unit, setUnit] = useState(initialData?.unit ?? "g");
  const [quantity, setQuantity] = useState(
    initialData ? String(initialData.stock_qty) : "",
  );
  const [totalCost, setTotalCost] = useState(
    initialData
      ? String(initialData.cost_per_unit * initialData.stock_qty)
      : "",
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const qty = Number(quantity) || 0;
  const cost = Number(totalCost) || 0;
  const costPerUnit = useMemo(() => (qty > 0 ? cost / qty : 0), [qty, cost]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (cost < 0) {
      setError("Total cost cannot be negative");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && initialData) {
        await updateMaterial(initialData.id, {
          name: name.trim(),
          unit,
          quantity: qty,
          totalCost: cost,
          notes: notes || undefined,
        });
      } else {
        await addMaterial({
          name: name.trim(),
          unit,
          quantity: qty,
          totalCost: cost,
          notes: notes || undefined,
        });
      }

      if (!isEditing) {
        setName("");
        setQuantity("");
        setTotalCost("");
        setNotes("");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save material");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sugar"
          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Unit
        </label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 25"
            min="0"
            step="any"
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Total Cost (₱)
          </label>
          <input
            type="number"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            placeholder="e.g. 500"
            min="0"
            step="any"
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
          />
        </div>
      </div>

      <div className="rounded-lg bg-brand-surface/40 px-3 py-2 text-sm">
        <span className="text-gray-500">Cost per unit: </span>
        <span className="font-semibold text-brand-text">
          {qty > 0 ? `₱${costPerUnit.toFixed(4)}` : "—"}
        </span>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Bought from market"
          rows={2}
          className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving..." : isEditing ? "Update Material" : "Add Material"}
      </Button>
    </form>
  );
}
