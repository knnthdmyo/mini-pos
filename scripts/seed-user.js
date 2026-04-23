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
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "donkennethgdemayo@gmail.com",
    password: "password1",
    email_confirm: true,
  });
  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } else {
    console.log("User created:", data.user.id, data.user.email);
  }
})();
