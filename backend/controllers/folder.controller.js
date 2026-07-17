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
    const { name, parent_id } = req.body;

    const ref = foldersCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== req.user.id) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Folder name is required" });
      }
      updates.name = name.trim();
    }

    if (parent_id !== undefined) {
      if (parent_id === id) {
        return res.status(400).json({ message: "A folder cannot be moved into itself" });
      }
      if (parent_id) {
        const parentSnap = await foldersCol.doc(parent_id).get();
        if (!parentSnap.exists || parentSnap.data().userId !== req.user.id) {
          return res.status(400).json({ message: "Target folder does not exist" });
        }
        // Basic cycle guard: walk up the target's ancestor chain and make
        // sure the folder being moved doesn't appear in it.
        let cursor = parentSnap.data();
        let guard = 0;
        while (cursor.parentId && guard < 50) {
          if (cursor.parentId === id) {
            return res.status(400).json({ message: "Cannot move a folder into its own subfolder" });
          }
          const nextSnap = await foldersCol.doc(cursor.parentId).get();
          if (!nextSnap.exists) break;
          cursor = nextSnap.data();
          guard += 1;
        }
      }
      updates.parentId = parent_id || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    await ref.update(updates);
    res.json({ message: "Folder updated" });
  } catch (err) {
    console.error("renameFolder error:", err);
    res.status(500).json({ message: "Could not update folder", detail: err.message });
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

    // Mirror ON DELETE SET NULL: any files inside this folder become unfiled,
    // and any subfolders move up to root, rather than disappearing along with it.
    const [fileSnap, subfolderSnap] = await Promise.all([
      filesCol.where("userId", "==", req.user.id).where("folderId", "==", id).get(),
      foldersCol.where("userId", "==", req.user.id).where("parentId", "==", id).get(),
    ]);

    const batch = db.batch();
    fileSnap.forEach((doc) => batch.update(doc.ref, { folderId: null }));
    subfolderSnap.forEach((doc) => batch.update(doc.ref, { parentId: null }));
    batch.delete(ref);
    await batch.commit();

    res.json({ message: "Folder deleted" });
  } catch (err) {
    console.error("deleteFolder error:", err);
    res.status(500).json({ message: "Could not delete folder", detail: err.message });
  }
}

module.exports = { listFolders, createFolder, renameFolder, deleteFolder };
