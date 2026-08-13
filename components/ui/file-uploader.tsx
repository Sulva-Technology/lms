"use client";

import * as React from "react";
import { Loader2, Paperclip, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSignedUploadUrlAction, saveFileMetadataAction } from "@/app/actions/files";

export type UploadedFile = {
  path: string;
  fileName: string;
  fileSize: number;
  fileType: string;
};

interface FileUploaderProps {
  bucket: string;
  scope: string;
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Browser-direct upload. The server mints a short-lived signed upload URL for a
 * path it derives itself, the bytes go straight to Supabase Storage, and only
 * then do we record the file row. Large files never pass through our runtime.
 */
export function FileUploader({
  bucket,
  scope,
  accept,
  maxSizeMb = 50,
  multiple = false,
  value,
  onChange,
  disabled,
  label,
}: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function uploadOne(file: File): Promise<UploadedFile | null> {
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`${file.name} is larger than ${maxSizeMb}MB.`);
      return null;
    }

    const contentType = file.type || "application/octet-stream";
    const signed = await createSignedUploadUrlAction({ bucket, scope, fileName: file.name, contentType });

    if (!signed.success) {
      setError(signed.error || "Could not start the upload.");
      return null;
    }

    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(signed.path, signed.token, file);

    if (uploadError) {
      setError(uploadError.message);
      return null;
    }

    const metadata = await saveFileMetadataAction({
      fileName: file.name,
      fileSize: file.size,
      fileType: contentType,
      storagePath: signed.path,
      isPublic: false,
    });

    if (!metadata.success) {
      setError(metadata.error || "Uploaded, but the file record could not be saved.");
      return null;
    }

    return { path: signed.path, fileName: file.name, fileSize: file.size, fileType: contentType };
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError("");
    setBusy(true);

    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      const result = await uploadOne(file);
      if (result) uploaded.push(result);
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded.length > 0) onChange(multiple ? [...value, ...uploaded] : uploaded);
  }

  function remove(path: string) {
    onChange(value.filter((file) => file.path !== path));
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-slate-950/50 px-5 py-6 text-sm font-medium text-slate-300 transition hover:border-blue-400/50 hover:text-white disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {busy ? "Uploading…" : label || `Choose file${multiple ? "s" : ""}`}
        </span>
        <span className="text-xs text-slate-500">max {maxSizeMb}MB</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {value.length > 0 && (
        <ul className="grid gap-2">
          {value.map((file) => (
            <li
              key={file.path}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-slate-200">
                <Paperclip size={15} className="shrink-0 text-blue-300" />
                <span className="truncate">{file.fileName}</span>
                <span className="shrink-0 text-xs text-slate-500">{Math.ceil(file.fileSize / 1024)}KB</span>
              </span>
              <button
                type="button"
                onClick={() => remove(file.path)}
                disabled={disabled}
                className="rounded-lg bg-white/5 p-1.5 text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
                aria-label={`Remove ${file.fileName}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
