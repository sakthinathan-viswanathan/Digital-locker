const crypto = require("crypto");
const { db, admin } = require("../config/firebase");
const { supabase, BUCKET } = require("../config/supabase");

const filesCol = db.collection("files");
const foldersCol = db.collection("folders");

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 15);

// Frontend sends { name, mimeType, folderId, base64 } where base64 is either
// a raw base64 string or a full data URL ("data:<mime>;base64,<data>").
function decodeBase64Payload(base64) {
  const commaIndex = base64.indexOf(",");
  const raw = base64.startsWith("data:") && commaIndex !== -1 ? base64.slice(commaIndex + 1) : base64;
  return Buffer.from(raw, "base64");
}

function toFileResponse(id, data) {
  return {
    id,
    folder_id: data.folderId || null,
    original_name: data.originalName,
    mime_type: data.mimeType,
    size_bytes: data.sizeBytes,
    created_at: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
  };
}

async function uploadFile(req, res) {
  try {
    const { name, mimeType, folderId, base64 } = req.body;

    if (!name || !mimeType || !base64) {
      return res.status(400).json({ message: "name, mimeType and base64 file data are required" });
    }

    const buffer = decodeBase64Payload(base64);
    const sizeMb = buffer.length / (1024 * 1024);
    if (sizeMb > MAX_UPLOAD_MB) {
      return res.status(413).json({ message: `File exceeds the ${MAX_UPLOAD_MB}MB limit` });
    }

    if (folderId) {
      const folderSnap = await foldersCol.doc(folderId).get();
      if (!folderSnap.exists || folderSnap.data().userId !== req.user.id) {
        return res.status(400).json({ message: "Selected folder does not exist" });
      }
    }

    // Bytes live in Supabase Storage; Firestore only holds the metadata +
    // a pointer (storagePath) to the object.
    const storagePath = `users/${req.user.id}/${crypto.randomUUID()}-${name}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const docData = {
      userId: req.user.id,
      folderId: folderId || null,
      originalName: name,
      mimeType,
      sizeBytes: buffer.length,
      storagePath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await filesCol.add(docData);

    res.status(201).json({
      file: {
        id: docRef.id,
        original_name: name,
        mime_type: mimeType,
        size_bytes: buffer.length,
        folder_id: folderId || null,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("uploadFile error:", err);
    res.status(500).json({ message: "Upload failed. Please try again.", detail: err.message });
  }
}

async function listFiles(req, res) {
  try {
    const { folderId, search } = req.query;

    // Single-equality read (no orderBy in the query itself, so this never
    // needs a manually created Firestore composite index); filtering by
    // folder and search, plus sorting, happens in memory afterwards.
    const snap = await filesCol.where("userId", "==", req.user.id).get();

    let files = snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));

    if (folderId) {
      files = files.filter((f) => f.data.folderId === folderId);
    }
    if (search && search.trim()) {
      const needle = search.trim().toLowerCase();
      files = files.filter((f) => f.data.originalName.toLowerCase().includes(needle));
    }

    files.sort((a, b) => {
      const aTime = a.data.createdAt ? a.data.createdAt.toMillis() : 0;
      const bTime = b.data.createdAt ? b.data.createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    res.json({ files: files.map((f) => toFileResponse(f.id, f.data)) });
  } catch (err) {
    console.error("listFiles error:", err);
    res.status(500).json({ message: "Could not load files", detail: err.message });
  }
}

async function downloadFile(req, res) {
  try {
    const { id } = req.params;
    const snap = await filesCol.doc(id).get();
    if (!snap.exists || snap.data().userId !== req.user.id) {
      return res.status(404).json({ message: "File not found" });
    }

    const data = snap.data();
    const { data: fileBlob, error } = await supabase.storage.from(BUCKET).download(data.storagePath);
    if (error) throw error;

    const arrayBuffer = await fileBlob.arrayBuffer();
    res.setHeader("Content-Type", data.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(data.originalName)}"`);
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("downloadFile error:", err);
    res.status(500).json({ message: "Download failed", detail: err.message });
  }
}

async function deleteFile(req, res) {
  try {
    const { id } = req.params;
    const ref = filesCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== req.user.id) {
      return res.status(404).json({ message: "File not found" });
    }

    const { storagePath } = snap.data();
    const [{ error: storageError }] = await Promise.all([
      supabase.storage.from(BUCKET).remove([storagePath]),
      ref.delete(),
    ]);
    if (storageError) console.error("deleteFile storage warning:", storageError.message);

    res.json({ message: "File deleted" });
  } catch (err) {
    console.error("deleteFile error:", err);
    res.status(500).json({ message: "Could not delete file", detail: err.message });
  }
}

async function moveFile(req, res) {
  try {
    const { id } = req.params;
    const { folderId } = req.body;

    if (folderId) {
      const folderSnap = await foldersCol.doc(folderId).get();
      if (!folderSnap.exists || folderSnap.data().userId !== req.user.id) {
        return res.status(400).json({ message: "Selected folder does not exist" });
      }
    }

    const ref = filesCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== req.user.id) {
      return res.status(404).json({ message: "File not found" });
    }

    await ref.update({ folderId: folderId || null });
    res.json({ message: "File moved" });
  } catch (err) {
    console.error("moveFile error:", err);
    res.status(500).json({ message: "Could not move file", detail: err.message });
  }
}

module.exports = { uploadFile, listFiles, downloadFile, deleteFile, moveFile };
