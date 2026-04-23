const fs = require("fs");
const raw = fs.readFileSync(".env.local", "utf8").trim().split("\n");
const env = {};
for (const line of raw) {
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  env[line.slice(0, idx)] = line.slice(idx + 1);
}
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const tables = [
  "orders",
  "order_items",
  "products",
  "ingredients",
  "recipes",
  "inventory_logs",
];

async function run() {
  for (const table of tables) {
    const { data, error } = await sb
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", table)
      .order("ordinal_position");
    if (error) {
      console.log(table + " ERROR:", error.message);
    } else {
      const cols = (data || []).map((r) => r.column_name);
      console.log(table + ":", cols.join(", "));
    }
  }
}

run();
