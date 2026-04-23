"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ProductInput {
  name: string;
  price: number;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export async function getProducts(): Promise<ProductRow[]> {
  await requireAuth();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, is_active, created_at")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addProduct(
  input: ProductInput,
): Promise<{ id: string }> {
  await requireAuth();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name.trim(),
      price: input.price,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/manage");
  revalidatePath("/pos");
  revalidatePath("/manage");

  return { id: data.id };
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<void> {
  await requireAuth();
  const supabase = createClient();

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      price: input.price,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/manage");
  revalidatePath("/pos");
  revalidatePath("/manage");
}

export async function toggleProductActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await requireAuth();
  const supabase = createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/manage");
  revalidatePath("/pos");
  revalidatePath("/manage");
}

export async function deleteProduct(
  id: string,
): Promise<{ deleted: boolean; error?: string }> {
  await requireAuth();
  const supabase = createClient();

  // Check for existing orders referencing this product
  const { count, error: checkErr } = await supabase
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  if (checkErr) throw new Error(checkErr.message);

  if (count && count > 0) {
    return {
      deleted: false,
      error: `This product has ${count} order(s). Deactivate it instead of deleting.`,
    };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/manage");
  revalidatePath("/pos");
  revalidatePath("/manage");

  return { deleted: true };
}
