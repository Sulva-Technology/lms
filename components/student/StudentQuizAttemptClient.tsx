"use client";

import * as React from "react";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Clock3, Loader2, Send, Trophy } from "lucide-react";
import { submitQuizAttemptAction } from "@/app/actions/quizzes";

export function StudentQuizAttemptClient({ quiz }: { quiz: any }) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<any>(quiz.latestAttempt || null);
  const [error, setError] = React.useState("");

  const answered = Object.keys(answers).length;
  const total = quiz.questions.length;
  const completed = result?.status === "completed";

  async function submit() {
    setError("");
    if (answered < total) {
      setError("Answer every question before submitting.");
      return;
    }
    setPending(true);
    const response = await submitQuizAttemptAction({ quizId: quiz.id, answers });
    setPending(false);
    if (response?.error) {
      setError(response.error);
      return;
    }
    setResult({ status: "completed", score: response.score, max_score: response.maxScore, percentage: response.percentage });
  }

  if (completed) {
    return (
      <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/10 p-8 text-center shadow-2xl backdrop-blur-2xl">
        <Trophy className="mx-auto text-success" size={56} />
        <h2 className="mt-5 font-outfit text-3xl font-semibold text-ink">Quiz submitted</h2>
        <p className="mt-2 text-ink-muted">Score: {Number(result.score || 0)} / {Number(result.max_score || 0)} ({Number(result.percentage || 0)}%)</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        {quiz.questions.map((question: any, index: number) => (
          <motion.fieldset
            key={question.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-[28px] border border-line bg-surface p-6 shadow-2xl backdrop-blur-2xl"
          >
            <legend className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Question {index + 1} - {Number(question.points || 0)} pts
            </legend>
            <p className="mt-4 text-base leading-7 text-ink">{question.question_text}</p>
            <div className="mt-5 grid gap-3">
              {(question.quiz_options || []).map((option: any) => {
                const active = answers[question.id] === option.id;
                return (
                  <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm transition ${active ? "border-primary/25 bg-primary-soft text-primary-contrast" : "border-line bg-status-soft text-ink-muted hover:bg-ink/[0.06]"}`}>
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={active}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      className="accent-primary"
                    />
                    {option.option_text}
                  </label>
                );
              })}
            </div>
          </motion.fieldset>
        ))}
      </section>

      <aside className="h-fit rounded-[28px] border border-line bg-surface p-6 shadow-2xl backdrop-blur-2xl xl:sticky xl:top-24">
        <div className="mb-5 flex items-center gap-3">
          <Clock3 className="text-primary" size={22} />
          <div>
            <h2 className="font-outfit text-xl font-semibold text-ink">Attempt</h2>
            <p className="text-sm text-ink-muted">{quiz.time_limit_minutes || 60} minute limit</p>
          </div>
        </div>
        <div className="mb-5 rounded-2xl border border-line bg-status-soft p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Progress</span>
            <span className="font-medium text-ink">{answered}/{total}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-status-soft">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
          </div>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-danger">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <button
          type="button"
          disabled={pending || total === 0}
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? <Loader2 size={17} className="animate-spin" /> : answered === total ? <CheckCircle2 size={17} /> : <Send size={17} />}
          Submit quiz
        </button>
      </aside>
    </div>
  );
}
