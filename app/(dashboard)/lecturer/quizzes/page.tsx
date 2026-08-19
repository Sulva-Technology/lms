import { LecturerQuizManager } from "@/components/lecturer/LecturerQuizManager";
import { ErrorState } from "@/components/ui/error-state";
import { requireRole } from "@/lib/auth/guards";
import { QuizManagementService } from "@/lib/services/quiz-management.service";
import { createClient } from "@/lib/supabase/server";
import { Target } from "lucide-react";
import { describeDataError } from "@/lib/errors/data-error";

export default async function LecturerQuizzesPage() {
  const session = await requireRole("lecturer");
  const service = new QuizManagementService((await createClient()) as any);
  let data: Awaited<ReturnType<QuizManagementService["getLecturerQuizzes"]>> | null = null;
  let errorMessage: string | null = null;

  try {
    data = await service.getLecturerQuizzes(session.user.id);
  } catch (error) {
    errorMessage = describeDataError(error, "Could not load quiz studio.");
  }

  if (errorMessage || !data) return <ErrorState message={errorMessage || "Could not load quiz studio."} />;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-20">
      <div className="flex flex-col gap-5 rounded-[32px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
            <Target size={24} />
          </div>
          <h1 className="font-outfit text-3xl font-semibold tracking-tight text-white">Quiz Studio</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Build, publish, and review assessments for your assigned course sections.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {data.sections.length} assigned sections
        </div>
      </div>
      <LecturerQuizManager sections={data.sections} quizzes={data.quizzes} stats={data.stats} />
    </div>
  );
}
