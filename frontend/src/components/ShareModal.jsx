import React, { useEffect, useState } from "react";
import { X, Link2, Copy, Check, Loader2, Ban } from "lucide-react";
import api from "../api/axios";

export default function ShareModal({ file, onClose }) {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/files/${file.id}/share`);
        if (cancelled) return;
        setShareEnabled(data.shareEnabled);
        setShareUrl(data.shareUrl);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Could not load share status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  async function handleCreateLink() {
    setWorking(true);
    setError("");
    try {
      const { data } = await api.post(`/files/${file.id}/share`);
      setShareEnabled(data.shareEnabled);
      setShareUrl(data.shareUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create share link");
    } finally {
      setWorking(false);
    }
  }

  async function handleRevoke() {
    setWorking(true);
    setError("");
    try {
      await api.delete(`/files/${file.id}/share`);
      setShareEnabled(false);
      setCopied(false);
    } catch (err) {
      setError(err.response?.data?.message || "Could not turn off link sharing");
    } finally {
      setWorking(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the link — copy it manually instead");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-ink">
          <X size={18} />
        </button>

        <h3 className="font-display text-lg font-semibold text-ink">Share via link</h3>
        <p className="text-sm text-muted mt-1 truncate" title={file.original_name}>
          {file.original_name}
        </p>

        <div className="mt-5">
          {loading ? (
            <div className="flex items-center gap-2 text-muted text-sm py-4">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : shareEnabled && shareUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 w-fit">
                <Link2 size={13} /> Anyone with this link can view and download this file
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="input flex-1 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-ghost shrink-0 px-3"
                  title="Copy link"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="w-10 h-10 rounded-full bg-brass/10 flex items-center justify-center text-brass-dark">
                <Link2 size={18} />
              </div>
              <p className="text-sm text-muted max-w-[220px]">
                Create a link so anyone can view and download this file — no login required.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3.5 py-2.5">
            {error}
          </div>
        )}

        {!loading && (
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Close
            </button>
            {shareEnabled ? (
              <button type="button" onClick={handleRevoke} disabled={working} className="btn-ghost flex-1 text-red-600">
                {working ? "Turning off…" : (
                  <>
                    <Ban size={14} /> Turn off link
                  </>
                )}
              </button>
            ) : (
              <button type="button" onClick={handleCreateLink} disabled={working} className="btn-brass flex-1">
                {working ? "Creating…" : (
                  <>
                    <Link2 size={14} /> Create link
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}