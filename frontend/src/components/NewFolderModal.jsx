import React, { useState } from "react";
import { X, FolderTree } from "lucide-react";

const COLORS = ["#C6952C", "#2563EB", "#16A34A", "#DC2626", "#7C3AED", "#0891B2"];

export default function NewFolderModal({ onClose, onCreate, parentId = null, parentName = null }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreate({ name: name.trim(), color, parent_id: parentId || null });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create folder");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6 relative">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-ink">
          <X size={18} />
        </button>

        <h3 className="font-display text-lg font-semibold text-ink">New folder</h3>
        <p className="text-sm text-muted mt-1">Group related documents together.</p>

        {parentName && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-brass-dark bg-brass/10 rounded-lg px-3 py-2 w-fit">
            <FolderTree size={13} />
            Inside <span className="font-medium">{parentName}</span>
          </div>
        )}

        <div className="mt-4">
          <label className="label">Folder name</label>
          <input
            autoFocus
            className="input"
            placeholder="e.g. Identity documents"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="label">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  color === c ? "scale-110 border-ink" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3.5 py-2.5">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-brass flex-1">
            {saving ? "Creating…" : "Create folder"}
          </button>
        </div>
      </form>
    </div>
  );
}
