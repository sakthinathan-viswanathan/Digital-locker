import React from "react";
import { Search, Upload, Menu } from "lucide-react";

export default function Topbar({ search, onSearchChange, onUploadClick, onMenuClick, folderName }) {
  return (
    <header className="sticky top-0 z-20 bg-canvas/80 backdrop-blur border-b border-slate-200/70 px-4 sm:px-8 py-4">
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-ink" onClick={onMenuClick}>
          <Menu size={20} />
        </button>

        <div>
          <h1 className="font-display text-lg font-semibold text-ink leading-none">{folderName}</h1>
        </div>

        <div className="flex-1" />

        <div className="relative hidden sm:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search your files…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button onClick={onUploadClick} className="btn-brass">
          <Upload size={16} />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      <div className="relative sm:hidden mt-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          className="input pl-9 py-2 text-sm"
          placeholder="Search your files…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </header>
  );
}
