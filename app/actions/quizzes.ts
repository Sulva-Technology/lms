"use server";

import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const quizPayloadSchema = z.object({
  quizId: z.string().uuid().optional(),
  courseSectionId: z.string().uuid(),
  title: z.string().min(3, "Enter a quiz title."),
  description: z.string().optional(),
  instructions: z.string().optional(),
  timeLimitMinutes: z.coerce.number().int().min(1).max(480).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalPoints: z.coerce.number().min(1).max(10000).optional(),
});

const questionPayloadSchema = z.object({
  quizId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  questionText: z.string().min(3, "Enter the question text."),
  questionType: z.enum(["multiple_choice", "boolean"]).default("multiple_choice"),
  points: z.coerce.number().min(1).max(1000).default(1),
  orderIndex: z.coerce.number().int().min(0).default(0),
  options: z.array(z.object({
    id: z.string().uuid().optional(),
    optionText: z.string().min(1),
    isCorrect: z.boolean().default(false),
  })).min(2, "Add at least two answer options."),
});

const publishQuizSchema = z.object({
  quizId: z.string().uuid(),
  isPublished: z.boolean(),
});

const deleteQuestionSchema = z.object({
  questionId: z.string().uuid(),
});

const submitQuizAttemptSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.string().uuid()),
});

async function assertLecturerOwnsSection(supabase: Awaited<ReturnType<typeof createClient>>, lecturerId: string, sectionId: string) {
  const { data, error } = await supabase
    .from("course_lecturers")
    .select("id")
    .eq("lecturer_id", lecturerId)
    .eq("course_section_id", sectionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("You can only manage quizzes for assigned course sections.");
}

async function assertLecturerOwnsQuiz(supabase: Awaited<ReturnType<typeof createClient>>, lecturerId: string, quizId: string) {
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, course_section_id")
    .eq("id", quizId)
    .single();

  if (error) throw error;
  await assertLecturerOwnsSection(supabase, lecturerId, quiz.course_section_id);
  return quiz;
}

export async function upsertQuizAction(payload: unknown) {
  const supabase = await createClient();
  const session = await requireRole("lecturer");
  const parsed = quizPayloadSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await assertLecturerOwnsSection(supabase, session.user.id, parsed.data.courseSectionId);

    const row = {
      university_id: session.profile.university_id,
      course_section_id: parsed.data.courseSectionId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      instructions: parsed.data.instructions || null,
      time_limit_minutes: parsed.data.timeLimitMinutes || null,
      start_time: parsed.data.startTime || null,
      end_time: parsed.data.endTime || null,
      total_points: parsed.data.totalPoints || 100,
    };

    const result = parsed.data.quizId
      ? await supabase.from("quizzes").update(row).eq("id", parsed.data.quizId).select("id").single()
      : await supabase.from("quizzes").insert(row).select("id").single();

    if (result.error) throw result.error;
    revalidatePath("/lecturer/quizzes");
    return { success: true, quizId: result.data.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save quiz." };
  }
}

export async function upsertQuizQuestionAction(payload: unknown) {
  const supabase = await createClient();
  const session = await requireRole("lecturer");
  const parsed = questionPayloadSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const quiz = await assertLecturerOwnsQuiz(supabase, session.user.id, parsed.data.quizId);
    const questionRow = {
      university_id: session.profile.university_id,
      quiz_id: parsed.data.quizId,
      question_text: parsed.data.questionText,
      question_type: parsed.data.questionType,
      points: parsed.data.points,
      order_index: parsed.data.orderIndex,
    };

    const questionResult = parsed.data.questionId
      ? await supabase.from("quiz_questions").update(questionRow).eq("id", parsed.data.questionId).select("id").single()
      : await supabase.from("quiz_questions").insert(questionRow).select("id").single();

    if (questionResult.error) throw questionResult.error;
    const questionId = questionResult.data.id;

    await supabase.from("quiz_options").delete().eq("question_id", questionId);
    const { error: optionsError } = await supabase.from("quiz_options").insert(parsed.data.options.map((option) => ({
      university_id: session.profile.university_id,
      question_id: questionId,
      option_text: option.optionText,
      is_correct: option.isCorrect,
    })));

    if (optionsError) throw optionsError;
    await supabase.from("quizzes").update({ total_points: parsed.data.points }).eq("id", quiz.id).is("total_points", null);
    revalidatePath("/lecturer/quizzes");
    return { success: true, questionId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save question." };
  }
}

export async function deleteQuizQuestionAction(payload: unknown) {
  const supabase = await createClient();
  const session = await requireRole("lecturer");
  const parsed = deleteQuestionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: question, error: questionError } = await supabase
    .from("quiz_questions")
    .select("quiz_id")
    .eq("id", parsed.data.questionId)
    .single();

  if (questionError) return { error: questionError.message };

  try {
    await assertLecturerOwnsQuiz(supabase, session.user.id, question.quiz_id);
    const { error } = await supabase.from("quiz_questions").delete().eq("id", parsed.data.questionId);
    if (error) throw error;
    revalidatePath("/lecturer/quizzes");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete question." };
  }
}

export async function publishQuizAction(payload: unknown) {
  const supabase = await createClient();
  const session = await requireRole("lecturer");
  const parsed = publishQuizSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await assertLecturerOwnsQuiz(supabase, session.user.id, parsed.data.quizId);
    const { error } = await supabase
      .from("quizzes")
      .update({
        is_published: parsed.data.isPublished,
        published_at: parsed.data.isPublished ? new Date().toISOString() : null,
      })
      .eq("id", parsed.data.quizId);

    if (error) throw error;
    revalidatePath("/lecturer/quizzes");
    revalidatePath("/student/quizzes");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update publish status." };
  }
}

export async function submitQuizAttemptAction(payload: unknown) {
  const supabase = await createClient();
  const session = await requireRole("student");
  const parsed = submitQuizAttemptSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, university_id, course_section_id, is_published, total_points, quiz_questions(id, points, quiz_options(id, is_correct))")
    .eq("id", parsed.data.quizId)
    .single();

  if (quizError) return { error: quizError.message };
  if (!quiz.is_published) return { error: "This quiz is not open yet." };

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_section_id", quiz.course_section_id)
    .eq("student_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) return { error: "You are not enrolled in this course section." };

  const { data: existingAttempt } = await supabase
    .from("quiz_attempts")
    .select("id")
    .eq("quiz_id", quiz.id)
    .eq("student_id", session.user.id)
    .in("status", ["completed", "started"])
    .maybeSingle();

  if (existingAttempt) return { error: "You have already started or submitted this quiz." };

  const questions = quiz.quiz_questions || [];
  let score = 0;
  const maxScore = questions.reduce((sum: number, question: any) => sum + Number(question.points || 0), 0);

  const { data: attempt, error: attemptError } = await supabase.from("quiz_attempts").insert({
    university_id: quiz.university_id,
    quiz_id: quiz.id,
    student_id: session.user.id,
    status: "completed",
    submitted_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    max_score: maxScore,
  }).select().single();

  if (attemptError) return { error: attemptError.message };

  const answerRows = questions.map((question: any) => {
    const selected = parsed.data.answers[question.id];
    const option = (question.quiz_options || []).find((item: any) => item.id === selected);
    const points = option?.is_correct ? Number(question.points || 0) : 0;
    score += points;
    return {
      university_id: quiz.university_id,
      attempt_id: attempt.id,
      question_id: question.id,
      selected_option_id: selected,
      points_awarded: points,
    };
  });

  if (answerRows.length) {
    const { error } = await supabase.from("quiz_answers").insert(answerRows);
    if (error) return { error: error.message };
  }

  const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0;
  const { error } = await supabase.from("quiz_attempts").update({ score, percentage }).eq("id", attempt.id);
  if (error) return { error: error.message };

  revalidatePath("/student/quizzes");
  revalidatePath(`/student/quizzes/${quiz.id}`);
  return { success: true, score, maxScore, percentage };
}
