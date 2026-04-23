"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function adjustStock(
  ingredientId: string,
  delta: number,
  notes?: string,
): Promise<void> {
  await requireAuth();

  const supabase = createClient();

  // Update stock qty
  const { error: updateError } = await supabase.rpc("increment_stock", {
    p_ingredient_id: ingredientId,
    p_delta: delta,
  });

  if (updateError) throw new Error(updateError.message);

  // Log the adjustment
  const { error: logError } = await supabase.from("inventory_logs").insert({
    ingredient_id: ingredientId,
    change_qty: delta,
    source_type: "manual",
    type: "manual",
    notes: notes ?? null,
  });

  if (logError) throw new Error(logError.message);

  revalidatePath("/inventory");
}
