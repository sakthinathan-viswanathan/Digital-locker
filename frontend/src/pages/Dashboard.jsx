import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import FileCard from "../components/FileCard";
import UploadModal from "../components/UploadModal";
import NewFolderModal from "../components/NewFolderModal";
import FilePreviewModal from "../components/FilePreviewModal";
import VaultDial from "../components/VaultDial";
import { Inbox } from "lucide-react";
import { buildBreadcrumb } from "../utils/format";

export default function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState(undefined); // undefined = closed
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

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

  // Raw single-file upload — no refresh side effects, since UploadModal may
  // call this many times in a row for a multi-file / folder upload.
  async function uploadOne(payload) {
    const { data } = await api.post("/files", payload);
    return data.file;
  }

  async function refreshAfterUpload() {
    await Promise.all([loadFiles(), loadFolders()]);
  }

  async function handleCreateFolder(payload) {
    const { data } = await api.post("/folders", payload);
    await loadFolders();
    return data.folder;
  }

  async function fetchFileBlob(file) {
    const res = await api.get(`/files/${file.id}/download`, { responseType: "blob" });
    // The raw response blob has no reliable type; re-wrap it with the known
    // mime type so <img>/<iframe>/<video> render it instead of downloading it.
    return new Blob([res.data], { type: file.mime_type || res.data.type });
  }

  async function handleDownload(file) {
    const blob = await fetchFileBlob(file);
    const url = window.URL.createObjectURL(blob);
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

  async function handleRenameFile(file, newName) {
    await api.patch(`/files/${file.id}/rename`, { name: newName });
    await loadFiles();
  }

  async function handleRenameFolder(folderId, newName) {
    await api.put(`/folders/${folderId}`, { name: newName });
    await loadFolders();
  }

  const totalFiles = useMemo(() => folders.reduce((sum, f) => sum + f.file_count, 0), [folders]);

  const breadcrumb = useMemo(() => buildBreadcrumb(folders, activeFolderId), [folders, activeFolderId]);

  const folderName = useMemo(() => {
    if (search.trim()) return `Results for "${search.trim()}"`;
    if (!activeFolderId) return "All files";
    return folders.find((f) => f.id === activeFolderId)?.name || "Folder";
  }, [activeFolderId, folders, search]);

  const newFolderModalOpen = newFolderParentId !== undefined;
  const newFolderParentName = newFolderParentId
    ? folders.find((f) => f.id === newFolderParentId)?.name || null
    : null;

  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={(id) => {
          setActiveFolderId(id);
          setSidebarOpen(false);
        }}
        onNewFolder={(parentId) => setNewFolderParentId(parentId || null)}
        onRenameFolder={handleRenameFolder}
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

        {!search && breadcrumb.length > 0 && (
          <div className="px-4 sm:px-8 pt-4 flex items-center gap-1.5 text-sm flex-wrap">
            <button onClick={() => setActiveFolderId(null)} className="text-muted hover:text-ink">
              All files
            </button>
            {breadcrumb.map((folder, i) => (
              <React.Fragment key={folder.id}>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className={
                    i === breadcrumb.length - 1
                      ? "text-ink font-medium"
                      : "text-muted hover:text-ink"
                  }
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

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
                  <Inbox size={16} /> Upload files
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
                  onView={setPreviewFile}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onMove={handleMove}
                  onRename={handleRenameFile}
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
          onUploadFile={uploadOne}
          onCreateFolder={handleCreateFolder}
          onDone={refreshAfterUpload}
        />
      )}

      {newFolderModalOpen && (
        <NewFolderModal
          parentId={newFolderParentId}
          parentName={newFolderParentName}
          onClose={() => setNewFolderParentId(undefined)}
          onCreate={handleCreateFolder}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
          onFetchBlob={fetchFileBlob}
        />
      )}
    </div>
  );
}
