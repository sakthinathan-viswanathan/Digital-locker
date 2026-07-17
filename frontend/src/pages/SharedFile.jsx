import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Loader2, AlertCircle, ShieldOff, FileText, Image as ImageIcon, FileSpreadsheet, FileArchive, File as FileIcon } from "lucide-react";
import api from "../api/axios";
import { formatBytes } from "../utils/format";

function iconFor(mimeType = "") {
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

export default function SharedFile() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error
  const [file, setFile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const { data } = await api.get(`/public/share/${token}`);
        if (cancelled) return;
        setFile(data.file);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus(err.response?.status === 404 ? "notfound" : "error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError("");
    try {
      const res = await api.get(`/public/share/${token}/download`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: file?.mime_type || res.data.type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file?.original_name || "download");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err.response?.data?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-2 text-muted py-10">
            <Loader2 size={24} className="animate-spin text-brass" />
            <p className="text-sm">Loading shared file…</p>
          </div>
        )}

        {status === "notfound" && (
          <div className="flex flex-col items-center gap-2 py-10">
            <ShieldOff size={28} className="text-muted" />
            <h2 className="font-display text-lg font-semibold text-ink">Link not available</h2>
            <p className="text-sm text-muted max-w-xs">
              This share link is invalid or the owner has turned off sharing for this file.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2 py-10">
            <AlertCircle size={28} className="text-red-500" />
            <h2 className="font-display text-lg font-semibold text-ink">Something went wrong</h2>
            <p className="text-sm text-muted max-w-xs">Please try again in a moment.</p>
          </div>
        )}

        {status === "ready" && file && (
          <>
            {(() => {
              const { Icon, color } = iconFor(file.mime_type);
              return (
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto ${color}`}>
                  <Icon size={24} />
                </div>
              );
            })()}
            <h2 className="font-display text-lg font-semibold text-ink mt-4 break-words">{file.original_name}</h2>
            <p className="text-xs text-muted font-mono mt-1">{formatBytes(file.size_bytes)}</p>

            <button onClick={handleDownload} disabled={downloading} className="btn-brass w-full mt-6 justify-center">
              {downloading ? "Preparing…" : (
                <>
                  <Download size={16} /> Download file
                </>
              )}
            </button>

            {downloadError && <p className="text-xs text-red-600 mt-2">{downloadError}</p>}

            <p className="text-xs text-muted mt-5">Shared via Digital Locker</p>
          </>
        )}
      </div>
    </div>
  );
}