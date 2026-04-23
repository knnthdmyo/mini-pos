"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ──────────────────────────────────────────────────────────

interface MaterialInput {
  name: string;
  unit: string;
  quantity: number;
  totalCost: number;
  notes?: string;
}

interface MaterialRow {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_qty: number;
  created_at: string;
}

// ── T003: getMaterialsCount ────────────────────────────────────────

export async function getMaterialsCount(): Promise<{ count: number }> {
  await requireAuth();
  const supabase = createClient();

  const { count, error } = await supabase
    .from("ingredients")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return { count: count ?? 0 };
}

// ── T004: getMaterials ─────────────────────────────────────────────

export async function getMaterials(): Promise<MaterialRow[]> {
  await requireAuth();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ingredients")
    .select("id, name, unit, cost_per_unit, stock_qty, created_at")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── T005: addMaterial ──────────────────────────────────────────────

export async function addMaterial(
  input: MaterialInput,
): Promise<{ id: string }> {
  await requireAuth();
  const supabase = createClient();

  const costPerUnit = input.quantity > 0 ? input.totalCost / input.quantity : 0;

  const { data, error } = await supabase
    .from("ingredients")
    .insert({
      name: input.name.trim(),
      unit: input.unit,
      cost_per_unit: costPerUnit,
      stock_qty: input.quantity,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/materials");
  revalidatePath("/materials");
  revalidatePath("/costing");

  return { id: data.id };
}

// ── T006: updateMaterial ───────────────────────────────────────────

export async function updateMaterial(
  id: string,
  input: MaterialInput,
): Promise<void> {
  await requireAuth();
  const supabase = createClient();

  const costPerUnit = input.quantity > 0 ? input.totalCost / input.quantity : 0;

  const { error } = await supabase
    .from("ingredients")
    .update({
      name: input.name.trim(),
      unit: input.unit,
      cost_per_unit: costPerUnit,
      stock_qty: input.quantity,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/materials");
  revalidatePath("/materials");
  revalidatePath("/costing");
}

// ── T007: deleteMaterial ───────────────────────────────────────────

export async function deleteMaterial(
  id: string,
  confirm?: boolean,
): Promise<{
  deleted: boolean;
  warning?: string;
  affectedProducts?: string[];
}> {
  await requireAuth();
  const supabase = createClient();

  // Check if referenced by any costing
  const { data: refs, error: refError } = await supabase
    .from("costing_material_rows")
    .select("costing_id, product_costings(product_id, products(name))")
    .eq("ingredient_id", id);

  if (refError) throw new Error(refError.message);

  if (refs && refs.length > 0 && !confirm) {
    const productNames = Array.from(
      new Set(
        refs.map(
          (r: Record<string, unknown>) =>
            (
              (r.product_costings as Record<string, unknown>)
                ?.products as Record<string, unknown>
            )?.name as string,
        ),
      ),
    ).filter(Boolean);

    return {
      deleted: false,
      warning: `This material is used in ${productNames.length} product costing(s). Deleting it will set the reference to null but preserve the snapshot data.`,
      affectedProducts: productNames,
    };
  }

  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/materials");
  revalidatePath("/materials");
  revalidatePath("/costing");

  return { deleted: true };
}
