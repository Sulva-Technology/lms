"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock3, Eye, FileQuestion, Loader2, Plus, Send, Sparkles, XCircle } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteQuizQuestionAction, publishQuizAction, upsertQuizAction, upsertQuizQuestionAction } from "@/app/actions/quizzes";
import { useRouter } from "next/navigation";

interface LecturerQuizManagerProps {
  sections: Array<{ id: string; label: string; courseCode: string; courseTitle: string }>;
  quizzes: any[];
  stats: { total: number; published: number; draft: number; attempts: number };
}

const inputClass = "rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-primary";

export function LecturerQuizManager({ sections, quizzes, stats }: LecturerQuizManagerProps) {
  const [selectedSection, setSelectedSection] = React.useState("all");
  const [drawer, setDrawer] = React.useState<"quiz" | "question" | null>(null);
  const [activeQuiz, setActiveQuiz] = React.useState<any>(null);
  const [message, setMessage] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  const visibleQuizzes = selectedSection === "all"
    ? quizzes
    : quizzes.filter((quiz) => quiz.course_section_id === selectedSection);

  async function submitQuiz(formData: FormData) {
    setPending(true);
    setMessage("");
    const result = await upsertQuizAction({
      quizId: activeQuiz?.id,
      courseSectionId: String(formData.get("courseSectionId")),
      title: String(formData.get("title")),
      description: String(formData.get("description") || ""),
      instructions: String(formData.get("instructions") || ""),
      timeLimitMinutes: Number(formData.get("timeLimitMinutes") || 60),
      startTime: String(formData.get("startTime") || ""),
      endTime: String(formData.get("endTime") || ""),
      totalPoints: Number(formData.get("totalPoints") || 100),
    });
    setPending(false);
    if (result?.error) {
      setMessage(result.error);
      return;
    }
    setDrawer(null);
    setActiveQuiz(null);
  }

  async function submitQuestion(formData: FormData) {
    if (!activeQuiz) return;
    setPending(true);
    setMessage("");
    const options = [0, 1, 2, 3].map((index) => ({
      optionText: String(formData.get(`option-${index}`) || ""),
      isCorrect: String(formData.get("correct")) === String(index),
    })).filter((option) => option.optionText.trim().length > 0);
    const result = await upsertQuizQuestionAction({
      quizId: activeQuiz.id,
      questionText: String(formData.get("questionText")),
      questionType: "multiple_choice",
      points: Number(formData.get("points") || 1),
      orderIndex: activeQuiz.questionCount || 0,
      options,
    });
    setPending(false);
    if (result?.error) {
      setMessage(result.error);
      return;
    }
    setDrawer(null);
  }

  async function togglePublish(quiz: any) {
    setPending(true);
    await publishQuizAction({ quizId: quiz.id, isPublished: !quiz.is_published });
    setPending(false);
    router.refresh();
  }

  async function removeQuestion(quiz: any, questionId: string) {
    setPending(true);
    setMessage("");
    const result = await deleteQuizQuestionAction({ questionId });
    setPending(false);

    if (result?.error) {
      setMessage(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total quizzes", stats.total, FileQuestion, "text-primary"],
          ["Published", stats.published, CheckCircle2, "text-emerald-300"],
          ["Drafts", stats.draft, Clock3, "text-amber-300"],
          ["Attempts", stats.attempts, Eye, "text-primary"],
        ].map(([label, value, Icon, color]: any, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="panel rounded-[24px] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-muted">{label}</p>
              <Icon size={19} className={color} />
            </div>
            <p className="mt-4 font-outfit text-3xl font-semibold text-ink">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-[28px] border border-line bg-surface p-4 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedSection("all")} className={`rounded-full px-4 py-2 text-sm transition ${selectedSection === "all" ? "bg-primary text-primary-contrast" : "bg-status-soft text-ink-muted hover:bg-ink/[0.06]"}`}>
            All sections
          </button>
          {sections.map((section) => (
            <button key={section.id} onClick={() => setSelectedSection(section.id)} className={`rounded-full px-4 py-2 text-sm transition ${selectedSection === section.id ? "bg-primary text-primary-contrast" : "bg-status-soft text-ink-muted hover:bg-ink/[0.06]"}`}>
              {section.courseCode}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setActiveQuiz(null); setDrawer("quiz"); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover"
        >
          <Plus size={17} /> New quiz
        </button>
      </div>

      {visibleQuizzes.length === 0 ? (
        <EmptyState title="No quizzes yet" description="Create a quiz for one of your assigned course sections." />
      ) : (
        <div className="grid gap-4">
          {visibleQuizzes.map((quiz, index) => (
            <motion.article
              key={quiz.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035 }}
              className="rounded-[28px] border border-line bg-surface p-5 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{quiz.courseCode}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${quiz.is_published ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200"}`}>
                      {quiz.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <h2 className="font-outfit text-xl font-semibold text-ink">{quiz.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-ink-muted">{quiz.description || "No description added yet."}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[320px]">
                  <div className="rounded-2xl bg-status-soft p-3">
                    <p className="text-lg font-semibold text-ink">{quiz.questionCount}</p>
                    <p className="text-xs text-ink-subtle">Questions</p>
                  </div>
                  <div className="rounded-2xl bg-status-soft p-3">
                    <p className="text-lg font-semibold text-ink">{quiz.attemptCount}</p>
                    <p className="text-xs text-ink-subtle">Attempts</p>
                  </div>
                  <div className="rounded-2xl bg-status-soft p-3">
                    <p className="text-lg font-semibold text-ink">{quiz.averageScore}%</p>
                    <p className="text-xs text-ink-subtle">Average</p>
                  </div>
                </div>
              </div>
              {(quiz.questions || []).length > 0 && (
                <ul className="mt-5 grid gap-2 border-t border-line pt-4">
                  {(quiz.questions || []).map((question: any, questionIndex: number) => (
                    <li
                      key={question.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-status-soft px-4 py-3"
                    >
                      <span className="min-w-0 text-sm text-ink">
                        <span className="mr-2 text-xs font-semibold text-ink-subtle">Q{questionIndex + 1}</span>
                        {question.question_text}
                      </span>
                      <button
                        onClick={() => removeQuestion(quiz, question.id)}
                        disabled={pending}
                        className="shrink-0 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
                <button onClick={() => { setActiveQuiz(quiz); setDrawer("quiz"); }} className="rounded-xl border border-line bg-status-soft px-4 py-2 text-sm text-ink transition hover:bg-ink/[0.06]">
                  Edit quiz
                </button>
                <button onClick={() => { setActiveQuiz(quiz); setDrawer("question"); }} className="rounded-xl border border-line bg-status-soft px-4 py-2 text-sm text-ink transition hover:bg-ink/[0.06]">
                  Add question
                </button>
                <button disabled={pending || quiz.questionCount === 0} onClick={() => togglePublish(quiz)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-emerald-500 disabled:opacity-50">
                  {quiz.is_published ? <XCircle size={16} /> : <Send size={16} />}
                  {quiz.is_published ? "Unpublish" : "Publish"}
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <Drawer isOpen={drawer === "quiz"} onClose={() => setDrawer(null)} title={activeQuiz ? "Edit quiz" : "Create quiz"} className="max-w-xl">
        <form action={submitQuiz} className="grid gap-4">
          <label className="grid gap-2 text-sm text-ink-muted">
            Course section
            <select name="courseSectionId" defaultValue={activeQuiz?.course_section_id || sections[0]?.id} className={inputClass}>
              {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-ink-muted">Title<input name="title" defaultValue={activeQuiz?.title} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-ink-muted">Description<textarea name="description" defaultValue={activeQuiz?.description} rows={3} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-ink-muted">Instructions<textarea name="instructions" defaultValue={activeQuiz?.instructions} rows={3} className={inputClass} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-ink-muted">Minutes<input type="number" name="timeLimitMinutes" defaultValue={activeQuiz?.time_limit_minutes || 60} className={inputClass} /></label>
            <label className="grid gap-2 text-sm text-ink-muted">Points<input type="number" name="totalPoints" defaultValue={activeQuiz?.total_points || 100} className={inputClass} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-ink-muted">Start<input type="datetime-local" name="startTime" className={inputClass} /></label>
            <label className="grid gap-2 text-sm text-ink-muted">End<input type="datetime-local" name="endTime" className={inputClass} /></label>
          </div>
          {message && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{message}</p>}
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover">
            {pending ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />} Save quiz
          </button>
        </form>
      </Drawer>

      <Drawer isOpen={drawer === "question"} onClose={() => setDrawer(null)} title="Add question" className="max-w-xl">
        <form action={submitQuestion} className="grid gap-4">
          <label className="grid gap-2 text-sm text-ink-muted">Question<textarea name="questionText" rows={4} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-ink-muted">Points<input name="points" type="number" defaultValue={1} className={inputClass} /></label>
          {[0, 1, 2, 3].map((index) => (
            <label key={index} className="grid gap-2 text-sm text-ink-muted">
              Option {index + 1}
              <span className="flex gap-2">
                <input name={`option-${index}`} className={`${inputClass} w-full`} />
                <input type="radio" name="correct" value={index} defaultChecked={index === 0} className="accent-primary" aria-label={`Mark option ${index + 1} correct`} />
              </span>
            </label>
          ))}
          {message && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{message}</p>}
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast hover:bg-primary-hover">
            {pending ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />} Save question
          </button>
        </form>
      </Drawer>
    </div>
  );
}
