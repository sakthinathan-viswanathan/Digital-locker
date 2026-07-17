import React, { useEffect, useState } from "react";
import { X, Download, AlertCircle, Loader2 } from "lucide-react";
import { formatBytes, formatDate } from "../utils/format";

function previewKind(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/csv"
  )
    return "text";
  return "unsupported";
}

const TEXT_PREVIEW_LIMIT = 200 * 1024; // don't try to render huge text files inline

export default function FilePreviewModal({ file, onClose, onDownload, onFetchBlob }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [objectUrl, setObjectUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const kind = previewKind(file.mime_type);

  useEffect(() => {
    let cancelled = false;
    let createdUrl = null;

    async function load() {
      if (kind === "unsupported") {
        setStatus("ready");
        return;
      }
      setStatus("loading");
      try {
        const blob = await onFetchBlob(file);
        if (cancelled) return;

        if (kind === "text") {
          if (blob.size > TEXT_PREVIEW_LIMIT) {
            setStatus("ready");
            setTextContent(null);
          } else {
            const text = await blob.text();
            if (cancelled) return;
            setTextContent(text);
            setStatus("ready");
          }
        } else {
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err.response?.data?.message || "Could not load a preview for this file.");
          setStatus("error");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate" title={file.original_name}>
              {file.original_name}
            </p>
            <p className="text-xs text-muted font-mono mt-0.5">
              {formatBytes(file.size_bytes)} · {formatDate(file.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onDownload(file)} className="text-muted hover:text-ink p-2 rounded-md hover:bg-slate-100" title="Download">
              <Download size={16} />
            </button>
            <button onClick={onClose} className="text-muted hover:text-ink p-2 rounded-md hover:bg-slate-100" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center min-h-[300px]">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-2 text-muted py-16">
              <Loader2 size={24} className="animate-spin text-brass" />
              <p className="text-sm">Loading preview…</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-2 text-center py-16 px-6">
              <AlertCircle size={24} className="text-red-500" />
              <p className="text-sm text-ink font-medium">Couldn't load this file</p>
              <p className="text-xs text-muted max-w-xs">{errorMessage}</p>
            </div>
          )}

          {status === "ready" && kind === "image" && (
            <img src={objectUrl} alt={file.original_name} className="max-w-full max-h-[70vh] object-contain" />
          )}

          {status === "ready" && kind === "pdf" && (
            <iframe title={file.original_name} src={objectUrl} className="w-full h-[75vh]" />
          )}

          {status === "ready" && kind === "video" && (
            <video src={objectUrl} controls className="max-w-full max-h-[70vh]" />
          )}

          {status === "ready" && kind === "audio" && (
            <div className="w-full px-8 py-16">
              <audio src={objectUrl} controls className="w-full" />
            </div>
          )}

          {status === "ready" && kind === "text" && textContent !== null && (
            <pre className="w-full h-full max-h-[70vh] overflow-auto text-xs text-ink bg-white p-5 whitespace-pre-wrap break-words text-left">
              {textContent}
            </pre>
          )}

          {status === "ready" && kind === "text" && textContent === null && (
            <div className="flex flex-col items-center gap-2 text-center py-16 px-6">
              <AlertCircle size={24} className="text-muted" />
              <p className="text-sm text-ink font-medium">This file is too large to preview</p>
              <button onClick={() => onDownload(file)} className="btn-brass mt-2">
                <Download size={14} /> Download instead
              </button>
            </div>
          )}

          {status === "ready" && kind === "unsupported" && (
            <div className="flex flex-col items-center gap-2 text-center py-16 px-6">
              <AlertCircle size={24} className="text-muted" />
              <p className="text-sm text-ink font-medium">No preview available for this file type</p>
              <p className="text-xs text-muted max-w-xs">{file.mime_type}</p>
              <button onClick={() => onDownload(file)} className="btn-brass mt-2">
                <Download size={14} /> Download instead
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
