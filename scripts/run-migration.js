const fs = require("fs");

const raw = fs.readFileSync(".env.local", "utf8").trim().split("\n");
const env = {};
for (const line of raw) {
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  env[line.slice(0, idx)] = line.slice(idx + 1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/run-migration.js <path-to-sql>");
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, "utf8");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

// Run SQL via Supabase's pg_query endpoint (PostgREST does not support raw SQL,
// but the SQL Editor API endpoint at /pg/query does on hosted Supabase)
const projectRef = new URL(url).hostname.split(".")[0];

(async () => {
  // Try the Supabase Management API SQL endpoint
  const res = await fetch(`https://${projectRef}.supabase.co/pg/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    const result = await res.json();
    console.log("Migration applied successfully:", result);
  } else {
    const text = await res.text();
    console.log("pg/query failed (status", res.status + "). Response:", text);
    console.log(
      "\nFalling back: Please run this SQL in the Supabase SQL Editor:",
    );
    console.log("---");
    console.log(sql);
    console.log("---");
  }
})();
