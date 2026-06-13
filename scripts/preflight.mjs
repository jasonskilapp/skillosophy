/**
 * Preflight: verify Supabase connectivity and that the schema has been applied,
 * before seeding the admin (so we never create an orphaned auth user).
 *
 * Usage: node --env-file=.env.local scripts/preflight.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.log("RESULT: missing-env");
  process.exit(0);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const tables = ["profiles", "invites", "candidates"];
const missing = [];
for (const t of tables) {
  const { error } = await supabase.from(t).select("*", { count: "exact", head: true });
  if (error) {
    if (error.code === "42P01" || /does not exist/i.test(error.message)) {
      missing.push(t);
    } else {
      console.log(`RESULT: error-${t}: ${error.message}`);
      process.exit(0);
    }
  }
}

// Check the storage bucket too.
const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
const hasBucket = !bErr && buckets?.some((b) => b.id === "resumes");

if (missing.length) {
  console.log(`RESULT: schema-missing: ${missing.join(", ")}`);
} else {
  console.log(`RESULT: ready; resumes-bucket=${hasBucket ? "yes" : "no"}`);
}
