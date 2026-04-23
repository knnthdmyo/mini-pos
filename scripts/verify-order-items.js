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

async function run() {
  // Insert a test order
  const { data: order, error: oErr } = await sb
    .from("orders")
    .insert({ status: "placed", total_price: 130 })
    .select("id")
    .single();
  if (oErr) return console.error("order insert FAIL:", oErr.message);

  // Insert a test order_item using unit_price only (price has default now)
  const { error: iErr } = await sb.from("order_items").insert({
    order_id: order.id,
    product_id: "11111111-0000-0000-0000-000000000002",
    quantity: 1,
    unit_price: 130,
  });

  if (iErr) {
    console.error("order_items insert FAIL:", iErr.message);
  } else {
    console.log("OK — order + order_item inserted successfully");
  }

  // Clean up
  await sb.from("orders").delete().eq("id", order.id);
  console.log("Cleaned up test order.");
}
run();
