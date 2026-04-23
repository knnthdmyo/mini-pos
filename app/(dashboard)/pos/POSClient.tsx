"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartSummary } from "@/components/pos/CartSummary";
import { PlaceOrderButton } from "@/components/pos/PlaceOrderButton";
import { placeOrder } from "@/lib/actions/orders";
import { usePosStore } from "@/lib/store/pos";
import type { CartLine } from "@/lib/store/pos";

interface Product {
  id: string;
  name: string;
  price: number;
  servingsLeft: number | null;
}

interface POSClientProps {
  products: Product[];
}

export function POSClient({ products }: POSClientProps) {
  const {
    cart,
    addToCart,
    removeFromCart,
    setCartQuantity,
    clearCart,
    restoreCart,
    addOrder,
    replaceOrder,
    removeOrder,
  } = usePosStore();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      setFeedback({
        type: "error",
        message: "Add at least one item before placing.",
      });
      return;
    }

    // Snapshot cart before clearing for potential rollback
    const snapshot: CartLine[] = cart.map((l) => ({ ...l }));
    const tempId = `temp-${Date.now()}`;

    // Optimistic: add order to queue and clear cart immediately
    addOrder({
      id: tempId,
      status: "placed",
      total_price: snapshot.reduce(
        (sum, l) => sum + l.unitPrice * l.quantity,
        0,
      ),
      created_at: new Date().toISOString(),
      order_items: snapshot.map((l) => ({
        product_id: l.productId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        products: { name: l.name },
      })),
    });
    clearCart();
    setFeedback({ type: "success", message: "Order placed!" });
    setLoading(true);

    try {
      const realOrder = await placeOrder(
        snapshot.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      );
      replaceOrder(tempId, realOrder);
    } catch (err: unknown) {
      // Rollback: remove optimistic order and restore cart
      removeOrder(tempId);
      restoreCart(snapshot);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to place order",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-4 pb-0">
      <h1 className="mb-4 text-xl font-bold text-gray-900 hidden md:block">
        POS
      </h1>
      <div className="flex-1 overflow-y-auto">
        {feedback && (
          <div
            className={[
              "mb-4 rounded-xl px-4 py-3 text-sm font-medium",
              feedback.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700",
            ].join(" ")}
          >
            {feedback.message}
          </div>
        )}

        <ProductGrid products={products} onAdd={(p) => addToCart(p)} />
        <CartSummary
          lines={cart}
          onSetQuantity={setCartQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
        />
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white p-4">
        <PlaceOrderButton
          isEmpty={cart.length === 0}
          loading={loading}
          onPlace={handlePlaceOrder}
          onCancel={clearCart}
        />
      </div>
    </div>
  );
}
