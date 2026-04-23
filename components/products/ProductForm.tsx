"use client";

import { useState } from "react";
import { addProduct, updateProduct } from "@/lib/actions/products";
import { Button } from "@/components/ui/Button";

interface ProductFormProps {
  initialData?: { id: string; name: string; price: number };
  onSuccess: () => void;
}

export default function ProductForm({
  initialData,
  onSuccess,
}: ProductFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [price, setPrice] = useState(initialData?.price ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setError("");
    setSaving(true);
    try {
      if (initialData) {
        await updateProduct(initialData.id, { name, price });
      } else {
        await addProduct({ name, price });
      }
      onSuccess();
      if (!initialData) {
        setName("");
        setPrice(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">
            Product Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Classic Milkshake"
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Price (₱)</label>
          <input
            type="number"
            value={price || ""}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            placeholder="0.00"
            min="0"
            step="any"
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-text bg-brand-surface/40 focus:border-brand-primary focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving..." : initialData ? "Update" : "Add Product"}
      </Button>
    </form>
  );
}
