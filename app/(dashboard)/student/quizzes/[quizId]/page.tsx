import { StudentQuizAttemptClient } from "@/components/student/StudentQuizAttemptClient";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { QuizManagementService } from "@/lib/services/quiz-management.service";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import { describeDataError } from "@/lib/errors/data-error";

export default async function QuizAttemptPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const session = await requireRole("student");
  const service = new QuizManagementService((await createClient()) as any);
  let quiz: Awaited<ReturnType<QuizManagementService["getStudentQuiz"]>> | null = null;
  let errorMessage: string | null = null;

  try {
    quiz = await service.getStudentQuiz(quizId, session.user.id);
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load quiz.");
  }

  if (errorMessage || !quiz) return <ErrorState message={errorMessage || "Could not load quiz."} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <Link href="/student/quizzes" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary">
        <ArrowLeft size={16} /> Back to quizzes
      </Link>
      <div className="rounded-[32px] border border-line bg-surface p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary-soft text-primary">
          <Target size={24} />
        </div>
        <p className="mb-2 text-sm font-semibold text-primary">{quiz.courseCode} - {quiz.courseTitle}</p>
        <h1 className="font-outfit text-3xl font-semibold tracking-tight text-ink">{quiz.title}</h1>
        <p className="mt-2 max-w-3xl text-ink-muted">{quiz.description || quiz.instructions || "Complete each question before submitting your attempt."}</p>
      </div>
      {!quiz.isEnrolled ? (
        <EmptyState title="Quiz unavailable" description="You need active enrollment in this course section to take this quiz." />
      ) : !quiz.is_published ? (
        <EmptyState title="Quiz not open" description="This quiz has not been published by the lecturer yet." />
      ) : quiz.questions.length === 0 ? (
        <EmptyState title="No questions" description="This quiz is still being prepared." />
      ) : (
        <StudentQuizAttemptClient quiz={quiz} />
      )}
    </div>
  );
}
