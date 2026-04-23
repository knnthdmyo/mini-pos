"use client";

import { useState } from "react";
import { prepareBatch } from "@/lib/actions/batch";
import { Button } from "@/components/ui/Button";

interface Product {
  id: string;
  name: string;
}

interface BatchPrepFormProps {
  products: Product[];
}

export function BatchPrepForm({ products }: BatchPrepFormProps) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: "error", message: "Enter a positive quantity." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      await prepareBatch(productId, qty);
      setQuantity("");
      setFeedback({ type: "success", message: "Batch prepared successfully." });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setLoading(false);
    }
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No products with recipes available for batch prep.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="product"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Product
        </label>
        <select
          id="product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-indigo-400 focus:outline-none"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="quantity"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 10"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-indigo-400 focus:outline-none"
        />
      </div>
      {feedback && (
        <p
          className={[
            "rounded-lg px-4 py-2 text-sm",
            feedback.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          {feedback.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Preparing…" : "Prepare Batch"}
      </Button>
    </form>
  );
}
