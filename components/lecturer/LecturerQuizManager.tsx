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

const inputClass = "rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400";

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
          ["Total quizzes", stats.total, FileQuestion, "text-blue-300"],
          ["Published", stats.published, CheckCircle2, "text-emerald-300"],
          ["Drafts", stats.draft, Clock3, "text-amber-300"],
          ["Attempts", stats.attempts, Eye, "text-violet-300"],
        ].map(([label, value, Icon, color]: any, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-panel-heavy rounded-[24px] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <Icon size={19} className={color} />
            </div>
            <p className="mt-4 font-outfit text-3xl font-semibold text-white">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-4 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedSection("all")} className={`rounded-full px-4 py-2 text-sm transition ${selectedSection === "all" ? "bg-blue-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
            All sections
          </button>
          {sections.map((section) => (
            <button key={section.id} onClick={() => setSelectedSection(section.id)} className={`rounded-full px-4 py-2 text-sm transition ${selectedSection === section.id ? "bg-blue-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              {section.courseCode}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setActiveQuiz(null); setDrawer("quiz"); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue transition hover:bg-blue-500"
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
              className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">{quiz.courseCode}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${quiz.is_published ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200"}`}>
                      {quiz.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <h2 className="font-outfit text-xl font-semibold text-white">{quiz.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-400">{quiz.description || "No description added yet."}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[320px]">
                  <div className="rounded-2xl bg-white/[0.04] p-3">
                    <p className="text-lg font-semibold text-white">{quiz.questionCount}</p>
                    <p className="text-xs text-slate-500">Questions</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-3">
                    <p className="text-lg font-semibold text-white">{quiz.attemptCount}</p>
                    <p className="text-xs text-slate-500">Attempts</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-3">
                    <p className="text-lg font-semibold text-white">{quiz.averageScore}%</p>
                    <p className="text-xs text-slate-500">Average</p>
                  </div>
                </div>
              </div>
              {(quiz.questions || []).length > 0 && (
                <ul className="mt-5 grid gap-2 border-t border-white/10 pt-4">
                  {(quiz.questions || []).map((question: any, questionIndex: number) => (
                    <li
                      key={question.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <span className="min-w-0 text-sm text-slate-200">
                        <span className="mr-2 text-xs font-semibold text-slate-500">Q{questionIndex + 1}</span>
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
              <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-4">
                <button onClick={() => { setActiveQuiz(quiz); setDrawer("quiz"); }} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                  Edit quiz
                </button>
                <button onClick={() => { setActiveQuiz(quiz); setDrawer("question"); }} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                  Add question
                </button>
                <button disabled={pending || quiz.questionCount === 0} onClick={() => togglePublish(quiz)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50">
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
          <label className="grid gap-2 text-sm text-slate-300">
            Course section
            <select name="courseSectionId" defaultValue={activeQuiz?.course_section_id || sections[0]?.id} className={inputClass}>
              {sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-300">Title<input name="title" defaultValue={activeQuiz?.title} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-slate-300">Description<textarea name="description" defaultValue={activeQuiz?.description} rows={3} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-slate-300">Instructions<textarea name="instructions" defaultValue={activeQuiz?.instructions} rows={3} className={inputClass} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">Minutes<input type="number" name="timeLimitMinutes" defaultValue={activeQuiz?.time_limit_minutes || 60} className={inputClass} /></label>
            <label className="grid gap-2 text-sm text-slate-300">Points<input type="number" name="totalPoints" defaultValue={activeQuiz?.total_points || 100} className={inputClass} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">Start<input type="datetime-local" name="startTime" className={inputClass} /></label>
            <label className="grid gap-2 text-sm text-slate-300">End<input type="datetime-local" name="endTime" className={inputClass} /></label>
          </div>
          {message && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{message}</p>}
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
            {pending ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />} Save quiz
          </button>
        </form>
      </Drawer>

      <Drawer isOpen={drawer === "question"} onClose={() => setDrawer(null)} title="Add question" className="max-w-xl">
        <form action={submitQuestion} className="grid gap-4">
          <label className="grid gap-2 text-sm text-slate-300">Question<textarea name="questionText" rows={4} className={inputClass} /></label>
          <label className="grid gap-2 text-sm text-slate-300">Points<input name="points" type="number" defaultValue={1} className={inputClass} /></label>
          {[0, 1, 2, 3].map((index) => (
            <label key={index} className="grid gap-2 text-sm text-slate-300">
              Option {index + 1}
              <span className="flex gap-2">
                <input name={`option-${index}`} className={`${inputClass} w-full`} />
                <input type="radio" name="correct" value={index} defaultChecked={index === 0} className="accent-blue-500" aria-label={`Mark option ${index + 1} correct`} />
              </span>
            </label>
          ))}
          {message && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{message}</p>}
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
            {pending ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />} Save question
          </button>
        </form>
      </Drawer>
    </div>
  );
}
