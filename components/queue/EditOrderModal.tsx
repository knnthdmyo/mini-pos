"use client";

import { useState } from "react";
import { editOrder } from "@/lib/actions/orders";
import { Button } from "@/components/ui/Button";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  products: { name: string };
}

interface Order {
  id: string;
  order_items: OrderItem[];
}

interface EditOrderModalProps {
  order: Order;
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditOrderModal({
  order,
  products,
  onClose,
  onSaved,
}: EditOrderModalProps) {
  const [lines, setLines] = useState<{ productId: string; quantity: number }[]>(
    order.order_items.map((i) => ({
      productId: i.product_id,
      quantity: i.quantity,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addProduct(productId: string) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  }

  function removeProduct(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  async function handleSave() {
    if (lines.length === 0) {
      setError("Order must have at least one item.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await editOrder(order.id, lines);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl mx-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Current items */}
        {lines.length > 0 && (
          <ul className="mb-4 space-y-2">
            {lines.map((line) => {
              const product = productMap.get(line.productId);
              return (
                <li
                  key={line.productId}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2"
                >
                  <span className="font-medium text-gray-900">
                    {product?.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">× {line.quantity}</span>
                    <button
                      onClick={() => removeProduct(line.productId)}
                      className="text-gray-400 hover:text-red-500 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Add products */}
        <div className="mb-4 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p.id)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100"
            >
              <div className="font-medium text-gray-900">{p.name}</div>
              <div className="text-gray-500">₱{p.price.toFixed(2)}</div>
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
            className="flex-[2]"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
