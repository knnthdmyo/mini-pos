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

// Try inserting with known-bad column to trigger a column-list error
async function run() {
  // Insert with a fake column — Postgres will list which columns exist
  const { error } = await sb.from("inventory_logs").insert({
    __probe: 1,
  });
  if (error)
    console.log(
      "inventory_logs probe error:",
      error.message,
      error.details,
      error.hint,
    );

  // Try selecting with * to get column names back
  const { data, error: e2 } = await sb
    .from("inventory_logs")
    .select("*")
    .limit(1);
  if (e2) console.log("select error:", e2.message);
  else
    console.log(
      "inventory_logs columns:",
      data && data[0]
        ? Object.keys(data[0]).join(", ")
        : "(empty — inserting dummy to probe)",
    );

  // Insert a minimal valid row to find required columns
  const reasons = [];
  for (const col of [
    "change_qty",
    "quantity_changed",
    "qty_change",
    "delta",
    "amount",
  ]) {
    const { error: e3 } = await sb.from("inventory_logs").insert({ [col]: 1 });
    if (
      e3 &&
      !e3.message.includes("violates not-null") &&
      !e3.message.includes("foreign key")
    ) {
      reasons.push(`${col}: ${e3.message}`);
    } else if (
      !e3 ||
      e3.message.includes("violates not-null") ||
      e3.message.includes("foreign key")
    ) {
      console.log("FOUND column candidate:", col, e3 ? e3.message : "no error");
    }
  }
  if (reasons.length) console.log("non-candidates:", reasons.join(" | "));
}
run();
