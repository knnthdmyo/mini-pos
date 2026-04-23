"use client";

import { useState, useEffect } from "react";
import { completeOrder, cancelOrder } from "@/lib/actions/orders";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  products: { name: string };
}

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  onComplete: (id: string) => void;
  onEdit: (order: Order) => void;
  onCancel: (id: string) => void;
}

function useElapsed(createdAt: string) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function update() {
      const seconds = Math.floor(
        (Date.now() - new Date(createdAt).getTime()) / 1000,
      );
      if (seconds < 60) setElapsed(`${seconds}s ago`);
      else if (seconds < 3600) setElapsed(`${Math.floor(seconds / 60)}m ago`);
      else setElapsed(`${Math.floor(seconds / 3600)}h ago`);
    }
    update();
    const timer = setInterval(update, 10_000);
    return () => clearInterval(timer);
  }, [createdAt]);

  return elapsed;
}

export function OrderCard({
  order,
  onComplete,
  onEdit,
  onCancel,
}: OrderCardProps) {
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const elapsed = useElapsed(order.created_at);

  async function handleComplete() {
    setCompleting(true);
    try {
      await completeOrder(order.id);
      onComplete(order.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  }

  async function handleConfirmCancel() {
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      onCancel(order.id);
    } catch (err) {
      console.error(err);
      setCancelling(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{elapsed}</span>
          <Badge variant="info">Placed</Badge>
        </div>

        <ul className="space-y-1">
          {order.order_items.map((item) => (
            <li
              key={item.product_id}
              className="flex justify-between text-sm text-gray-700"
            >
              <span>
                {item.quantity}× {item.products?.name}
              </span>
              <span className="text-gray-500">
                ₱{(item.unit_price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
          <span className="font-bold text-gray-900">
            ₱{order.total_price.toFixed(2)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              Cancel
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(order)}>
              Edit
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? "…" : "Complete"}
            </Button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl mx-4">
            <h2 className="text-base font-bold text-gray-900 mb-2">
              Cancel order?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This will remove the order. Any deducted stock will be restored.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmOpen(false)}
                disabled={cancelling}
              >
                Keep
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
