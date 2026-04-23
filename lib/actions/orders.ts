"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface OrderItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface PlacedOrderItem {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number;
  products: { name: string };
}

interface PlacedOrder {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  order_items: PlacedOrderItem[];
}

export async function placeOrder(items: OrderItem[]): Promise<PlacedOrder> {
  await requireAuth();

  if (!items || items.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc("place_order", {
    p_items: items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId ?? null,
      quantity: i.quantity,
    })),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/queue");

  return data as PlacedOrder;
}

export async function completeOrder(orderId: string): Promise<void> {
  await requireAuth();

  const supabase = createClient();

  const { error } = await supabase.rpc("complete_order", {
    p_order_id: orderId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/queue");
  revalidatePath("/manage");
  revalidatePath("/reports");
}

export async function editOrder(
  orderId: string,
  items: OrderItem[],
): Promise<void> {
  await requireAuth();

  if (!items || items.length === 0) {
    throw new Error("EMPTY_ORDER");
  }

  const supabase = createClient();

  // Fetch current order status
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) throw new Error("INVALID_ORDER");

  // Fetch product prices and variant prices
  const productIds = items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price")
    .in("id", productIds);

  if (productsError) throw new Error(productsError.message);

  const productMap = new Map(products?.map((p) => [p.id, p]));

  // Fetch variant prices if any items have variantId
  const variantIds = items
    .map((i) => i.variantId)
    .filter((v): v is string => !!v);
  const variantMap = new Map<string, { price: number }>();
  if (variantIds.length > 0) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, price")
      .in("id", variantIds);
    for (const v of variants ?? []) {
      variantMap.set(v.id, { price: Number(v.price) });
    }
  }

  // Delete old order items
  const { error: deleteError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (deleteError) throw new Error(deleteError.message);

  // Insert new order items
  const newItems = items.map((item) => {
    const unitPrice = item.variantId
      ? (variantMap.get(item.variantId)?.price ??
        productMap.get(item.productId)!.price)
      : productMap.get(item.productId)!.price;
    return {
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      quantity: item.quantity,
      unit_price: unitPrice,
    };
  });

  const { error: insertError } = await supabase
    .from("order_items")
    .insert(newItems);

  if (insertError) throw new Error(insertError.message);

  // Recompute total
  const newTotal = newItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  // If order was completed, reverse old deductions and re-run completion
  if (order.status === "completed") {
    const { data: priorLogs } = await supabase
      .from("inventory_logs")
      .select("ingredient_id, change_qty")
      .eq("source_type", "order")
      .eq("source_id", orderId);

    if (priorLogs && priorLogs.length > 0) {
      const reversals = priorLogs.map((log) => ({
        ingredient_id: log.ingredient_id,
        change_qty: -log.change_qty,
        source_type: "manual" as const,
        notes: `Reversal for edit of order ${orderId}`,
      }));

      await supabase.from("inventory_logs").insert(reversals);

      for (const log of priorLogs) {
        await supabase.rpc("increment_stock", {
          p_ingredient_id: log.ingredient_id,
          p_delta: -log.change_qty,
        });
      }
    }

    await supabase.rpc("complete_order", { p_order_id: orderId });
  }

  // Update total price
  await supabase
    .from("orders")
    .update({ total_price: newTotal })
    .eq("id", orderId);

  revalidatePath("/queue");
  revalidatePath("/manage");
}

export async function cancelOrder(orderId: string): Promise<void> {
  await requireAuth();

  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (order?.status === "completed") {
    const { data: priorLogs } = await supabase
      .from("inventory_logs")
      .select("ingredient_id, change_qty")
      .eq("source_type", "order")
      .eq("source_id", orderId);

    if (priorLogs && priorLogs.length > 0) {
      const reversals = priorLogs.map((log) => ({
        ingredient_id: log.ingredient_id,
        change_qty: -log.change_qty,
        source_type: "manual" as const,
        notes: `Reversal for cancelled order ${orderId}`,
      }));

      await supabase.from("inventory_logs").insert(reversals);

      for (const log of priorLogs) {
        await supabase.rpc("increment_stock", {
          p_ingredient_id: log.ingredient_id,
          p_delta: -log.change_qty,
        });
      }
    }
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (itemsError) throw new Error(itemsError.message);

  const { error } = await supabase.from("orders").delete().eq("id", orderId);

  if (error) throw new Error(error.message);

  revalidatePath("/queue");
  revalidatePath("/manage");
}
