import { createClient } from "@/lib/supabase/server";
import { POSQueueClient } from "./POSQueueClient";

export default async function POSPage() {
  const supabase = createClient();

  const [{ data: products }, { data: orders }, { data: recipes }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, price")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .eq("status", "placed")
        .order("created_at", { ascending: true }),
      supabase
        .from("recipes")
        .select("product_id, quantity_per_unit, ingredients(stock_qty)"),
    ]);

  // Compute servings available per product (min stock across all recipe ingredients)
  const stockMap = new Map<string, number>();
  for (const r of recipes ?? []) {
    const ingredient = r.ingredients as unknown as { stock_qty: number } | null;
    const stock = ingredient?.stock_qty ?? 0;
    const servings =
      r.quantity_per_unit > 0 ? Math.floor(stock / r.quantity_per_unit) : 0;
    const current = stockMap.get(r.product_id);
    stockMap.set(
      r.product_id,
      current === undefined ? servings : Math.min(current, servings),
    );
  }

  const productsWithStock = (products ?? []).map((p) => ({
    ...p,
    servingsLeft: stockMap.get(p.id) ?? null,
  }));

  return (
    <POSQueueClient
      initialOrders={orders ?? []}
      products={products ?? []}
      productsWithStock={productsWithStock}
    />
  );
}

