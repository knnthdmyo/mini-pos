const fs = require("fs");

const raw = fs.readFileSync(".env.local", "utf8").trim().split("\n");
const env = {};
for (const line of raw) {
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  env[line.slice(0, idx)] = line.slice(idx + 1);
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const PRODUCT_IDS = [
  "11111111-0000-0000-0000-000000000001",
  "11111111-0000-0000-0000-000000000002",
  "11111111-0000-0000-0000-000000000003",
  "11111111-0000-0000-0000-000000000004",
  "11111111-0000-0000-0000-000000000005",
];

const INGREDIENT_IDS = [
  "22222222-0000-0000-0000-000000000001",
  "22222222-0000-0000-0000-000000000002",
  "22222222-0000-0000-0000-000000000003",
  "22222222-0000-0000-0000-000000000004",
  "22222222-0000-0000-0000-000000000005",
];

(async () => {
  console.log("Deleting existing seed data...");

  // Delete in dependency order: recipes → order_items → orders → products / ingredients
  let res;

  res = await supabase.from("recipes").delete().in("product_id", PRODUCT_IDS);
  console.log("  recipes:", res.error ? res.error.message : "ok");

  res = await supabase
    .from("order_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  console.log("  order_items:", res.error ? res.error.message : "ok");

  res = await supabase
    .from("orders")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  console.log("  orders:", res.error ? res.error.message : "ok");

  res = await supabase
    .from("batch_preparations")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  console.log("  batch_preparations:", res.error ? res.error.message : "ok");

  res = await supabase
    .from("inventory_logs")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  console.log("  inventory_logs:", res.error ? res.error.message : "ok");

  res = await supabase.from("products").delete().in("id", PRODUCT_IDS);
  console.log("  products:", res.error ? res.error.message : "ok");

  res = await supabase.from("ingredients").delete().in("id", INGREDIENT_IDS);
  console.log("  ingredients:", res.error ? res.error.message : "ok");

  console.log("\nInserting seed data...");

  // Products
  res = await supabase.from("products").insert([
    {
      id: "11111111-0000-0000-0000-000000000001",
      name: "Classic Milkshake",
      price: 120.0,
      is_active: true,
    },
    {
      id: "11111111-0000-0000-0000-000000000002",
      name: "Chocolate Shake",
      price: 130.0,
      is_active: true,
    },
    {
      id: "11111111-0000-0000-0000-000000000003",
      name: "Strawberry Shake",
      price: 130.0,
      is_active: true,
    },
    {
      id: "11111111-0000-0000-0000-000000000004",
      name: "Candy Bag S",
      price: 50.0,
      is_active: true,
    },
    {
      id: "11111111-0000-0000-0000-000000000005",
      name: "Candy Bag L",
      price: 90.0,
      is_active: true,
    },
  ]);
  console.log("  products:", res.error ? res.error.message : "ok");

  // Ingredients
  res = await supabase.from("ingredients").insert([
    {
      id: "22222222-0000-0000-0000-000000000001",
      name: "Milk",
      unit: "ml",
      stock_qty: 10000,
      cost_per_unit: 0.08,
      low_stock_threshold: 2000,
    },
    {
      id: "22222222-0000-0000-0000-000000000002",
      name: "Vanilla Powder",
      unit: "g",
      stock_qty: 2000,
      cost_per_unit: 0.5,
      low_stock_threshold: 500,
    },
    {
      id: "22222222-0000-0000-0000-000000000003",
      name: "Chocolate Powder",
      unit: "g",
      stock_qty: 2000,
      cost_per_unit: 0.6,
      low_stock_threshold: 500,
    },
    {
      id: "22222222-0000-0000-0000-000000000004",
      name: "Strawberry Syrup",
      unit: "ml",
      stock_qty: 3000,
      cost_per_unit: 0.35,
      low_stock_threshold: 500,
    },
    {
      id: "22222222-0000-0000-0000-000000000005",
      name: "Assorted Candy",
      unit: "g",
      stock_qty: 5000,
      cost_per_unit: 0.2,
      low_stock_threshold: 1000,
    },
  ]);
  console.log("  ingredients:", res.error ? res.error.message : "ok");

  // Recipes
  res = await supabase.from("recipes").insert([
    {
      product_id: "11111111-0000-0000-0000-000000000001",
      ingredient_id: "22222222-0000-0000-0000-000000000001",
      quantity_per_unit: 250,
      quantity_required: 250,
    },
    {
      product_id: "11111111-0000-0000-0000-000000000001",
      ingredient_id: "22222222-0000-0000-0000-000000000002",
      quantity_per_unit: 30,
      quantity_required: 30,
    },
    {
      product_id: "11111111-0000-0000-0000-000000000002",
      ingredient_id: "22222222-0000-0000-0000-000000000001",
      quantity_per_unit: 250,
      quantity_required: 250,
    },
    {
      product_id: "11111111-0000-0000-0000-000000000002",
      ingredient_id: "22222222-0000-0000-0000-000000000003",
      quantity_per_unit: 40,
      quantity_required: 40,
    },
    {
      product_id: "11111111-0000-0000-0000-000000000003",
      ingredient_id: "22222222-0000-0000-0000-000000000001",
      quantity_per_unit: 250,
      quantity_required: 250,
    },
    {
      product_id: "11111111-0000-0000-0000-000000000003",
      ingredient_id: "22222222-0000-0000-0000-000000000004",
      quantity_per_unit: 50,
      quantity_required: 50,
    },
    {
      product_id: "11111111-0000-0000-0000-000000000004",
      ingredient_id: "22222222-0000-0000-0000-000000000005",
      quantity_per_unit: 100,
      quantity_required: 100,
    },
    {
      product_id: "11111111-0000-0000-0000-000000000005",
      ingredient_id: "22222222-0000-0000-0000-000000000005",
      quantity_per_unit: 200,
      quantity_required: 200,
    },
  ]);
  console.log("  recipes:", res.error ? res.error.message : "ok");

  console.log("\nDone!");
})();
