"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface VariantInput {
  name: string;
  price: number;
}

export interface VariantRow {
  id: string;
  product_id: string;
  name: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export async function getVariants(productId: string): Promise<VariantRow[]> {
  await requireAuth();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addVariant(
  productId: string,
  input: VariantInput,
): Promise<{ id: string }> {
  await requireAuth();
  const supabase = createClient();

  // Get max sort_order
  const { data: existing } = await supabase
    .from("product_variants")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing?.length ? (existing[0].sort_order ?? 0) + 1 : 0;

  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: productId,
      name: input.name.trim(),
      price: input.price,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath("/pos");
  revalidatePath("/costing");

  return { id: data.id };
}

export async function updateVariant(
  id: string,
  input: VariantInput,
): Promise<void> {
  await requireAuth();
  const supabase = createClient();

  const { error } = await supabase
    .from("product_variants")
    .update({ name: input.name.trim(), price: input.price })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath("/pos");
  revalidatePath("/costing");
}

export async function deleteVariant(id: string): Promise<void> {
  await requireAuth();
  const supabase = createClient();

  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath("/pos");
  revalidatePath("/costing");
}
