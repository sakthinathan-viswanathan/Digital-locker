export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Flattens the folder list into a depth-ordered array suitable for an
// indented <select>, e.g. "Identity docs" then its child "Passports".
export function buildFolderOptions(folders) {
  const byParent = {};
  folders.forEach((f) => {
    const key = f.parent_id || "root";
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(f);
  });

  const out = [];
  function walk(parentKey, depth) {
    (byParent[parentKey] || []).forEach((folder) => {
      out.push({ ...folder, depth });
      walk(folder.id, depth + 1);
    });
  }
  walk("root", 0);
  return out;
}

// Returns the chain of ancestor folders from root down to the given folder,
// e.g. [Identity docs, Passports] when folderId points at "Passports".
export function buildBreadcrumb(folders, folderId) {
  const byId = Object.fromEntries(folders.map((f) => [f.id, f]));
  const chain = [];
  let cursor = folderId ? byId[folderId] : null;
  let guard = 0;
  while (cursor && guard < 50) {
    chain.unshift(cursor);
    cursor = cursor.parent_id ? byId[cursor.parent_id] : null;
    guard += 1;
  }
  return chain;
}
