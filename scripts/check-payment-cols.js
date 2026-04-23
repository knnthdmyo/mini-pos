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
  { auth: { autoRefreshToken: false, persistSession: false } },
);

(async () => {
  const { data, error } = await sb
    .from("orders")
    .select("amount_received, change_amount, change_given")
    .limit(1);

  if (error) {
    console.log("Columns do NOT exist yet. Run migration 019.");
    console.log("Error:", error.message);
  } else {
    console.log("Columns already exist:", data);
  }
})();
