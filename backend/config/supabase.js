const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// File bytes live in Supabase Storage. Firestore only ever stores a pointer
// (storagePath) to the object here — see controllers/file.controller.js.
const REQUIRED_VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_BUCKET"];

const missing = REQUIRED_VARS.filter((key) => !process.env[key] || !process.env[key].trim());
if (missing.length > 0) {
  console.error(" Missing required Supabase env vars:", missing.join(", "));
  console.error("   Check backend/.env against backend/.env.example.");
}

// The service role key bypasses Row Level Security — that's intentional
// here, since only this trusted backend talks to Supabase, never the
// browser. Never ship this key to the frontend.
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);

const BUCKET = process.env.SUPABASE_BUCKET || "";

async function testConnection() {
  if (missing.length > 0) {
    console.error(" Supabase not configured — skipping connection test.");
    return;
  }
  try {
    const { error } = await supabase.storage.from(BUCKET).list("", { limit: 1 });
    if (error) throw error;
    console.log(" Supabase Storage bucket reachable:", BUCKET);
  } catch (err) {
    console.error(" Supabase Storage check failed:", err.message);
    console.error(
      "   Common causes: SUPABASE_BUCKET name is wrong, the bucket doesn't exist yet, " +
        "SUPABASE_URL is wrong, or SUPABASE_SERVICE_ROLE_KEY is invalid/expired."
    );
  }
}

module.exports = { supabase, BUCKET, testConnection };
