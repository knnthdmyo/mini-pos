const fs = require("fs");
const raw = fs.readFileSync(".env.local", "utf8").trim().split("\n");
const env = {};
for (const line of raw) {
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  env[line.slice(0, idx)] = line.slice(idx + 1);
}
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Try all likely enum values for inventory_log_type
const candidates = ["order", "batch", "adjustment", "manual_adjustment", "manual", "purchase", "sale", "waste", "transfer"];
async function run() {
  for (const val of candidates) {
    const { error } = await sb.from("inventory_logs").insert({ change_qty: 0, type: val });
    if (!error || error.message.includes("violates not-null") || error.message.includes("foreign key") || error.message.includes("check")) {
      console.log("VALID enum value:", val, error ? "(other error: " + error.message + ")" : "");
    } else if (error.message.includes("invalid input value for enum")) {
      // not valid
    } else {
      console.log("Unexpected error for", val, ":", error.message);
    }
  }
}
run();
