# Server Actions Contract: Onboarding & Costing

**Branch**: `002-onboarding-costing` | **Date**: 2026-04-23

All server actions follow existing patterns:

- Call `requireAuth()` first
- Use `createClient()` from `lib/supabase/server.ts`
- Call `revalidatePath()` for affected routes
- Return typed results or throw on error

---

## lib/actions/materials.ts

### `addMaterial(data)`

Adds a new ingredient (material) to the database.

**Input**:

```typescript
{
  name: string;           // Required, non-empty
  unit: string;           // Required: "g" | "kg" | "pc" | "ml" | "L"
  quantity: number;       // Required, > 0 (initial stock quantity)
  totalCost: number;      // Required, >= 0
  notes?: string;         // Optional
}
```

**Behavior**:

1. Compute `cost_per_unit = totalCost / quantity`
2. Insert into `ingredients` with `stock_qty = quantity`
3. Revalidate `/materials`, `/inventory`, `/costing`

**Output**: `{ id: string }` — the created ingredient ID

**Errors**: Throws if name already exists (unique constraint)

---

### `updateMaterial(id, data)`

Updates an existing ingredient's cost and stock info.

**Input**:

```typescript
{
  id: string;             // Required, existing ingredient UUID
  name: string;           // Required, non-empty
  unit: string;           // Required
  quantity: number;       // Required, > 0
  totalCost: number;      // Required, >= 0
  notes?: string;         // Optional
}
```

**Behavior**:

1. Compute `cost_per_unit = totalCost / quantity`
2. Update `ingredients` row: `name`, `unit`, `cost_per_unit`
3. Optionally update `stock_qty` if quantity changed
4. Revalidate `/materials`, `/inventory`, `/costing`

**Output**: `void`

**Errors**: Throws if ingredient not found

---

### `deleteMaterial(id)`

Deletes an ingredient after confirmation.

**Input**: `id: string` — ingredient UUID

**Behavior**:

1. Check if any `costing_material_rows` reference this ingredient
2. If referenced: return warning with list of affected product names
   (do not delete yet — client must call with `confirm: true`)
3. If not referenced or confirmed: delete from `ingredients`
4. Revalidate `/materials`, `/inventory`, `/costing`

**Output**: `{ deleted: boolean; warning?: string; affectedProducts?: string[] }`

---

### `getMaterials()`

Fetches all ingredients for the materials table.

**Input**: none

**Output**:

```typescript
Array<{
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_qty: number;
  created_at: string;
}>;
```

---

### `getMaterialsCount()`

Returns the count of ingredients (for onboarding detection).

**Input**: none

**Output**: `{ count: number }`

---

## lib/actions/costing.ts

### `saveCosting(data)`

Creates or updates the costing snapshot for a product.

**Input**:

```typescript
{
  productId: string; // Required, existing product UUID
  overheadCost: number; // >= 0
  laborCost: number; // >= 0
  otherCost: number; // >= 0
  yieldQuantity: number; // > 0
  totalMaterialCost: number; // >= 0 (computed client-side)
  totalProductionCost: number; // >= 0 (computed client-side)
  costPerItem: number; // >= 0 (computed client-side)
  profitMargin: number; // >= 0 (percentage)
  srp: number; // > 0
  srpOverride: boolean; // true if manually set
  materialRows: Array<{
    ingredientId: string; // ingredient UUID
    materialName: string; // denormalized name
    unit: string; // denormalized unit
    costPerUnit: number; // denormalized cost
    quantityUsed: number; // > 0
    rowTotal: number; // computed
  }>;
}
```

**Behavior**:

1. Validate all numeric constraints
2. Upsert `product_costings` (insert or update by `product_id`)
3. Delete existing `costing_material_rows` for this costing
4. Insert new `costing_material_rows`
5. Update `products.price` to `srp`
6. Revalidate `/costing`, `/pos`, `/reports`

**Output**: `{ costingId: string }`

**Errors**: Throws if product not found, validation fails, or
`yieldQuantity` is 0

---

### `getCosting(productId)`

Fetches the saved costing for a product, including material rows.

**Input**: `productId: string`

**Output**:

```typescript
{
  id: string;
  productId: string;
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
  materialRows: Array<{
    id: string;
    ingredientId: string | null;
    materialName: string;
    unit: string;
    costPerUnit: number;
    quantityUsed: number;
    rowTotal: number;
  }>;
} | null
```

Returns `null` if no costing exists for the product.

---

### `deleteCosting(productId)`

Deletes the costing for a product. Does NOT change `products.price`.

**Input**: `productId: string`

**Behavior**:

1. Delete `product_costings` row (cascades to material rows)
2. Revalidate `/costing`

**Output**: `void`

---

### `getProductsWithCostingStatus()`

Fetches all active products with a flag indicating if they have a
saved costing.

**Input**: none

**Output**:

```typescript
Array<{
  id: string;
  name: string;
  price: number;
  hasCosting: boolean;
  costPerItem: number | null;
  srp: number | null;
}>;
```
