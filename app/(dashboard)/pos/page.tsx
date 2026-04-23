import { createClient } from "@/lib/supabase/server";
import { POSQueueClient } from "./POSQueueClient";

export default async function POSPage() {
  const supabase = createClient();

  const [{ data: products }, { data: variants }, { data: orders }, { data: recipes }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, price")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("product_variants")
        .select("id, product_id, name, price, sort_order")
        .eq("is_active", true)
        .order("sort_order")
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

  // Compute servings available per product
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

  // Group variants by product
  const variantsByProduct = new Map<string, typeof variants>();
  for (const v of variants ?? []) {
    const pid = (v as Record<string, unknown>).product_id as string;
    if (!variantsByProduct.has(pid)) variantsByProduct.set(pid, []);
    variantsByProduct.get(pid)!.push(v);
  }

  // Build POS items: products with variants expand into variant items
  const posItems = (products ?? []).flatMap((p) => {
    const pVariants = variantsByProduct.get(p.id);
    if (pVariants && pVariants.length > 0) {
      return pVariants.map((v) => ({
        id: p.id,
        variantId: v.id,
        name: `${p.name} (${v.name})`,
        price: Number(v.price),
        servingsLeft: stockMap.get(p.id) ?? null,
      }));
    }
    return [{
      id: p.id,
      variantId: null as string | null,
      name: p.name,
      price: Number(p.price),
      servingsLeft: stockMap.get(p.id) ?? null,
    }];
  });

  return (
    <POSQueueClient
      initialOrders={orders ?? []}
      products={products ?? []}
      productsWithStock={posItems}
    />
  );
}
