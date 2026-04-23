"use client";

import { useState, useEffect } from "react";
import {
  completeOrder,
  cancelOrder,
  markChangeGiven,
} from "@/lib/actions/orders";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Toast, useToast } from "@/components/ui/Toast";

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
  amount_received?: number | null;
  change_amount?: number | null;
  change_given?: boolean;
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
  const [changeConfirmOpen, setChangeConfirmOpen] = useState(false);
  const [changeMarked, setChangeMarked] = useState(order.change_given ?? true);
  const { toast, showToast, dismiss } = useToast();
  const elapsed = useElapsed(order.created_at);

  async function handleMarkChangeGiven() {
    setChangeMarked(true); // optimistic
    try {
      await markChangeGiven(order.id);
    } catch (err) {
      setChangeMarked(false);
      showToast(
        err instanceof Error ? err.message : "Failed to update",
        "error",
      );
    }
  }

  const showChangeBadge =
    !changeMarked && order.change_amount != null && order.change_amount > 0;

  function handleCompleteClick() {
    if (showChangeBadge) {
      setChangeConfirmOpen(true);
      return;
    }
    doComplete();
  }

  async function doComplete() {
    setChangeConfirmOpen(false);
    setCompleting(true);
    try {
      await completeOrder(order.id);
      onComplete(order.id);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to complete order",
        "error",
      );
    } finally {
      setCompleting(false);
    }
  }

  async function handleGiveChangeThenComplete() {
    setChangeMarked(true);
    try {
      await markChangeGiven(order.id);
    } catch {
      setChangeMarked(false);
    }
    doComplete();
  }

  async function handleConfirmCancel() {
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      onCancel(order.id);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to cancel order",
        "error",
      );
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

        <div className="border-t border-gray-100 pt-2 flex flex-col gap-2">
          {/* Change badge */}
          {showChangeBadge && (
            <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <span className="text-xs font-medium text-amber-700">
                Change owed: ₱{order.change_amount!.toFixed(2)}
              </span>
              <button
                onClick={handleMarkChangeGiven}
                className="text-xs font-semibold text-amber-600 hover:text-amber-800 underline"
              >
                Mark as Given
              </button>
            </div>
          )}
          {changeMarked &&
            order.change_amount != null &&
            order.change_amount > 0 && (
              <div className="flex items-center gap-1 px-1">
                <span className="text-xs text-green-600">✓ Change given</span>
              </div>
            )}

          <div className="flex items-center justify-between">
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
                onClick={handleCompleteClick}
                disabled={completing}
              >
                {completing ? "…" : "Complete"}
              </Button>
            </div>
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

      {changeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl mx-4">
            <h2 className="text-base font-bold text-gray-900 mb-2">
              Change still owed
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              This order has{" "}
              <span className="font-semibold text-amber-700">
                ₱{order.change_amount!.toFixed(2)}
              </span>{" "}
              in change that hasn&apos;t been given yet.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Have you given the change to the customer?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleGiveChangeThenComplete}
                disabled={completing}
                className="w-full"
              >
                Yes, change given — complete order
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => doComplete()}
                disabled={completing}
                className="w-full"
              >
                Complete without giving change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChangeConfirmOpen(false)}
                disabled={completing}
                className="w-full"
              >
                Go back
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </>
  );
}
