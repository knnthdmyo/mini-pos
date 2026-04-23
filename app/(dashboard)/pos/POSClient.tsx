"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartSummary } from "@/components/pos/CartSummary";
import { PlaceOrderButton } from "@/components/pos/PlaceOrderButton";
import { placeOrder } from "@/lib/actions/orders";

interface Product {
  id: string;
  name: string;
  price: number;
  servingsLeft: number | null;
}

interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface POSClientProps {
  products: Product[];
  onOrderPlaced?: (orderId: string) => Promise<void>;
}

export function POSClient({ products, onOrderPlaced }: POSClientProps) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
        },
      ];
    });
    setFeedback(null);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function setCartQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }

  function clearCart() {
    setCart([]);
    setFeedback(null);
  }

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      setFeedback({
        type: "error",
        message: "Add at least one item before placing.",
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const result = await placeOrder(
        cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      );
      setCart([]);
      setFeedback({ type: "success", message: "Order placed!" });
      await onOrderPlaced?.(result.orderId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to place order";
      setFeedback({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-4 pb-0">
      {/* Scrollable content */}
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

        <ProductGrid products={products} onAdd={addToCart} />
        <CartSummary
          lines={cart}
          onSetQuantity={setCartQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
        />
      </div>

      {/* Fixed action bar */}
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
