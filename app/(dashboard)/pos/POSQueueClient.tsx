"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { POSClient } from "./POSClient";
import { QueueList } from "@/components/queue/QueueList";
import { usePosStore, usePosStoreApi } from "@/lib/store/PosStoreProvider";
import type { Order } from "@/lib/store/pos";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductWithStock {
  id: string;
  variantId: string | null;
  name: string;
  price: number;
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
  const { orders, initOrders, addOrder, removeOrder, updateOrders } =
    usePosStore();
  const storeApi = usePosStoreApi();
  const [activeTab, setActiveTab] = useState<"pos" | "queue">("pos");

  // Seed store with server-rendered orders on first mount
  useEffect(() => {
    initOrders(initialOrders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            const current = storeApi.getState().orders;
            if (current.some((o) => o.id === record.id)) return;

            supabase
              .from("orders")
              .select("*, order_items(*, products(name))")
              .eq("id", record.id)
              .single()
              .then(({ data }) => {
                if (data) addOrder(data as Order);
              });
          }

          if (payload.eventType === "UPDATE" && record.status === "completed") {
            removeOrder(record.id);
          }

          if (payload.eventType === "UPDATE" && record.status === "placed") {
            updateOrders((prev) =>
              prev.map((o) =>
                o.id === record.id
                  ? {
                      ...o,
                      change_given: record.change_given,
                      amount_received: record.amount_received,
                      change_amount: record.change_amount,
                    }
                  : o,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addOrder, removeOrder, updateOrders]);

  const queuePanel = (
    <div className="flex flex-col h-full overflow-hidden bg-brand-bg">
      <div className="sticky top-0 z-10 border-b border-brand-border/30 bg-brand-bg px-4 py-3 hidden md:block">
        <h2 className="text-lg font-bold text-brand-text">Queue</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <QueueList
          orders={orders}
          products={products}
          onComplete={removeOrder}
          onCancel={removeOrder}
          onOrdersChange={updateOrders}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile: tab layout ── */}
      <div className="flex flex-col h-[calc(100dvh-8rem)] md:hidden">
        {/* Tab bar */}
        <div className="flex shrink-0 border-b border-brand-border/30 glass-heavy">
          {(["pos", "queue"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors",
                activeTab === tab
                  ? "border-b-2 border-brand-primary text-brand-primary"
                  : "text-brand-muted",
              ].join(" ")}
            >
              {tab === "pos" ? "POS" : "Queue"}
              {tab === "queue" && orders.length > 0 && (
                <span className="rounded-full bg-brand-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "pos" ? (
            <POSClient products={productsWithStock} />
          ) : (
            queuePanel
          )}
        </div>
      </div>

      {/* ── Desktop: two-column layout ── */}
      <div className="hidden md:flex h-[calc(100dvh-8rem)] divide-x divide-gray-200 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <POSClient products={productsWithStock} />
        </div>
        <div className="flex w-[420px] shrink-0 flex-col overflow-hidden">
          {queuePanel}
        </div>
      </div>
    </>
  );
}
