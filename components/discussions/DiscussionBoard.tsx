"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MessageSquarePlus, Send, ShieldCheck } from "lucide-react";
import {
  createDiscussionAction,
  markDiscussionAnsweredAction,
  replyDiscussionAction,
} from "@/app/actions/discussions";
import { DataTable } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";

export type DiscussionReply = {
  id: string;
  content: string;
  author_name: string;
  is_endorsed: boolean;
  created_at: string;
};

export type Discussion = {
  id: string;
  title: string;
  content: string;
  author_name: string;
  course_label: string;
  is_answered: boolean;
  created_at: string;
  reply_count?: number;
  replies?: DiscussionReply[];
};

type Section = { id: string; label: string };

const inputClass =
  "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";
const labelClass = "grid gap-2 text-sm font-medium text-ink-muted";

export function DiscussionBoard({
  mode,
  sections,
  discussions = [],
  discussion = null,
  detailHrefBase,
}: {
  mode: "student" | "lecturer";
  sections: Section[];
  discussions?: Discussion[];
  /** When set, the board renders one thread instead of the list. */
  discussion?: Discussion | null;
  detailHrefBase: string;
}) {
  const [items, setItems] = React.useState(discussions);
  const [thread, setThread] = React.useState(discussion);
  const [replies, setReplies] = React.useState<DiscussionReply[]>(discussion?.replies || []);
  const [askOpen, setAskOpen] = React.useState(false);
  const [replyBody, setReplyBody] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function run(action: () => Promise<any>, onSuccess: (data: any) => void, success: string) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error || "Action failed.");
        return;
      }
      onSuccess(result.data);
      setMessage(success);
    });
  }

  function ask(formData: FormData) {
    const payload = {
      courseSectionId: String(formData.get("courseSectionId") || ""),
      title: String(formData.get("title") || ""),
      body: String(formData.get("body") || ""),
    };

    run(
      async () => createDiscussionAction(payload),
      (data) => {
        setItems((current) => [
          {
            id: data.id,
            title: payload.title,
            content: payload.body,
            author_name: "You",
            course_label: sections.find((section) => section.id === payload.courseSectionId)?.label || "Course",
            is_answered: false,
            created_at: data.created_at || new Date().toISOString(),
            reply_count: 0,
          },
          ...current,
        ]);
        setAskOpen(false);
      },
      "Question posted.",
    );
  }

  function reply() {
    if (!thread || replyBody.trim().length < 2) {
      setError("Write a reply before posting.");
      return;
    }

    const body = replyBody;
    run(
      async () => replyDiscussionAction({ discussionId: thread.id, body }),
      (data) => {
        setReplies((current) => [
          ...current,
          {
            id: data.id,
            content: body,
            author_name: "You",
            is_endorsed: Boolean(data.is_endorsed),
            created_at: data.created_at || new Date().toISOString(),
          },
        ]);
        setReplyBody("");
      },
      "Reply posted.",
    );
  }

  function markAnswered() {
    if (!thread) return;
    run(
      async () => markDiscussionAnsweredAction({ discussionId: thread.id }),
      () => setThread({ ...thread, is_answered: true }),
      "Marked as answered.",
    );
  }

  const banner = (message || error) && (
    <div
      className={
        error
          ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-danger"
          : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-success"
      }
    >
      {error || message}
    </div>
  );

  if (thread) {
    return (
      <div className="space-y-4">
        {banner}

        <article className="rounded-[24px] border border-line bg-surface p-6 backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{thread.course_label}</p>
              <h2 className="mt-1 font-outfit text-2xl font-bold text-ink">{thread.title}</h2>
              <p className="mt-1 text-xs text-ink-subtle">
                {thread.author_name} · {new Date(thread.created_at).toLocaleString()}
              </p>
            </div>
            {thread.is_answered ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-success">
                <CheckCircle2 size={14} /> Answered
              </span>
            ) : mode === "lecturer" ? (
              <button
                onClick={markAnswered}
                disabled={pending}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-ink hover:bg-emerald-500 disabled:opacity-60"
              >
                Mark as answered
              </button>
            ) : null}
          </div>
          <p className="mt-4 whitespace-pre-wrap leading-7 text-ink-muted">{thread.content}</p>
        </article>

        <section className="space-y-3">
          <h3 className="font-outfit text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </h3>

          {replies.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-subtle">
              No replies yet.
            </p>
          ) : (
            replies.map((item) => (
              <div key={item.id} className="rounded-2xl border border-line bg-status-soft p-4">
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="font-semibold text-ink">{item.author_name}</span>
                  <span>· {new Date(item.created_at).toLocaleString()}</span>
                  {item.is_endorsed && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 font-semibold text-primary">
                      <ShieldCheck size={12} /> Lecturer
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">{item.content}</p>
              </div>
            ))
          )}
        </section>

        <div className="grid gap-3 rounded-[24px] border border-line bg-surface p-6">
          <label className={labelClass}>
            Your reply
            <textarea
              rows={4}
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              className={inputClass}
              placeholder="Answer the question or add context…"
            />
          </label>
          <button
            onClick={reply}
            disabled={pending}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Post reply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{items.length} questions</p>
          <p className="text-xs text-ink-muted">
            {mode === "lecturer"
              ? "Answer questions from students in your sections."
              : "Ask your lecturer and classmates a question."}
          </p>
        </div>
        <button
          onClick={() => setAskOpen(true)}
          disabled={sections.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-60"
        >
          <MessageSquarePlus size={16} /> Ask a question
        </button>
      </div>

      {banner}

      {items.length === 0 ? (
        <EmptyState
          title="No discussions"
          description="Questions from your enrolled course sections will appear here."
        />
      ) : (
        <DataTable
          data={items}
          keyExtractor={(item) => item.id}
          columns={[
            {
              key: "title",
              header: "Question",
              cell: (item) => (
                <Link href={`${detailHrefBase}/${item.id}`} className="font-medium text-ink hover:text-primary">
                  {item.title}
                </Link>
              ),
            },
            { key: "course", header: "Course", cell: (item) => item.course_label },
            { key: "author", header: "Asked by", cell: (item) => item.author_name },
            { key: "replies", header: "Replies", cell: (item) => item.reply_count ?? 0 },
            { key: "status", header: "Status", cell: (item) => (item.is_answered ? "Answered" : "Open") },
          ]}
        />
      )}

      <Drawer isOpen={askOpen} onClose={() => setAskOpen(false)} title="Ask a question" className="max-w-xl">
        <form action={ask} className="grid gap-4">
          <label className={labelClass}>
            Course section
            <select name="courseSectionId" required className={inputClass}>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Title
            <input name="title" required minLength={2} maxLength={150} className={inputClass} />
          </label>
          <label className={labelClass}>
            Question
            <textarea name="body" required minLength={5} rows={6} className={inputClass} />
          </label>
          <button
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Post question
          </button>
        </form>
      </Drawer>
    </div>
  );
}
