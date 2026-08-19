"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toggleRecordingPublishAction } from "@/app/actions/recordings";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

export type Recording = Record<string, any>;

export function RecordingManager({ recordings }: { recordings: Recording[] }) {
  const [rows, setRows] = React.useState(recordings);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [, startTransition] = React.useTransition();

  function togglePublish(item: Recording) {
    const next = !item.is_published;

    setError("");
    setMessage("");
    setBusyId(item.id);

    startTransition(async () => {
      const result = await toggleRecordingPublishAction(item.id, next);
      setBusyId(null);

      if (!result.success) {
        setError(result.error || "Could not update the recording.");
        return;
      }

      setRows((current) => current.map((row) => (row.id === item.id ? { ...row, is_published: next } : row)));
      setMessage(next ? "Recording published to students." : "Recording hidden from students.");
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState title="No recordings" description="Recordings appear after live classes finish processing." />
    );
  }

  return (
    <div className="space-y-4">
      {(message || error) && (
        <div
          className={
            error
              ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          }
        >
          {error || message}
        </div>
      )}

      <DataTable
        data={rows}
        keyExtractor={(item) => item.id}
        columns={[
          {
            key: "title",
            header: "Class",
            cell: (item) => (
              <span className="font-medium text-ink">
                {item.live_classes?.topic || item.live_classes?.title || "Recording"}
              </span>
            ),
          },
          {
            key: "course",
            header: "Course",
            cell: (item) => item.live_classes?.course_sections?.courses?.code || "Course",
          },
          { key: "status", header: "Status", cell: (item) => item.status || "Ready" },
          { key: "date", header: "Date", cell: (item) => new Date(item.created_at).toLocaleDateString() },
          {
            key: "visibility",
            header: "Visible to students",
            cell: (item) => (item.is_published ? "Published" : "Hidden"),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            cell: (item) => (
              <div className="flex justify-end gap-2">
                {item.recording_url || item.playback_url ? (
                  <a
                    className="rounded-lg bg-status-soft px-3 py-2 text-xs font-semibold text-ink hover:bg-ink/[0.06]"
                    href={item.playback_url || item.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </a>
                ) : (
                  <span className="px-3 py-2 text-xs text-ink-subtle">Processing</span>
                )}
                <button
                  onClick={() => togglePublish(item)}
                  disabled={busyId === item.id}
                  className={
                    item.is_published
                      ? "inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                      : "inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60"
                  }
                >
                  {busyId === item.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : item.is_published ? (
                    <EyeOff size={13} />
                  ) : (
                    <Eye size={13} />
                  )}
                  {item.is_published ? "Unpublish" : "Publish"}
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
