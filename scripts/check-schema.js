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
sb.rpc("version").then(() => {});

// Use postgres RPC to inspect columns
sb.from("orders")
  .select("*")
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log("orders error:", error.message);
    } else {
      console.log(
        "orders columns:",
        data && data[0] ? Object.keys(data[0]) : "(empty table — OK)",
      );
    }
  });
