import { createClient } from "@/lib/supabase/server";
import { BatchPrepForm } from "@/components/batch/BatchPrepForm";

export default async function BatchPage() {
  const supabase = createClient();

  // Only products that have at least one recipe line
  const { data: productsWithRecipes } = await supabase
    .from("recipes")
    .select("product_id, products(id, name)")
    .order("product_id");

  // Deduplicate by product_id
  const seen = new Set<string>();
  const products: { id: string; name: string }[] = [];
  for (const row of productsWithRecipes ?? []) {
    const p = row.products as unknown as { id: string; name: string };
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      products.push(p);
    }
  }

  return (
    <div className="h-full overflow-y-auto pb-20 p-4">
      <h1 className="mb-6 text-xl font-bold text-gray-900">
        Batch Preparation
      </h1>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm max-w-md">
        <BatchPrepForm products={products} />
      </div>
    </div>
  );
}
