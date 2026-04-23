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
  // Try inserting and immediately deleting a test order to verify total_price exists
  const { data, error } = await sb
    .from("orders")
    .insert({ status: "placed", total_price: 0 })
    .select("id, total_price")
    .single();

  if (error) {
    console.error("FAIL:", error.message);
  } else {
    console.log("OK — total_price column exists. Cleaning up...");
    await sb.from("orders").delete().eq("id", data.id);
    console.log("Test row deleted.");
  }
}
run();
