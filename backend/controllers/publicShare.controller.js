const { db } = require("../config/firebase");
const { supabase, BUCKET } = require("../config/supabase");

const filesCol = db.collection("files");

// Both filters here are plain equality, so this never needs a manually
// created Firestore composite index (same reasoning as listFiles in
// file.controller.js).
async function findSharedFile(token) {
  const snap = await filesCol
    .where("shareToken", "==", token)
    .where("shareEnabled", "==", true)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, data: doc.data() };
}

async function getSharedFileInfo(req, res) {
  try {
    const { token } = req.params;
    const found = await findSharedFile(token);
    if (!found) {
      return res.status(404).json({ message: "This link is invalid or is no longer active" });
    }

    const { data } = found;
    res.json({
      file: {
        original_name: data.originalName,
        mime_type: data.mimeType,
        size_bytes: data.sizeBytes,
      },
    });
  } catch (err) {
    console.error("getSharedFileInfo error:", err);
    res.status(500).json({ message: "Could not load shared file", detail: err.message });
  }
}

async function downloadSharedFile(req, res) {
  try {
    const { token } = req.params;
    const found = await findSharedFile(token);
    if (!found) {
      return res.status(404).json({ message: "This link is invalid or is no longer active" });
    }

    const { data } = found;
    const { data: fileBlob, error } = await supabase.storage.from(BUCKET).download(data.storagePath);
    if (error) throw error;

    const arrayBuffer = await fileBlob.arrayBuffer();
    res.setHeader("Content-Type", data.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(data.originalName)}"`);
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("downloadSharedFile error:", err);
    res.status(500).json({ message: "Download failed", detail: err.message });
  }
}

module.exports = { getSharedFileInfo, downloadSharedFile };