const fs = require("fs");
const raw = fs.readFileSync(".env.local", "utf8").trim().split("\n");
const env = {};
for (const line of raw) {
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  env[line.slice(0, idx)] = line.slice(idx + 1);
}

// The simplest way: POST to the Supabase Management REST API for schema reload
const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const personalAccessToken = env.SUPABASE_ACCESS_TOKEN;

if (!personalAccessToken) {
  console.log(
    "No SUPABASE_ACCESS_TOKEN set. Please reload the schema cache manually:\n" +
      "  Supabase Dashboard → API → Schema Cache → Reload",
  );
  process.exit(0);
}

fetch(`https://api.supabase.com/v1/projects/${projectRef}/services`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${personalAccessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ db_schema: "public" }),
})
  .then((r) => r.text())
  .then((t) => console.log("Response:", t))
  .catch((e) => console.error(e));
