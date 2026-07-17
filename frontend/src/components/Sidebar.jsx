import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LockKeyhole,
  Folder,
  FolderOpen,
  FolderPlus,
  Inbox,
  LogOut,
  X,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function buildTree(folders) {
  const byParent = {};
  folders.forEach((f) => {
    const key = f.parent_id || "root";
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(f);
  });
  return byParent;
}

function FolderNode({
  folder,
  depth,
  byParent,
  activeFolderId,
  expanded,
  onToggle,
  onSelectFolder,
  onNewSubfolder,
  renamingId,
  onStartRename,
  onSubmitRename,
  onCancelRename,
}) {
  const children = byParent[folder.id] || [];
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(folder.id);
  const isActive = activeFolderId === folder.id;
  const isRenaming = renamingId === folder.id;
  const [value, setValue] = useState(folder.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming) {
      setValue(folder.name);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [isRenaming, folder.name]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === folder.name) {
      onCancelRename();
      return;
    }
    onSubmitRename(folder.id, trimmed);
  }

  return (
    <div>
      <div
        className={`group w-full flex items-center gap-1 rounded-lg pr-2 text-sm transition-colors ${
          isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
        }`}
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        <button
          onClick={() => hasChildren && onToggle(folder.id)}
          className={`shrink-0 p-0.5 ${hasChildren ? "text-white/40 hover:text-white" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronRight size={13} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
        </button>

        {isRenaming ? (
          <div className="flex-1 flex items-center gap-2 py-1.5 min-w-0">
            {isOpen ? <FolderOpen size={16} style={{ color: folder.color }} /> : <Folder size={16} style={{ color: folder.color }} />}
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") onCancelRename();
              }}
              onBlur={submit}
              className="flex-1 min-w-0 bg-white/10 text-white text-sm rounded px-1.5 py-1 outline-none ring-1 ring-brass/60"
            />
          </div>
        ) : (
          <>
            <button
              onClick={() => onSelectFolder(folder.id)}
              className="flex-1 flex items-center justify-between gap-2 py-2 min-w-0"
            >
              <span className="flex items-center gap-2.5 truncate">
                {isOpen ? <FolderOpen size={16} style={{ color: folder.color }} /> : <Folder size={16} style={{ color: folder.color }} />}
                <span className="truncate">{folder.name}</span>
              </span>
              <span className="text-xs font-mono text-white/40 shrink-0">{folder.file_count}</span>
            </button>

            <button
              onClick={() => onStartRename(folder.id)}
              title="Rename"
              className="shrink-0 text-white/0 group-hover:text-white/50 hover:text-brass transition-colors p-0.5"
            >
              <Pencil size={13} />
            </button>

            <button
              onClick={() => onNewSubfolder(folder.id)}
              title="New subfolder"
              className="shrink-0 text-white/0 group-hover:text-white/50 hover:text-brass transition-colors p-0.5"
            >
              <FolderPlus size={13} />
            </button>
          </>
        )}
      </div>

      {hasChildren && isOpen && (
        <div>
          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              byParent={byParent}
              activeFolderId={activeFolderId}
              expanded={expanded}
              onToggle={onToggle}
              onSelectFolder={onSelectFolder}
              onNewSubfolder={onNewSubfolder}
              renamingId={renamingId}
              onStartRename={onStartRename}
              onSubmitRename={onSubmitRename}
              onCancelRename={onCancelRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  folders,
  activeFolderId,
  onSelectFolder,
  onNewFolder,
  onRenameFolder,
  totalFiles,
  isOpen,
  onClose,
}) {
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(new Set());
  const [renamingId, setRenamingId] = useState(null);
  const [initials] = useState(() =>
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  );

  const byParent = useMemo(() => buildTree(folders), [folders]);
  const rootFolders = byParent.root || [];

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleNewSubfolder(parentId) {
    setExpanded((prev) => new Set(prev).add(parentId));
    onNewFolder(parentId);
  }

  async function handleSubmitRename(id, name) {
    try {
      await onRenameFolder(id, name);
    } finally {
      setRenamingId(null);
    }
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-ink/40 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-ink text-white flex flex-col transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <LockKeyhole className="text-brass" size={20} />
            <span className="font-display font-semibold tracking-tight">Vaultly</span>
          </div>
          <button className="lg:hidden text-white/60" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              activeFolderId === null ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Inbox size={16} />
              All files
            </span>
            <span className="text-xs font-mono text-white/40">{totalFiles}</span>
          </button>

          <div className="flex items-center justify-between px-3 pt-5 pb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-white/35">Folders</span>
            <button onClick={() => onNewFolder(null)} className="text-white/50 hover:text-brass transition-colors" title="New folder">
              <FolderPlus size={15} />
            </button>
          </div>

          {rootFolders.length === 0 && (
            <p className="px-3 text-xs text-white/30 leading-relaxed">
              No folders yet. Create one to start organizing.
            </p>
          )}

          {rootFolders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              depth={0}
              byParent={byParent}
              activeFolderId={activeFolderId}
              expanded={expanded}
              onToggle={toggle}
              onSelectFolder={onSelectFolder}
              onNewSubfolder={handleNewSubfolder}
              renamingId={renamingId}
              onStartRename={setRenamingId}
              onSubmitRename={handleSubmitRename}
              onCancelRename={() => setRenamingId(null)}
            />
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brass/20 text-brass flex items-center justify-center text-xs font-semibold shrink-0">
            {initials || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
          <button onClick={logout} title="Sign out" className="text-white/40 hover:text-brass transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
