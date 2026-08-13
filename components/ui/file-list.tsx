"use client";

import * as React from "react";
import { Download, Loader2, Paperclip } from "lucide-react";
import { createSignedDownloadUrlAction } from "@/app/actions/files";
import type { UploadedFile } from "./file-uploader";

/** Renders stored files, resolving a signed URL only when one is opened. */
export function FileList({
  bucket,
  files,
  emptyLabel = "No files attached.",
}: {
  bucket: string;
  files: UploadedFile[];
  emptyLabel?: string;
}) {
  const [pendingPath, setPendingPath] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  async function open(path: string) {
    setError("");
    setPendingPath(path);
    const result = await createSignedDownloadUrlAction({ bucket, path });
    setPendingPath(null);

    if (!result.success) {
      setError(result.error || "Could not open the file.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  if (files.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-2">
      {error && <p className="text-sm text-red-300">{error}</p>}
      {files.map((file) => (
        <button
          key={file.path}
          type="button"
          onClick={() => void open(file.path)}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
            <Paperclip size={15} className="shrink-0 text-blue-300" />
            <span className="truncate">{file.fileName}</span>
          </span>
          {pendingPath === file.path ? (
            <Loader2 size={15} className="animate-spin text-slate-400" />
          ) : (
            <Download size={15} className="text-slate-400" />
          )}
        </button>
      ))}
    </div>
  );
}
