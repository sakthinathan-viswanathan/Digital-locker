import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  MoreVertical,
  Download,
  Trash2,
  FolderInput,
  Eye,
  Pencil,
  Share2,
} from "lucide-react";
import { formatBytes, formatDate, buildFolderOptions } from "../utils/format";

function iconFor(mimeType) {
  if (mimeType.startsWith("image/")) return { Icon: ImageIcon, color: "text-emerald-600 bg-emerald-50" };
  if (mimeType === "application/pdf") return { Icon: FileText, color: "text-red-600 bg-red-50" };
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv") || mimeType.includes("excel"))
    return { Icon: FileSpreadsheet, color: "text-green-600 bg-green-50" };
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return { Icon: FileArchive, color: "text-amber-600 bg-amber-50" };
  if (mimeType.includes("word") || mimeType.includes("document"))
    return { Icon: FileText, color: "text-blue-600 bg-blue-50" };
  return { Icon: FileIcon, color: "text-slate-600 bg-slate-100" };
}

export default function FileCard({ file, folders, onView, onDownload, onDelete, onMove, onRename, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file.original_name);
  const [renameError, setRenameError] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const menuRef = useRef(null);
  const renameInputRef = useRef(null);
  const { Icon, color } = iconFor(file.mime_type);
  const folderOptions = buildFolderOptions(folders);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setMoveOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (renaming) renameInputRef.current?.select();
  }, [renaming]);

  function startRename() {
    setRenameValue(file.original_name);
    setRenameError("");
    setRenaming(true);
    setMenuOpen(false);
  }

  async function submitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === file.original_name) {
      setRenaming(false);
      return;
    }
    setSavingRename(true);
    setRenameError("");
    try {
      await onRename(file, trimmed);
      setRenaming(false);
    } catch (err) {
      setRenameError(err.response?.data?.message || "Could not rename file");
    } finally {
      setSavingRename(false);
    }
  }

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-panel transition-shadow relative group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-muted hover:text-ink p-1 rounded-md hover:bg-slate-100"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 bg-white border border-slate-100 rounded-lg shadow-panel py-1 z-10 text-sm">
              <button
                onClick={() => {
                  onView(file);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-ink"
              >
                <Eye size={14} /> View
              </button>
              <button
                onClick={() => {
                  onDownload(file);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-ink"
              >
                <Download size={14} /> Download
              </button>
              <button
                onClick={() => {
                  onShare(file);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-ink"
              >
                <Share2 size={14} /> Share via link
              </button>
              <button
                onClick={startRename}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-ink"
              >
                <Pencil size={14} /> Rename
              </button>
              <button
                onClick={() => setMoveOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-ink"
              >
                <FolderInput size={14} /> Move to…
              </button>
              {moveOpen && (
                <div className="border-t border-slate-100 mt-1 pt-1 max-h-40 overflow-y-auto">
                  <button
                    onClick={() => {
                      onMove(file, null);
                      setMenuOpen(false);
                      setMoveOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-muted hover:bg-slate-50"
                  >
                    No folder
                  </button>
                  {folderOptions.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        onMove(file, f.id);
                        setMenuOpen(false);
                        setMoveOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-slate-50"
                    >
                      {"\u2007\u2007".repeat(f.depth)}
                      {f.depth > 0 ? "↳ " : ""}
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  onDelete(file);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {renaming ? (
        <div className="min-w-0">
          <input
            ref={renameInputRef}
            className="input py-1.5 text-sm"
            value={renameValue}
            disabled={savingRename}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onBlur={submitRename}
          />
          {renameError && <p className="text-xs text-red-600 mt-1">{renameError}</p>}
          <p className="text-xs text-muted font-mono mt-1">
            {formatBytes(file.size_bytes)} · {formatDate(file.created_at)}
          </p>
        </div>
      ) : (
        <button onClick={() => onView(file)} className="min-w-0 text-left">
          <p className="text-sm font-medium text-ink truncate group-hover:text-brass-dark" title={file.original_name}>
            {file.original_name}
          </p>
          <p className="text-xs text-muted font-mono mt-0.5">
            {formatBytes(file.size_bytes)} · {formatDate(file.created_at)}
          </p>
        </button>
      )}
    </div>
  );
}