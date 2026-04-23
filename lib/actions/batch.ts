"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function prepareBatch(
  productId: string,
  quantity: number,
): Promise<void> {
  await requireAuth();

  if (!productId) throw new Error("INVALID_PRODUCT");
  if (quantity <= 0) throw new Error("INVALID_QUANTITY");

  const supabase = createClient();

  const { error } = await supabase.rpc("prepare_batch", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/inventory");
  revalidatePath("/batch");
}
