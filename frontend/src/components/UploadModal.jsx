import React, { useState, useRef } from "react";
import { X, UploadCloud, File as FileIcon } from "lucide-react";
import { fileToBase64, formatBytes } from "../utils/format";

const MAX_MB = 15;

export default function UploadModal({ folders, activeFolderId, onClose, onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [folderId, setFolderId] = useState(activeFolderId || "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File exceeds the ${MAX_MB}MB limit`);
      return;
    }
    setError("");
    setSelectedFile(file);
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    try {
      const base64 = await fileToBase64(selectedFile);
      await onUpload({
        name: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
        folderId: folderId || null,
        base64,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-ink">
          <X size={18} />
        </button>

        <h3 className="font-display text-lg font-semibold text-ink">Upload a file</h3>
        <p className="text-sm text-muted mt-1">Max {MAX_MB}MB per file.</p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`mt-4 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
            dragging ? "border-brass bg-brass/5" : "border-slate-200 hover:border-brass/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2 text-sm text-ink">
              <FileIcon size={16} className="text-brass" />
              <span className="truncate max-w-[220px]">{selectedFile.name}</span>
              <span className="text-muted font-mono text-xs">({formatBytes(selectedFile.size)})</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <UploadCloud size={22} />
              <p className="text-sm">Drag a file here, or click to browse</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3.5 py-2.5">
            {error}
          </div>
        )}

        <div className="mt-4">
          <label className="label">Save to folder</label>
          <select
            className="input"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            className="btn-brass flex-1"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
