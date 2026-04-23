"use client";

import { useState } from "react";
import { OrderCard } from "./OrderCard";
import { EditOrderModal } from "./EditOrderModal";

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

interface QueueListProps {
  orders: Order[];
  products: { id: string; name: string; price: number }[];
  onComplete: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onOrdersChange: (updater: (prev: Order[]) => Order[]) => void;
}

export function QueueList({
  orders,
  products,
  onComplete,
  onCancel,
  onOrdersChange,
}: QueueListProps) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  if (orders.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400">
        No active orders
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onComplete={onComplete}
            onEdit={setEditingOrder}
            onCancel={onCancel}
          />
        ))}
      </div>

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          products={products}
          onClose={() => setEditingOrder(null)}
          onSaved={() => {
            setEditingOrder(null);
            // Refresh edited order in parent state
            onOrdersChange((prev) =>
              prev.map((o) =>
                o.id === editingOrder.id
                  ? { ...o, order_items: editingOrder.order_items }
                  : o,
              ),
            );
          }}
        />
      )}
    </>
  );
}
