import { SupabaseClient } from "@supabase/supabase-js";

const one = <T>(value: T | T[] | null | undefined): T | null => Array.isArray(value) ? value[0] ?? null : value ?? null;

export class QuizManagementService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getLecturerQuizzes(lecturerId: string) {
    const { data: assignments, error: assignmentError } = await this.supabase
      .from("course_lecturers")
      .select("course_section_id, course_sections(id,name,courses(id,code,title))")
      .eq("lecturer_id", lecturerId);

    if (assignmentError) throw assignmentError;
    const sections = assignments || [];
    const sectionIds = sections.map((row: any) => row.course_section_id).filter(Boolean);

    if (sectionIds.length === 0) {
      return { sections: [], quizzes: [], stats: { total: 0, published: 0, draft: 0, attempts: 0 } };
    }

    const { data: quizzes, error } = await this.supabase
      .from("quizzes")
      .select(`
        id,
        title,
        description,
        instructions,
        time_limit_minutes,
        start_time,
        end_time,
        total_points,
        is_published,
        published_at,
        course_section_id,
        course_sections(courses(code,title)),
        quiz_questions(id,question_text,points,order_index,quiz_options(id)),
        quiz_attempts(id,status,score,percentage,completed_at,submitted_at)
      `)
      .in("course_section_id", sectionIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const normalized = (quizzes || []).map((quiz: any) => {
      const questions = quiz.quiz_questions || [];
      const attempts = quiz.quiz_attempts || [];
      const course = one(one(quiz.course_sections)?.courses);
      return {
        ...quiz,
        courseCode: course?.code || "Course",
        courseTitle: course?.title || "Assigned section",
        questionCount: questions.length,
        questions: [...questions].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)),
        optionCount: questions.reduce((sum: number, question: any) => sum + (question.quiz_options || []).length, 0),
        attemptCount: attempts.length,
        averageScore: attempts.length
          ? Math.round(attempts.reduce((sum: number, attempt: any) => sum + Number(attempt.percentage || 0), 0) / attempts.length)
          : 0,
      };
    });

    return {
      sections: sections.map((row: any) => {
        const section = one(row.course_sections);
        const course = one(section?.courses);
        return {
          id: row.course_section_id,
          label: `${course?.code || "Course"} - ${section?.name || course?.title || "Section"}`,
          courseCode: course?.code || "Course",
          courseTitle: course?.title || section?.name || "Assigned section",
        };
      }),
      quizzes: normalized,
      stats: {
        total: normalized.length,
        published: normalized.filter((quiz: any) => quiz.is_published).length,
        draft: normalized.filter((quiz: any) => !quiz.is_published).length,
        attempts: normalized.reduce((sum: number, quiz: any) => sum + quiz.attemptCount, 0),
      },
    };
  }

  async getStudentQuiz(quizId: string, studentId: string) {
    const { data: quiz, error } = await this.supabase
      .from("quizzes")
      .select(`
        id,
        title,
        description,
        instructions,
        time_limit_minutes,
        start_time,
        end_time,
        total_points,
        is_published,
        course_section_id,
        course_sections(courses(code,title)),
        quiz_questions(id,question_text,question_type,points,order_index,quiz_options(id,option_text)),
        quiz_attempts(id,student_id,status,score,max_score,percentage,started_at,completed_at,submitted_at)
      `)
      .eq("id", quizId)
      .single();

    if (error) throw error;

    const { data: enrollment } = await this.supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_section_id", quiz.course_section_id)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();

    const course = one(one(quiz.course_sections)?.courses);
    const attempts = (quiz.quiz_attempts || []).filter((attempt: any) => attempt.student_id === studentId);

    return {
      ...quiz,
      courseCode: course?.code || "Course",
      courseTitle: course?.title || "Course quiz",
      questions: (quiz.quiz_questions || []).sort((a: any, b: any) => a.order_index - b.order_index),
      latestAttempt: attempts[0] || null,
      isEnrolled: Boolean(enrollment),
    };
  }
}
