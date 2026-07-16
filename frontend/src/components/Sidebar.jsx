import React, { useState } from "react";
import { LockKeyhole, Folder, FolderPlus, Inbox, LogOut, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  folders,
  activeFolderId,
  onSelectFolder,
  onNewFolder,
  totalFiles,
  isOpen,
  onClose,
}) {
  const { user, logout } = useAuth();
  const [initials] = useState(() =>
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  );

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
            <button onClick={onNewFolder} className="text-white/50 hover:text-brass transition-colors" title="New folder">
              <FolderPlus size={15} />
            </button>
          </div>

          {folders.length === 0 && (
            <p className="px-3 text-xs text-white/30 leading-relaxed">
              No folders yet. Create one to start organizing.
            </p>
          )}

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                activeFolderId === folder.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Folder size={16} style={{ color: folder.color }} />
                <span className="truncate">{folder.name}</span>
              </span>
              <span className="text-xs font-mono text-white/40 shrink-0">{folder.file_count}</span>
            </button>
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
