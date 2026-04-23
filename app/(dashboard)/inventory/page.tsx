import { createClient } from "@/lib/supabase/server";
import { IngredientRow } from "@/components/inventory/IngredientRow";
import { StockAdjustForm } from "@/components/inventory/StockAdjustForm";

export default async function InventoryPage() {
  const supabase = createClient();
  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, name, unit, stock_qty, cost_per_unit, low_stock_threshold")
    .order("name");

  return (
    <div className="h-full overflow-y-auto pb-20 p-4">
      <h1 className="mb-4 text-xl font-bold text-gray-900">Inventory</h1>
      <div className="flex flex-col gap-3">
        {(ingredients ?? []).map((ing) => (
          <IngredientRow key={ing.id} {...ing}>
            <StockAdjustForm ingredientId={ing.id} />
          </IngredientRow>
        ))}
        {(!ingredients || ingredients.length === 0) && (
          <p className="text-sm text-gray-400">
            No ingredients configured yet.
          </p>
        )}
      </div>
    </div>
  );
}
