"use client";

import { useState, useEffect } from "react";
import { getVariants, addVariant, updateVariant, deleteVariant } from "@/lib/actions/variants";
import { Button } from "@/components/ui/Button";
import { Toast, useToast } from "@/components/ui/Toast";

interface Variant {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

interface VariantManagerProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function VariantManager({ productId, productName, onClose }: VariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  async function loadVariants() {
    setLoading(true);
    try {
      const data = await getVariants(productId);
      setVariants(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadVariants(); }, [productId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (newPrice <= 0) { showToast("Price must be > 0", "error"); return; }
    setSaving(true);
    try {
      await addVariant(productId, { name: newName, price: newPrice });
      setNewName("");
      setNewPrice(0);
      showToast("Variant added!", "success");
      await loadVariants();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    if (editPrice <= 0) { showToast("Price must be > 0", "error"); return; }
    setSaving(true);
    try {
      await updateVariant(id, { name: editName, price: editPrice });
      setEditingId(null);
      showToast("Variant updated!", "success");
      await loadVariants();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await deleteVariant(id);
      showToast("Variant deleted", "success");
      await loadVariants();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Variants — {productName}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Small"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="number"
            value={newPrice || ""}
            onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
            placeholder="₱"
            min="0"
            step="any"
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <Button type="submit" size="sm" disabled={saving}>Add</Button>
        </form>

        {/* Variant list */}
        {loading ? (
          <p className="py-4 text-center text-sm text-gray-400">Loading...</p>
        ) : variants.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No variants yet. Add sizes like S, M, L above.
          </p>
        ) : (
          <div className="space-y-2">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                {editingId === v.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={editPrice || ""}
                      onChange={(e) => setEditPrice(Number(e.target.value) || 0)}
                      min="0"
                      step="any"
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleUpdate(v.id)}
                      disabled={saving}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-900">{v.name}</span>
                    <span className="text-sm text-gray-600">₱{Number(v.price).toFixed(2)}</span>
                    <button
                      onClick={() => { setEditingId(v.id); setEditName(v.name); setEditPrice(Number(v.price)); }}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={saving}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}
      </div>
    </div>
  );
}
