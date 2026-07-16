const admin = require("firebase-admin");
require("dotenv").config();

// Only Firestore lives here now — users, folders, and file *metadata*.
// Actual file bytes live in Supabase Storage (see config/supabase.js).
const REQUIRED_VARS = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];

const missing = REQUIRED_VARS.filter((key) => !process.env[key] || !process.env[key].trim());
if (missing.length > 0) {
  console.error(" Missing required Firebase env vars:", missing.join(", "));
  console.error("   Check backend/.env against backend/.env.example.");
}

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Service account keys store the private key with literal "\n" sequences
        // when pasted into a single-line env var — convert them back to real newlines.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  }
} catch (err) {
  console.error("firebase-admin failed to initialize:", err.message);
  console.error(
    "   This usually means FIREBASE_PRIVATE_KEY is malformed (the \\n sequences " +
      "must stay as literal backslash-n characters, not real line breaks)."
  );
}

const db = admin.firestore();

async function testConnection() {
  if (missing.length > 0) {
    console.error("Firebase not configured — skipping connection test.");
    return;
  }
  try {
    await db.listCollections();
    console.log("Firestore reachable");
  } catch (err) {
    console.error("Firestore connection failed:", err.message);
    console.error(
      "   Common causes: Firestore database not created yet in the Firebase console, " +
        "wrong FIREBASE_PROJECT_ID, or a malformed FIREBASE_PRIVATE_KEY."
    );
  }
}

module.exports = { admin, db, testConnection };
