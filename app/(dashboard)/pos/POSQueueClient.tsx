"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { POSClient } from "./POSClient";
import { QueueList } from "@/components/queue/QueueList";

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

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductWithStock extends Product {
  servingsLeft: number | null;
}

interface Props {
  initialOrders: Order[];
  products: Product[];
  productsWithStock: ProductWithStock[];
}

export function POSQueueClient({
  initialOrders,
  products,
  productsWithStock,
}: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"pos" | "queue">("pos");

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("orders-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const record = payload.new as Order & { status: string };

          if (payload.eventType === "INSERT" && record.status === "placed") {
            setOrders((prev) => {
              if (prev.some((o) => o.id === record.id)) return prev;
              supabase
                .from("orders")
                .select("*, order_items(*, products(name))")
                .eq("id", record.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setOrders((p) =>
                      p.some((o) => o.id === data.id)
                        ? p
                        : [...p, data as Order],
                    );
                  }
                });
              return prev;
            });
          }

          if (payload.eventType === "UPDATE" && record.status === "completed") {
            setOrders((prev) => prev.filter((o) => o.id !== record.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleOrderPlaced(orderId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name))")
      .eq("id", orderId)
      .single();
    if (data) {
      setOrders((prev) =>
        prev.some((o) => o.id === data.id) ? prev : [...prev, data as Order],
      );
    }
  }

  function handleComplete(orderId: string) {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }

  function handleCancel(orderId: string) {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }

  const queuePanel = (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-4 py-3 hidden md:block">
        <h2 className="text-lg font-bold text-gray-900">Queue</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <QueueList
          orders={orders}
          products={products}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onOrdersChange={setOrders}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile: tab layout ── */}
      <div className="flex flex-col h-[calc(100dvh-4rem)] md:hidden">
        {/* Tab bar */}
        <div className="flex shrink-0 border-b border-gray-200 bg-white">
          {(["pos", "queue"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors",
                activeTab === tab
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500",
              ].join(" ")}
            >
              {tab === "pos" ? "POS" : "Queue"}
              {tab === "queue" && orders.length > 0 && (
                <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "pos" ? (
            <POSClient
              products={productsWithStock}
              onOrderPlaced={handleOrderPlaced}
            />
          ) : (
            queuePanel
          )}
        </div>
      </div>

      {/* ── Desktop: two-column layout ── */}
      <div className="hidden md:flex h-[calc(100dvh-4rem)] divide-x divide-gray-200 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <POSClient
            products={productsWithStock}
            onOrderPlaced={handleOrderPlaced}
          />
        </div>
        <div className="flex w-[420px] shrink-0 flex-col overflow-hidden">
          {queuePanel}
        </div>
      </div>
    </>
  );
}
