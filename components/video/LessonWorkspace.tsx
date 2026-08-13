"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CheckCircle2, FileText, Loader2, MessageSquareText, PlayCircle, Save } from "lucide-react";
import { saveStudentNoteAction, updateLessonProgressAction } from "@/app/actions/learning";

export function LessonWorkspace({
  lesson,
  courseId,
  videoUrl,
}: {
  lesson: any;
  courseId: string;
  /** Signed playback URL minted on the server; null when no video is attached. */
  videoUrl: string | null;
}) {
  const progress = lesson.lesson_progress?.[0];
  const video = lesson.video_assets?.[0];
  const [completed, setCompleted] = React.useState(Boolean(progress?.is_completed));
  const [pending, setPending] = React.useState(false);
  const [noteState, setNoteState] = React.useState("");

  async function markComplete() {
    setPending(true);
    const next = !completed;
    const result = await updateLessonProgressAction({ lessonId: lesson.id, isCompleted: next });
    setPending(false);
    if (!result?.error) setCompleted(next);
  }

  async function saveNote(formData: FormData) {
    setNoteState("");
    const result = await saveStudentNoteAction({
      lessonId: lesson.id,
      content: String(formData.get("note") || ""),
    });
    setNoteState(result?.error || "Note saved.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-2xl"
        >
          <div className="aspect-video bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22),transparent_55%)]">
            {videoUrl ? (
              <video
                controls
                controlsList="nodownload"
                className="h-full w-full bg-black object-contain"
                poster={video?.thumbnail_url || undefined}
                onEnded={() => { if (!completed) void markComplete(); }}
              >
                <source src={videoUrl} type={video?.content_type || undefined} />
                Your browser cannot play this video.
              </video>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <PlayCircle size={64} className="mx-auto text-blue-300" />
                  <p className="mt-4 text-sm text-slate-400">{lesson.resource_type || "Lesson"} content</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <article className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 leading-7 text-slate-300 shadow-2xl backdrop-blur-2xl">
          <div className="mb-4 flex items-center gap-3">
            <FileText className="text-blue-300" size={21} />
            <h2 className="font-outfit text-xl font-semibold text-white">Lesson Notes</h2>
          </div>
          <div className="whitespace-pre-wrap">{lesson.content || "No lesson notes have been added yet."}</div>
        </article>
      </section>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-2xl">
          <h2 className="font-outfit text-xl font-semibold text-white">Progress</h2>
          <p className="mt-2 text-sm text-slate-400">Track completion for this lesson inside {courseId}.</p>
          <button
            type="button"
            onClick={markComplete}
            disabled={pending}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${completed ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"}`}
          >
            {pending ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
            {completed ? "Completed" : "Mark complete"}
          </button>
        </div>

        <form action={saveNote} className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="mb-4 flex items-center gap-3">
            <MessageSquareText className="text-violet-300" size={21} />
            <h2 className="font-outfit text-xl font-semibold text-white">Private note</h2>
          </div>
          <textarea name="note" rows={5} className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-blue-400" placeholder="Capture a thought, question, or timestamp..." />
          {noteState && <p className="mt-3 text-sm text-emerald-300">{noteState}</p>}
          <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500">
            <Save size={16} /> Save note
          </button>
        </form>
      </aside>
    </div>
  );
}
