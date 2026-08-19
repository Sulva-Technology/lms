"use client";

import * as React from "react";
import { CheckCircle2, Film, Loader2, Trash2 } from "lucide-react";
import { attachLessonVideoAction, removeLessonVideoAction } from "@/app/actions/video-assets";
import { FileUploader, type UploadedFile } from "@/components/ui/file-uploader";
import { STORAGE_BUCKETS } from "@/lib/storage/paths";

export type LessonVideo = {
  id: string;
  file_name: string | null;
  duration: number | null;
} | null;

export function LessonVideoUploader({
  lessonId,
  courseId,
  video,
}: {
  lessonId: string;
  courseId: string;
  video: LessonVideo;
}) {
  const [current, setCurrent] = React.useState<LessonVideo>(video);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function attach(files: UploadedFile[]) {
    const file = files[0];
    if (!file) return;

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await attachLessonVideoAction({
        lessonId,
        courseId,
        storagePath: file.path,
        fileName: file.fileName,
        fileSize: file.fileSize,
        contentType: file.fileType,
      });

      if (!result.success) {
        setError(result.error || "Could not attach the video.");
        return;
      }

      setCurrent({ id: result.asset.id, file_name: file.fileName, duration: null });
      setMessage("Video attached. Students can now play this lesson.");
    });
  }

  function remove() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await removeLessonVideoAction(lessonId);
      if (!result.success) {
        setError(result.error || "Could not remove the video.");
        return;
      }
      setCurrent(null);
      setMessage("Video removed.");
    });
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Film size={16} className="text-primary" /> Lesson video
      </div>

      {current ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-status-soft px-4 py-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0" />
            <span className="truncate text-ink">{current.file_name || "Attached video"}</span>
          </span>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-lg bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
            aria-label="Remove lesson video"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No video attached yet.</p>
      )}

      <FileUploader
        bucket={STORAGE_BUCKETS.LESSON_VIDEO}
        scope="video"
        accept="video/*"
        maxSizeMb={512}
        value={[]}
        onChange={attach}
        disabled={pending}
        label={current ? "Replace video" : "Upload video"}
      />

      {(error || message) && (
        <p
          className={
            error
              ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          }
        >
          {error || message}
        </p>
      )}
    </div>
  );
}
