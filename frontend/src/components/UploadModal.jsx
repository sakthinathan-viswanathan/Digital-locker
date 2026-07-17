import React, { useState, useRef, useMemo } from "react";
import {
  X,
  UploadCloud,
  File as FileIcon,
  FolderPlus,
  FolderUp,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { fileToBase64, formatBytes, buildFolderOptions } from "../utils/format";

const MAX_MB = 15;
const DEFAULT_COLOR = "#6366F1";
let uid = 0;
const nextId = () => `item-${++uid}`;

export default function UploadModal({ folders, activeFolderId, onClose, onUploadFile, onCreateFolder, onCreateFolderRefresh, onDone }) {
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState([]); // { id, file, folderPath: string[], status, error }
  const [targetFolderId, setTargetFolderId] = useState(activeFolderId || "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [finished, setFinished] = useState(false);

  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateName, setQuickCreateName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const folderOptions = useMemo(() => buildFolderOptions(folders), [folders]);

  function addFiles(fileList, isDirectory) {
    const arr = Array.from(fileList || []);
    if (arr.length === 0) return;

    const tooBig = [];
    const accepted = [];
    arr.forEach((file) => {
      if (file.size > MAX_MB * 1024 * 1024) {
        tooBig.push(file.name);
        return;
      }
      const folderPath =
        isDirectory && file.webkitRelativePath ? file.webkitRelativePath.split("/").slice(0, -1) : [];
      accepted.push({ id: nextId(), file, folderPath, status: "pending", error: null });
    });

    if (tooBig.length) {
      setError(`Skipped ${tooBig.length} file(s) over the ${MAX_MB}MB limit: ${tooBig.slice(0, 3).join(", ")}${tooBig.length > 3 ? "…" : ""}`);
    } else {
      setError("");
    }
    setItems((prev) => [...prev, ...accepted]);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleQuickCreateFolder(e) {
    e.preventDefault();
    if (!quickCreateName.trim()) return;
    setCreatingFolder(true);
    try {
      const folder = await onCreateFolder({
        name: quickCreateName.trim(),
        color: DEFAULT_COLOR,
        parent_id: targetFolderId || null,
      });
      setTargetFolderId(folder.id);
      setQuickCreateName("");
      setQuickCreateOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create folder");
    } finally {
      setCreatingFolder(false);
    }
  }

  // Resolves (creating as needed) the folder chain implied by a dropped
  // OS folder's subdirectories, e.g. ["Taxes", "2024"] under the chosen
  // destination folder — reusing folders that already exist by name.
  async function resolveFolderId(pathSegments, cache, liveFolders) {
    let parent = targetFolderId || null;
    let key = "root";
    for (const seg of pathSegments) {
      key = `${key}/${seg}`;
      if (cache.has(key)) {
        parent = cache.get(key);
        continue;
      }
      const existing = liveFolders.find((f) => (f.parent_id || null) === parent && f.name === seg);
      let folderId;
      if (existing) {
        folderId = existing.id;
      } else {
        const created = await onCreateFolder({ name: seg, color: DEFAULT_COLOR, parent_id: parent });
        folderId = created.id;
        liveFolders.push({ id: created.id, name: seg, parent_id: parent });
      }
      cache.set(key, folderId);
      parent = folderId;
    }
    return parent;
  }

  async function handleSubmit() {
    if (items.length === 0) return;
    setUploading(true);
    setError("");

    const cache = new Map();
    const liveFolders = folders.map((f) => ({ id: f.id, name: f.name, parent_id: f.parent_id }));

    for (const item of items) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i)));
      try {
        const folderId = item.folderPath.length
          ? await resolveFolderId(item.folderPath, cache, liveFolders)
          : targetFolderId || null;

        const base64 = await fileToBase64(item.file);
        await onUploadFile({
          name: item.file.name,
          mimeType: item.file.type || "application/octet-stream",
          folderId,
          base64,
        });
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)));
      } catch (err) {
        const message = err.response?.data?.message || "Upload failed";
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: message } : i)));
      }
    }

    setUploading(false);
    setFinished(true);
    await onDone();
  }

  const totalSize = items.reduce((sum, i) => sum + i.file.size, 0);
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const allSettled = finished && items.every((i) => i.status === "done" || i.status === "error");

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6 relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-ink">
          <X size={18} />
        </button>

        <h3 className="font-display text-lg font-semibold text-ink">Upload files</h3>
        <p className="text-sm text-muted mt-1">
          Add multiple files, or an entire folder — max {MAX_MB}MB per file.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files, false);
          }}
          className={`mt-4 rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors ${
            dragging ? "border-brass bg-brass/5" : "border-slate-200"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files, false);
              e.target.value = "";
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files, true);
              e.target.value = "";
            }}
          />

          <div className="flex flex-col items-center gap-2 text-muted">
            <UploadCloud size={22} />
            <p className="text-sm">Drag files here, or</p>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-ghost !px-3 !py-1.5 text-xs">
                <FileIcon size={13} /> Choose files
              </button>
              <button type="button" onClick={() => folderInputRef.current?.click()} className="btn-ghost !px-3 !py-1.5 text-xs">
                <FolderUp size={13} /> Choose a folder
              </button>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>
              {items.length} file{items.length > 1 ? "s" : ""} · {formatBytes(totalSize)}
            </span>
            {finished && (
              <span>
                {doneCount} uploaded{errorCount ? `, ${errorCount} failed` : ""}
              </span>
            )}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-2 border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-y-auto max-h-40">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <FileIcon size={14} className="text-muted shrink-0" />
                <span className="truncate flex-1 text-ink" title={item.file.name}>
                  {item.folderPath.length > 0 && (
                    <span className="text-muted">{item.folderPath.join("/")}/</span>
                  )}
                  {item.file.name}
                </span>
                <span className="text-xs text-muted font-mono shrink-0">{formatBytes(item.file.size)}</span>
                {item.status === "pending" && !uploading && !finished && (
                  <button onClick={() => removeItem(item.id)} className="text-muted hover:text-red-600 shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
                {item.status === "uploading" && <Loader2 size={14} className="animate-spin text-brass shrink-0" />}
                {item.status === "done" && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                {item.status === "error" && (
                  <span title={item.error}>
                    <AlertCircle size={14} className="text-red-600 shrink-0" />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3.5 py-2.5">
            {error}
          </div>
        )}

        {!finished && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Save to folder</label>
              <button
                type="button"
                onClick={() => setQuickCreateOpen((o) => !o)}
                className="text-xs text-brass-dark hover:text-ink font-medium flex items-center gap-1 mb-1.5"
              >
                <FolderPlus size={13} /> New folder
              </button>
            </div>
            <select className="input mt-1.5" value={targetFolderId} onChange={(e) => setTargetFolderId(e.target.value)}>
              <option value="">No folder (root)</option>
              {folderOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {"\u2007\u2007".repeat(f.depth)}
                  {f.depth > 0 ? "↳ " : ""}
                  {f.name}
                </option>
              ))}
            </select>

            {quickCreateOpen && (
              <form onSubmit={handleQuickCreateFolder} className="mt-2 flex gap-2">
                <input
                  autoFocus
                  className="input flex-1 text-sm"
                  placeholder="New folder name"
                  value={quickCreateName}
                  onChange={(e) => setQuickCreateName(e.target.value)}
                />
                <button type="submit" disabled={creatingFolder} className="btn-brass !px-3 text-xs">
                  {creatingFolder ? "…" : "Create"}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">
            {finished ? "Close" : "Cancel"}
          </button>
          {!finished && (
            <button onClick={handleSubmit} disabled={items.length === 0 || uploading} className="btn-brass flex-1">
              {uploading ? "Uploading…" : `Upload ${items.length || ""}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
