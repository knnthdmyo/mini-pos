"use server";

import { createClient, requireAuth } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ──────────────────────────────────────────────────────────

interface CostingMaterialRow {
  ingredientId: string;
  materialName: string;
  unit: string;
  costPerUnit: number;
  quantityUsed: number;
  rowTotal: number;
}

interface SaveCostingInput {
  productId: string;
  variantId?: string | null;
  overheadCost: number;
  laborCost: number;
  otherCost: number;
  yieldQuantity: number;
  totalMaterialCost: number;
  totalProductionCost: number;
  costPerItem: number;
  profitMargin: number;
  srp: number;
  srpOverride: boolean;
  materialRows: CostingMaterialRow[];
}

interface CostingRow {
  id: string;
  ingredientId: string | null;
  materialName: string;
  unit: string;
  costPerUnit: number;
  quantityUsed: number;
  rowTotal: number;
}

interface CostingResult {
  id: string;
  productId: string;
  variantId: string | null;
  overheadCost: number;
  laborCost: number;
  otherCost: number;
  yieldQuantity: number;
  totalMaterialCost: number;
  totalProductionCost: number;
  costPerItem: number;
  profitMargin: number;
  srp: number;
  srpOverride: boolean;
  updatedAt: string;
  materialRows: CostingRow[];
}

interface VariantWithCosting {
  id: string;
  name: string;
  price: number;
  hasCosting: boolean;
  costPerItem: number | null;
  srp: number | null;
}

interface ProductWithCostingStatus {
  id: string;
  name: string;
  price: number;
  hasCosting: boolean;
  costPerItem: number | null;
  srp: number | null;
  variants: VariantWithCosting[];
}

// ── getProductsWithCostingStatus ───────────────────────────────────

export async function getProductsWithCostingStatus(): Promise<
  ProductWithCostingStatus[]
> {
  await requireAuth();
  const supabase = createClient();

  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("is_active", true)
    .order("name");

  if (pErr) throw new Error(pErr.message);

  const { data: variants, error: vErr } = await supabase
    .from("product_variants")
    .select("id, product_id, name, price, sort_order")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (vErr) throw new Error(vErr.message);

  const { data: costings, error: cErr } = await supabase
    .from("product_costings")
    .select("product_id, variant_id, cost_per_item, srp");

  if (cErr) throw new Error(cErr.message);

  // Build costing lookup: key = variantId or productId
  const costingByVariant = new Map<string, Record<string, unknown>>();
  const costingByProduct = new Map<string, Record<string, unknown>>();
  for (const c of costings ?? []) {
    const rec = c as Record<string, unknown>;
    if (rec.variant_id) {
      costingByVariant.set(rec.variant_id as string, rec);
    } else {
      costingByProduct.set(rec.product_id as string, rec);
    }
  }

  // Group variants by product
  const variantsByProduct = new Map<string, typeof variants>();
  for (const v of variants ?? []) {
    const pid = (v as Record<string, unknown>).product_id as string;
    if (!variantsByProduct.has(pid)) variantsByProduct.set(pid, []);
    variantsByProduct.get(pid)!.push(v);
  }

  return (products ?? []).map((p: Record<string, unknown>) => {
    const pid = p.id as string;
    const pVariants = variantsByProduct.get(pid) ?? [];
    const c = costingByProduct.get(pid);

    const mappedVariants: VariantWithCosting[] = pVariants.map(
      (v: Record<string, unknown>) => {
        const vc = costingByVariant.get(v.id as string);
        return {
          id: v.id as string,
          name: v.name as string,
          price: Number(v.price),
          hasCosting: !!vc,
          costPerItem: vc ? Number(vc.cost_per_item) : null,
          srp: vc ? Number(vc.srp) : null,
        };
      },
    );

    return {
      id: pid,
      name: p.name as string,
      price: Number(p.price),
      hasCosting: pVariants.length > 0
        ? mappedVariants.some((v) => v.hasCosting)
        : !!c,
      costPerItem: c ? Number(c.cost_per_item) : null,
      srp: c ? Number(c.srp) : null,
      variants: mappedVariants,
    };
  });
}

// ── getCosting ─────────────────────────────────────────────────────

export async function getCosting(
  productId: string,
  variantId?: string | null,
): Promise<CostingResult | null> {
  await requireAuth();
  const supabase = createClient();

  let query = supabase
    .from("product_costings")
    .select("*")
    .eq("product_id", productId);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { data: costing, error: cErr } = await query.maybeSingle();

  if (cErr) throw new Error(cErr.message);
  if (!costing) return null;

  const { data: rows, error: rErr } = await supabase
    .from("costing_material_rows")
    .select("*")
    .eq("costing_id", costing.id)
    .order("created_at");

  if (rErr) throw new Error(rErr.message);

  return {
    id: costing.id,
    productId: costing.product_id,
    variantId: costing.variant_id ?? null,
    overheadCost: Number(costing.overhead_cost),
    laborCost: Number(costing.labor_cost),
    otherCost: Number(costing.other_cost),
    yieldQuantity: Number(costing.yield_quantity),
    totalMaterialCost: Number(costing.total_material_cost),
    totalProductionCost: Number(costing.total_production_cost),
    costPerItem: Number(costing.cost_per_item),
    profitMargin: Number(costing.profit_margin),
    srp: Number(costing.srp),
    srpOverride: costing.srp_override,
    updatedAt: costing.updated_at,
    materialRows: (rows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      ingredientId: (r.ingredient_id as string) ?? null,
      materialName: r.material_name as string,
      unit: r.unit as string,
      costPerUnit: Number(r.cost_per_unit),
      quantityUsed: Number(r.quantity_used),
      rowTotal: Number(r.row_total),
    })),
  };
}

// ── saveCosting ────────────────────────────────────────────────────

export async function saveCosting(
  input: SaveCostingInput,
): Promise<{ costingId: string }> {
  await requireAuth();
  const supabase = createClient();

  if (input.yieldQuantity <= 0) throw new Error("Yield must be greater than 0");
  if (input.profitMargin < 0) throw new Error("Profit margin cannot be negative");
  if (input.srp <= 0) throw new Error("SRP must be greater than 0");
  if (!input.materialRows.length) throw new Error("At least one material row is required");

  const upsertData: Record<string, unknown> = {
    product_id: input.productId,
    variant_id: input.variantId || null,
    overhead_cost: input.overheadCost,
    labor_cost: input.laborCost,
    other_cost: input.otherCost,
    yield_quantity: input.yieldQuantity,
    total_material_cost: input.totalMaterialCost,
    total_production_cost: input.totalProductionCost,
    cost_per_item: input.costPerItem,
    profit_margin: input.profitMargin,
    srp: input.srp,
    srp_override: input.srpOverride,
    updated_at: new Date().toISOString(),
  };

  // Determine conflict target based on variant vs product-level costing
  const onConflict = input.variantId
    ? "variant_id"
    : "product_id";

  // For variant costing, we need to handle the partial unique index differently
  // Try to find existing first
  let costingId: string;
  let query = supabase
    .from("product_costings")
    .select("id")
    .eq("product_id", input.productId);

  if (input.variantId) {
    query = query.eq("variant_id", input.variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    const { error: updateErr } = await supabase
      .from("product_costings")
      .update(upsertData)
      .eq("id", existing.id);
    if (updateErr) throw new Error(updateErr.message);
    costingId = existing.id;
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from("product_costings")
      .insert(upsertData)
      .select("id")
      .single();
    if (insertErr) throw new Error(insertErr.message);
    costingId = inserted.id;
  }

  // Delete existing material rows and re-insert
  await supabase.from("costing_material_rows").delete().eq("costing_id", costingId);

  const rowInserts = input.materialRows.map((r) => ({
    costing_id: costingId,
    ingredient_id: r.ingredientId,
    material_name: r.materialName,
    unit: r.unit,
    cost_per_unit: r.costPerUnit,
    quantity_used: r.quantityUsed,
    row_total: r.rowTotal,
  }));

  const { error: insertErr } = await supabase
    .from("costing_material_rows")
    .insert(rowInserts);
  if (insertErr) throw new Error(insertErr.message);

  // Update price: variant price or product price
  if (input.variantId) {
    await supabase
      .from("product_variants")
      .update({ price: input.srp })
      .eq("id", input.variantId);
  } else {
    await supabase
      .from("products")
      .update({ price: input.srp })
      .eq("id", input.productId);
  }

  revalidatePath("/costing");
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/reports");

  return { costingId };
}

// ── deleteCosting ──────────────────────────────────────────────────

export async function deleteCosting(
  productId: string,
  variantId?: string | null,
): Promise<void> {
  await requireAuth();
  const supabase = createClient();

  let query = supabase
    .from("product_costings")
    .delete()
    .eq("product_id", productId);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);

  revalidatePath("/costing");
}
