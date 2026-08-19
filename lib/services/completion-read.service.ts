import { SupabaseClient } from "@supabase/supabase-js";

const one = <T>(value: T | T[] | null | undefined): T | null => Array.isArray(value) ? value[0] ?? null : value ?? null;

export class StudentReadService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getSectionIds(studentId: string) {
    const { data, error } = await this.supabase
      .from("course_enrollments")
      .select("course_section_id")
      .eq("student_id", studentId)
      .eq("status", "active");
    if (error) throw error;
    return (data || []).map((row: any) => row.course_section_id);
  }

  async getAssignments(studentId: string, sectionIds: string[]) {
    if (sectionIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("assignments")
      .select("id,title,description,due_date,total_points,is_published,course_section_id,course_sections(courses(code,title)),assignment_submissions(id,status,score,submitted_at,graded_at)")
      .in("course_section_id", sectionIds)
      .eq("is_published", true)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data || []).map((assignment: any) => {
      const submission = (assignment.assignment_submissions || []).find((item: any) => item.student_id === studentId) || assignment.assignment_submissions?.[0];
      const course = one(one(assignment.course_sections)?.courses);
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        points: Number(assignment.total_points || 0),
        course: course?.code || course?.title || "Course",
        status: submission?.status || "not_submitted",
        score: submission?.score ?? null,
      };
    });
  }

  async getAttendance(studentId: string, sectionIds: string[]) {
    if (sectionIds.length === 0) return { summary: [], records: [] };
    const { data, error } = await this.supabase
      .from("attendance_records")
      .select("id,status,notes,record_date,created_at,attendance_sessions(title,date,period,course_sections(courses(code,title)))")
      .eq("student_id", studentId)
      .in("course_section_id", sectionIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const records = (data || []).map((record: any) => {
      const session = one(record.attendance_sessions);
      const course = one(one(session?.course_sections)?.courses);
      return {
        id: record.id,
        title: session?.title || "Attendance",
        course: course?.code || course?.title || "Course",
        date: session?.date || record.record_date || record.created_at,
        period: session?.period ?? 1,
        notes: record.notes || "",
        status: record.status,
      };
    });
    const byCourse = new Map<string, { course: string; present: number; total: number }>();
    records.forEach((record) => {
      const current = byCourse.get(record.course) || { course: record.course, present: 0, total: 0 };
      current.total += 1;
      if (record.status === "present" || record.status === "late") current.present += 1;
      byCourse.set(record.course, current);
    });
    return { summary: Array.from(byCourse.values()), records };
  }

  async getCalendar(userId: string, universityId: string, sectionIds: string[]) {
    const [events, assignments, liveClasses, quizzes] = await Promise.all([
      this.supabase.from("calendar_events").select("id,title,description,start_time,end_time,event_type").eq("university_id", universityId).or(`user_id.eq.${userId},user_id.is.null`).order("start_time"),
      sectionIds.length ? this.supabase.from("assignments").select("id,title,due_date,course_sections(courses(code))").in("course_section_id", sectionIds).eq("is_published", true).order("due_date") : { data: [], error: null },
      sectionIds.length ? this.supabase.from("live_classes").select("id,title,topic,start_time,end_time,status,course_sections(courses(code))").in("course_section_id", sectionIds).order("start_time") : { data: [], error: null },
      sectionIds.length ? this.supabase.from("quizzes").select("id,title,start_time,end_time,course_sections(courses(code))").in("course_section_id", sectionIds).order("start_time") : { data: [], error: null },
    ]);
    for (const result of [events, assignments, liveClasses, quizzes]) if (result.error) throw result.error;
    return [
      ...(events.data || []).map((item: any) => ({ id: item.id, title: item.title, type: item.event_type || "event", startsAt: item.start_time, endsAt: item.end_time })),
      ...(assignments.data || []).map((item: any) => ({ id: item.id, title: item.title, type: "assignment", startsAt: item.due_date, course: one(one(item.course_sections)?.courses)?.code })),
      ...(liveClasses.data || []).map((item: any) => ({ id: item.id, title: item.topic || item.title, type: "live_class", startsAt: item.start_time, endsAt: item.end_time, course: one(one(item.course_sections)?.courses)?.code })),
      ...(quizzes.data || []).map((item: any) => ({ id: item.id, title: item.title, type: "quiz", startsAt: item.start_time, endsAt: item.end_time, course: one(one(item.course_sections)?.courses)?.code })),
    ].sort((a, b) => new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime());
  }

  async getGrades(studentId: string, sectionIds: string[]) {
    if (sectionIds.length === 0) return { rows: [], average: 0 };
    const { data, error } = await this.supabase
      .from("grades")
      .select("id,score,notes,graded_at,grade_items(name,title,max_score,weight,weight_percentage,course_sections(courses(code,title)))")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map((grade: any) => {
      const item = one(grade.grade_items);
      const course = one(one(item?.course_sections)?.courses);
      const maxScore = Number(item?.max_score || 100);
      return {
        id: grade.id,
        item: item?.name || item?.title || "Grade item",
        course: course?.code || course?.title || "Course",
        score: Number(grade.score || 0),
        maxScore,
        weight: Number(item?.weight || item?.weight_percentage || 0),
        percentage: maxScore ? Math.round((Number(grade.score || 0) / maxScore) * 100) : 0,
      };
    });
    const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percentage, 0) / rows.length) : 0;
    return { rows, average };
  }

  async getAnnouncements(universityId: string, sectionIds: string[]) {
    let query = this.supabase
      .from("announcements")
      .select("id,title,content,target_scope,is_published,created_at,course_sections(courses(code,title)),profiles(first_name,last_name)")
      .eq("university_id", universityId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (sectionIds.length > 0) query = query.or(`course_section_id.in.(${sectionIds.join(",")}),course_section_id.is.null`);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getDiscussions(sectionIds: string[]) {
    if (sectionIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("discussions")
      .select("id,title,content,is_answered,created_at,course_sections(courses(code,title)),profiles(first_name,last_name),discussion_replies(id)")
      .in("course_section_id", sectionIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getNotifications(userId: string) {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("id,title,content,type,is_read,link_url,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getRecordings(sectionIds: string[]) {
    if (sectionIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("live_class_recordings")
      .select("id,recording_url,playback_url,duration,status,is_published,created_at,live_classes(topic,title,start_time,course_section_id,course_sections(courses(code,title)))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    // Students see only published recordings from sections they are enrolled in.
    return (data || []).filter(
      (item: any) =>
        item.is_published && sectionIds.includes(one(item.live_classes)?.course_section_id),
    );
  }

  async getQuizzes(studentId: string, sectionIds: string[]) {
    if (sectionIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("quizzes")
      .select("id,title,description,time_limit_minutes,start_time,end_time,total_points,course_sections(courses(code,title)),quiz_attempts(id,status,score,percentage,completed_at)")
      .in("course_section_id", sectionIds)
      .eq("is_published", true)
      .order("start_time", { ascending: true });
    if (error) throw error;
    return (data || []).map((quiz: any) => ({
      ...quiz,
      attempt: (quiz.quiz_attempts || []).find((attempt: any) => attempt.student_id === studentId) || quiz.quiz_attempts?.[0],
    }));
  }

  async getCourseDetail(studentId: string, courseId: string) {
    const { data, error } = await this.supabase
      .from("course_enrollments")
      .select("id,course_sections(id,name,courses(id,code,title,description,thumbnail_url),course_modules(id,title,order_index,lessons(id,title,content,resource_type,duration_seconds,order_index,is_published,lesson_progress(is_completed,last_accessed))))")
      .eq("student_id", studentId)
      .eq("status", "active")
      .eq("course_sections.courses.id", courseId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}

export class LecturerReadService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getSectionIds(lecturerId: string) {
    const { data, error } = await this.supabase.from("course_lecturers").select("course_section_id").eq("lecturer_id", lecturerId);
    if (error) throw error;
    return (data || []).map((row: any) => row.course_section_id);
  }

  async getAttendance(sectionIds: string[]) {
    if (sectionIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("attendance_sessions")
      .select("id,title,date,period,course_sections(courses(code,title)),attendance_records(id,status,notes,student_id)")
      .in("course_section_id", sectionIds)
      .order("date", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getGradebook(sectionIds: string[]) {
    if (sectionIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("grade_items")
      .select("id,name,title,max_score,weight,weight_percentage,course_sections(courses(code,title)),grades(id,score,student_id,profiles(first_name,last_name,email))")
      .in("course_section_id", sectionIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getQuestions(sectionIds: string[]) {
    if (sectionIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("discussions")
      .select("id,title,content,is_answered,created_at,course_sections(courses(code,title)),profiles(first_name,last_name,email),discussion_replies(id,is_endorsed)")
      .in("course_section_id", sectionIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getRecordings(sectionIds: string[]) {
    if (sectionIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("live_class_recordings")
      .select("id,recording_url,playback_url,duration,status,is_published,created_at,live_classes(topic,title,start_time,course_section_id,course_sections(courses(code,title)))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).filter((item: any) => sectionIds.includes(one(item.live_classes)?.course_section_id));
  }
}

export class AdminReadService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getReports(universityId: string) {
    const [students, lecturers, courses, files, registrations, attendance] = await Promise.all([
      this.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("university_id", universityId).eq("role", "student"),
      this.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("university_id", universityId).eq("role", "lecturer"),
      this.supabase.from("courses").select("id", { count: "exact", head: true }).eq("university_id", universityId),
      this.supabase.from("files").select("file_size").eq("university_id", universityId),
      this.supabase.from("course_registrations").select("id,status").eq("university_id", universityId),
      this.supabase.from("attendance_records").select("id,status").eq("university_id", universityId),
    ]);
    for (const result of [students, lecturers, courses, files, registrations, attendance]) if (result.error) throw result.error;
    return {
      studentCount: students.count || 0,
      lecturerCount: lecturers.count || 0,
      courseCount: courses.count || 0,
      storageBytes: (files.data || []).reduce((sum: number, file: any) => sum + Number(file.file_size || 0), 0),
      registrations: registrations.data || [],
      attendance: attendance.data || [],
    };
  }

  async getStorage(universityId: string) {
    const { data, error } = await this.supabase
      .from("files")
      .select("id,file_name,file_size,file_type,storage_path,is_public,created_at,profiles(first_name,last_name,email)")
      .eq("university_id", universityId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getAuditLogs(universityId: string) {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("id,action,entity_type,entity_id,metadata,ip_address,created_at,profiles(first_name,last_name,email)")
      .eq("university_id", universityId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data || [];
  }

  async getSettings(universityId: string) {
    const { data, error } = await this.supabase
      .from("university_settings")
      .select("*")
      .eq("university_id", universityId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}

export class SuperadminService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getOverview() {
    const [universities, users, plans, tickets] = await Promise.all([
      this.supabase.from("universities").select("id,name,status,created_at"),
      this.supabase.from("profiles").select("id,role"),
      this.supabase.from("platform_plans").select("id,name,is_active"),
      this.supabase.from("support_tickets").select("id,status,priority"),
    ]);
    for (const result of [universities, users, plans, tickets]) if (result.error) throw result.error;
    return { universities: universities.data || [], users: users.data || [], plans: plans.data || [], tickets: tickets.data || [] };
  }

  async getUniversities() {
    const { data, error } = await this.supabase
      .from("universities")
      .select("id,name,subdomain,domain,status,mode,created_at,university_plan_subscriptions(status,platform_plans(name,slug))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getPlans() {
    const { data, error } = await this.supabase.from("platform_plans").select("*").order("monthly_price_cents");
    if (error) throw error;
    return data || [];
  }

  async getUsage() {
    const { data, error } = await this.supabase
      .from("universities")
      .select("id,name,status,profiles(id),courses(id),files(file_size),video_assets(id)");
    if (error) throw error;
    return data || [];
  }

  async getSettings() {
    const { data, error } = await this.supabase.from("platform_settings").select("*").order("key");
    if (error) throw error;
    return data || [];
  }

  async getTickets() {
    const { data, error } = await this.supabase
      .from("support_tickets")
      .select("id,subject,status,priority,created_at,universities(name),profiles(first_name,last_name,email)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
}
