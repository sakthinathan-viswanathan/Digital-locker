import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import FileCard from "../components/FileCard";
import UploadModal from "../components/UploadModal";
import NewFolderModal from "../components/NewFolderModal";
import VaultDial from "../components/VaultDial";
import { Inbox } from "lucide-react";

export default function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadFolders = useCallback(async () => {
    const { data } = await api.get("/folders");
    setFolders(data.folders);
  }, []);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFolderId) params.folderId = activeFolderId;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/files", { params });
      setFiles(data.files);
    } finally {
      setLoading(false);
    }
  }, [activeFolderId, search]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    const timeout = setTimeout(loadFiles, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [loadFiles, search]);

  async function handleUpload(payload) {
    await api.post("/files", payload);
    await Promise.all([loadFiles(), loadFolders()]);
  }

  async function handleCreateFolder(payload) {
    await api.post("/folders", payload);
    await loadFolders();
  }

  async function handleDownload(file) {
    const res = await api.get(`/files/${file.id}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", file.original_name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleDelete(file) {
    if (!window.confirm(`Delete "${file.original_name}"? This cannot be undone.`)) return;
    await api.delete(`/files/${file.id}`);
    await Promise.all([loadFiles(), loadFolders()]);
  }

  async function handleMove(file, folderId) {
    await api.patch(`/files/${file.id}/move`, { folderId });
    await Promise.all([loadFiles(), loadFolders()]);
  }

  const totalFiles = useMemo(() => folders.reduce((sum, f) => sum + f.file_count, 0), [folders]);
  const folderName = useMemo(() => {
    if (search.trim()) return `Results for "${search.trim()}"`;
    if (!activeFolderId) return "All files";
    return folders.find((f) => f.id === activeFolderId)?.name || "Folder";
  }, [activeFolderId, folders, search]);

  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={(id) => {
          setActiveFolderId(id);
          setSidebarOpen(false);
        }}
        onNewFolder={() => setNewFolderOpen(true)}
        totalFiles={totalFiles}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          search={search}
          onSearchChange={setSearch}
          onUploadClick={() => setUploadOpen(true)}
          onMenuClick={() => setSidebarOpen(true)}
          folderName={folderName}
        />

        <main className="flex-1 px-4 sm:px-8 py-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card h-28 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
              <VaultDial size={140} />
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {search ? "No files match your search" : "This space is empty"}
                </h3>
                <p className="text-sm text-muted mt-1 max-w-xs">
                  {search
                    ? "Try a different name or check another folder."
                    : "Upload your first document to get it locked away safely."}
                </p>
              </div>
              {!search && (
                <button onClick={() => setUploadOpen(true)} className="btn-brass mt-2">
                  <Inbox size={16} /> Upload a file
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  folders={folders}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onMove={handleMove}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {uploadOpen && (
        <UploadModal
          folders={folders}
          activeFolderId={activeFolderId}
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
        />
      )}

      {newFolderOpen && (
        <NewFolderModal onClose={() => setNewFolderOpen(false)} onCreate={handleCreateFolder} />
      )}
    </div>
  );
}
