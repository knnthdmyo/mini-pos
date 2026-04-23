"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartSummary } from "@/components/pos/CartSummary";
import { PlaceOrderButton } from "@/components/pos/PlaceOrderButton";
import { Toast, useToast } from "@/components/ui/Toast";
import { placeOrder } from "@/lib/actions/orders";
import { usePosStore } from "@/lib/store/PosStoreProvider";
import type { CartLine } from "@/lib/store/pos";

interface Product {
  id: string;
  variantId?: string | null;
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
  const { toast, showToast, dismiss } = useToast();

  async function handlePlaceOrder() {
    if (cart.length === 0) {
      showToast("Add at least one item before placing.", "error");
      return;
    }

    const snapshot: CartLine[] = cart.map((l) => ({ ...l }));
    const tempId = `temp-${Date.now()}`;

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
        variant_id: l.variantId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        products: { name: l.name },
      })),
    });
    clearCart();
    setLoading(true);

    try {
      const realOrder = await placeOrder(
        snapshot.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.quantity,
        })),
      );
      replaceOrder(tempId, realOrder);
      showToast("Order placed!", "success");
    } catch (err: unknown) {
      removeOrder(tempId);
      restoreCart(snapshot);
      showToast(
        err instanceof Error ? err.message : "Failed to place order",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-gray-50 p-4 pb-0">
      <div className="flex-1 overflow-y-auto">
        <ProductGrid
          products={products}
          onAdd={(p) =>
            addToCart({
              id: p.id,
              variantId: p.variantId,
              name: p.name,
              price: p.price,
            })
          }
        />
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </div>
  );
}
