const { db, admin } = require("../config/firebase");

const foldersCol = db.collection("folders");
const filesCol = db.collection("files");

async function listFolders(req, res) {
  try {
    const uid = req.user.id;

    // Two separate single-equality reads instead of a join — Firestore has
    // no server-side joins, so file counts per folder are computed in memory.
    const [folderSnap, fileSnap] = await Promise.all([
      foldersCol.where("userId", "==", uid).get(),
      filesCol.where("userId", "==", uid).get(),
    ]);

    const counts = {};
    fileSnap.forEach((doc) => {
      const folderId = doc.data().folderId;
      if (folderId) counts[folderId] = (counts[folderId] || 0) + 1;
    });

    const folders = folderSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          parent_id: data.parentId || null,
          color: data.color || "#6366F1",
          created_at: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          file_count: counts[doc.id] || 0,
        };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json({ folders });
  } catch (err) {
    console.error("listFolders error:", err);
    res.status(500).json({ message: "Could not load folders", detail: err.message });
  }
}

async function createFolder(req, res) {
  try {
    const { name, parent_id, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const docRef = await foldersCol.add({
      userId: req.user.id,
      name: name.trim(),
      parentId: parent_id || null,
      color: color || "#6366F1",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      folder: {
        id: docRef.id,
        name: name.trim(),
        parent_id: parent_id || null,
        color: color || "#6366F1",
        file_count: 0,
      },
    });
  } catch (err) {
    console.error("createFolder error:", err);
    res.status(500).json({ message: "Could not create folder", detail: err.message });
  }
}

async function renameFolder(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const ref = foldersCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== req.user.id) {
      return res.status(404).json({ message: "Folder not found" });
    }

    await ref.update({ name: name.trim() });
    res.json({ message: "Folder renamed" });
  } catch (err) {
    console.error("renameFolder error:", err);
    res.status(500).json({ message: "Could not rename folder", detail: err.message });
  }
}

async function deleteFolder(req, res) {
  try {
    const { id } = req.params;
    const ref = foldersCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== req.user.id) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Mirror ON DELETE SET NULL: any files inside this folder become unfiled
    // rather than being deleted along with it.
    const fileSnap = await filesCol
      .where("userId", "==", req.user.id)
      .where("folderId", "==", id)
      .get();

    const batch = db.batch();
    fileSnap.forEach((doc) => batch.update(doc.ref, { folderId: null }));
    batch.delete(ref);
    await batch.commit();

    res.json({ message: "Folder deleted" });
  } catch (err) {
    console.error("deleteFolder error:", err);
    res.status(500).json({ message: "Could not delete folder", detail: err.message });
  }
}

module.exports = { listFolders, createFolder, renameFolder, deleteFolder };
