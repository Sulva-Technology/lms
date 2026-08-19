import { SupabaseClient } from '@supabase/supabase-js';
import { Assignment, Course, LiveClass, AcademicStats, Announcement } from '@/types/student';
import { AssignedCourse, DashboardStats, PendingGrading, UpcomingLecturerClass } from '@/types/lecturer';
import { LiveSession } from '@/types/live-class';
import { formatDate, formatDuration, formatRelativeTime } from '@/lib/format';

const one = <T>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};


function liveStatus(start: string, end?: string | null): 'scheduled' | 'live' | 'completed' {
  const now = Date.now();
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : startMs + 60 * 60 * 1000;

  if (now >= startMs && now <= endMs) return 'live';
  if (now < startMs) return 'scheduled';
  return 'completed';
}

function durationLabel(start?: string | null, end?: string | null, minutes?: number | null) {
  if (minutes) return formatDuration(minutes);
  if (!start || !end) return '60m';
  const diff = Math.max(15, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  return formatDuration(diff);
}

export class CoreReadService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getStudentSectionIds(studentId: string) {
    const { data, error } = await this.supabase
      .from('course_enrollments')
      .select('course_section_id')
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) throw error;
    return (data || []).map((row: any) => row.course_section_id).filter(Boolean);
  }

  async getStudentCourses(studentId: string): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from('course_enrollments')
      .select(`
        id,
        course_section_id,
        course_sections (
          id,
          name,
          courses ( id, title, code, thumbnail_url ),
          semesters ( name )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) throw error;

    return (data || []).map((row: any, index: number) => {
      const section = one(row.course_sections);
      const course = one(section?.courses);
      return {
        id: section?.id || row.course_section_id || row.id,
        title: course?.title || 'Untitled Course',
        code: course?.code,
        instructor: section?.name || one(section?.semesters)?.name || 'Current semester',
        progress: 0,
        thumbnailUrl: course?.thumbnail_url || null,
        imageSeed: course?.code || course?.id || `student-course-${index}`,
        totalChapters: 0,
        completedChapters: 0,
        timeRemaining: 'Start learning',
      };
    });
  }

  async getStudentAssignments(universityId: string, sectionIds: string[]): Promise<Assignment[]> {
    if (sectionIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('assignments')
      .select('id, title, due_date, course_sections ( courses ( code, title ) )')
      .eq('university_id', universityId)
      .eq('is_published', true)
      .in('course_section_id', sectionIds)
      .order('due_date', { ascending: true })
      .limit(5);

    if (error) throw error;

    return (data || []).map((assignment: any) => {
      const course = one(one(assignment.course_sections)?.courses);
      const dueMs = new Date(assignment.due_date).getTime();
      const days = Math.ceil((dueMs - Date.now()) / 86400000);
      return {
        id: assignment.id,
        title: assignment.title,
        course: course?.code || course?.title || 'Course',
        dueDate: days <= 0 ? 'Today' : `${days}d`,
        urgency: days <= 2 ? 'high' : days <= 7 ? 'medium' : 'low',
      };
    });
  }

  async getAnnouncements(universityId: string, sectionIds: string[] = []): Promise<Announcement[]> {
    let query = this.supabase
      .from('announcements')
      .select('id, title, content, created_at, target_scope, course_section_id, course_sections ( courses ( code, title ) )')
      .eq('university_id', universityId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (sectionIds.length > 0) {
      query = query.or(`target_scope.eq.university,course_section_id.in.(${sectionIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((announcement: any) => {
      const course = one(one(announcement.course_sections)?.courses);
      return {
        id: announcement.id,
        title: announcement.title,
        course: course?.code || (announcement.target_scope === 'university' ? 'University' : 'Course'),
        date: formatRelativeTime(announcement.created_at),
        excerpt: announcement.content,
        isUnread: true,
      };
    });
  }

  async getLiveClasses(universityId: string, sectionIds?: string[]): Promise<LiveSession[]> {
    let query = this.supabase
      .from('live_classes')
      .select(`
        id,
        title,
        topic,
        start_time,
        end_time,
        duration,
        status,
        join_url,
        course_section_id,
        course_sections (
          courses ( code, title )
        ),
        lecturer_id,
        profiles:lecturer_id ( first_name, last_name, avatar_url )
      `)
      .eq('university_id', universityId)
      .order('start_time', { ascending: true })
      .limit(20);

    if (sectionIds && sectionIds.length > 0) {
      query = query.in('course_section_id', sectionIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((session: any) => {
      const course = one(one(session.course_sections)?.courses);
      const lecturer = one(session.profiles);
      const lecturerName = [lecturer?.first_name, lecturer?.last_name].filter(Boolean).join(' ') || 'Lecturer';
      const status = session.status === 'cancelled'
        ? 'completed'
        : liveStatus(session.start_time, session.end_time);

      return {
        id: session.id,
        courseCode: course?.code || 'SULVA',
        courseTitle: course?.title || 'Live Class',
        topic: session.topic || session.title,
        lecturerName,
        // Left null when unset; the card renders a generated initials tile.
        lecturerAvatar: lecturer?.avatar_url || undefined,
        status,
        startTime: formatDate(session.start_time),
        duration: durationLabel(session.start_time, session.end_time, session.duration),
        participantsCount: 0,
        meetingLink: session.join_url,
      };
    });
  }

  async getStudentStats(studentId: string, sectionIds: string[]): Promise<AcademicStats> {
    const { count: completedCount } = await this.supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_completed', true);

    const { data: grades } = await this.supabase
      .from('grades')
      .select('score')
      .eq('student_id', studentId)
      .limit(50);

    const average = grades && grades.length > 0
      ? Math.round((grades.reduce((sum: number, grade: any) => sum + Number(grade.score || 0), 0) / grades.length))
      : 0;

    return {
      gpa: average ? Number(Math.min(5, average / 20).toFixed(2)) : 0,
      creditsCompleted: sectionIds.length * 3,
      totalCredits: 120,
      assignmentsDone: completedCount || 0,
      attendanceRate: 0,
      learningStreakDays: completedCount ? 1 : 0,
    };
  }

  async getStudentRegistration(studentId: string, universityId: string) {
    const { data: registrations, error: regError } = await this.supabase
      .from('course_registrations')
      .select(`
        id,
        status,
        semester_id,
        created_at,
        course_registration_items ( course_section_id, status )
      `)
      .eq('student_id', studentId)
      .eq('university_id', universityId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (regError) throw regError;

    const { data: windows, error: windowError } = await this.supabase
      .from('registration_windows')
      .select('id, semester_id, start_date, end_date, min_credits, max_credits')
      .eq('university_id', universityId)
      .order('end_date', { ascending: false });

    if (windowError) throw windowError;

    const now = Date.now();
    const activeWindow = (windows || []).find((window: any) => {
      return new Date(window.start_date).getTime() <= now && new Date(window.end_date).getTime() >= now;
    }) || windows?.[0] || null;

    const semesterId = activeWindow?.semester_id || registrations?.[0]?.semester_id;

    let sections: any[] = [];
    if (semesterId) {
      const { data, error } = await this.supabase
        .from('course_sections')
        .select('id, name, courses ( id, code, title, credits, description )')
        .eq('university_id', universityId)
        .eq('semester_id', semesterId)
        .order('name', { ascending: true });

      if (error) throw error;
      sections = data || [];
    }

    return {
      registration: registrations?.[0] || null,
      window: activeWindow,
      courses: sections.map((section: any) => {
        const course = one(section.courses);
        return {
          id: section.id,
          code: course?.code || 'COURSE',
          title: course?.title || section.name,
          credits: Number(course?.credits || 3),
          description: course?.description || '',
        };
      }),
    };
  }

  async getLecturerCourses(lecturerId: string): Promise<AssignedCourse[]> {
    const { data: assignments, error } = await this.supabase
      .from('course_lecturers')
      .select('course_section_id, course_sections ( id, name, courses ( id, code, title, thumbnail_url ) )')
      .eq('lecturer_id', lecturerId);

    if (error) throw error;

    const sectionIds = (assignments || []).map((row: any) => row.course_section_id);
    const enrollmentCounts = await this.getEnrollmentCounts(sectionIds);
    const nextClasses = await this.getNextClassBySection(sectionIds);

    return (assignments || []).map((row: any, index: number) => {
      const section = one(row.course_sections);
      const course = one(section?.courses);
      return {
        id: section?.id || row.course_section_id,
        courseId: course?.id,
        code: course?.code || 'COURSE',
        title: course?.title || section?.name || 'Assigned Course',
        enrolledStudents: enrollmentCounts[row.course_section_id] || 0,
        nextClassTime: nextClasses[row.course_section_id] ? formatDate(nextClasses[row.course_section_id]) : undefined,
        thumbnailUrl: course?.thumbnail_url || null,
        imageSeed: course?.code || course?.id || `lecturer-course-${index}`,
      };
    });
  }

  async getLecturerDashboard(lecturerId: string, universityId: string) {
    const courses = await this.getLecturerCourses(lecturerId);
    const sectionIds = courses.map((course) => course.id);
    const liveSessions = await this.getLiveClasses(universityId, sectionIds);
    const pendingGrading = await this.getPendingGrading(sectionIds);

    const stats: DashboardStats = {
      totalStudents: courses.reduce((sum, course) => sum + course.enrolledStudents, 0),
      averageAttendance: 0,
      assignmentsToGrade: pendingGrading.reduce((sum, item) => sum + item.submissionsCount, 0),
      unansweredQuestions: 0,
    };

    const upcomingClasses: UpcomingLecturerClass[] = liveSessions
      .filter((session) => session.status !== 'completed')
      .slice(0, 4)
      .map((session) => ({
        id: session.id,
        title: session.topic,
        course: session.courseCode,
        time: session.startTime,
        duration: session.duration,
        studentCount: courses.find((course) => course.code === session.courseCode)?.enrolledStudents || 0,
      }));

    return { stats, courses, upcomingClasses, pendingGrading };
  }

  async getPendingGrading(sectionIds: string[]): Promise<PendingGrading[]> {
    if (sectionIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('assignments')
      .select('id, title, due_date, course_section_id, course_sections ( courses ( code ) ), assignment_submissions ( id, status )')
      .in('course_section_id', sectionIds)
      .order('due_date', { ascending: true })
      .limit(6);

    if (error) throw error;

    return (data || []).map((assignment: any) => {
      const submissions = (assignment.assignment_submissions || []).filter((sub: any) => sub.status === 'submitted');
      const course = one(one(assignment.course_sections)?.courses);
      return {
        id: assignment.id,
        course: course?.code || 'Course',
        assignmentTitle: assignment.title,
        submissionsCount: submissions.length,
        urgency: submissions.length > 10 ? 'high' : submissions.length > 0 ? 'medium' : 'low',
        dueDate: formatDate(assignment.due_date),
      };
    });
  }

  async getAdminUsers(universityId: string, role?: string) {
    let query = this.supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, student_id, created_at')
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAcademicList(universityId: string, table: 'faculties' | 'departments' | 'programs' | 'courses', includeArchived = false) {
    let query = this.supabase
      .from(table)
      .select('*')
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAdminCourseSections(universityId: string) {
    const { data, error } = await this.supabase
      .from('course_sections')
      .select(`
        id,
        name,
        capacity,
        deleted_at,
        created_at,
        course_id,
        semester_id,
        courses ( id, code, title ),
        semesters ( id, name ),
        course_lecturers (
          id,
          is_primary,
          lecturer_id,
          profiles:lecturer_id ( id, first_name, last_name, email )
        )
      `)
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAdminSemesters(universityId: string) {
    const { data, error } = await this.supabase
      .from('semesters')
      .select('id, name, is_active, start_date, end_date')
      .eq('university_id', universityId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAdminRegistrations(universityId: string) {
    const { data, error } = await this.supabase
      .from('course_registrations')
      .select(`
        id,
        status,
        created_at,
        profiles ( first_name, last_name, email, student_id ),
        semesters ( name ),
        course_registration_items ( id, course_section_id, course_sections ( courses ( code, title, credits ) ) )
      `)
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getEnrollmentCounts(sectionIds: string[]) {
    if (sectionIds.length === 0) return {} as Record<string, number>;

    const { data, error } = await this.supabase
      .from('course_enrollments')
      .select('course_section_id')
      .in('course_section_id', sectionIds)
      .eq('status', 'active');

    if (error) throw error;

    return (data || []).reduce((acc: Record<string, number>, row: any) => {
      acc[row.course_section_id] = (acc[row.course_section_id] || 0) + 1;
      return acc;
    }, {});
  }

  private async getNextClassBySection(sectionIds: string[]) {
    if (sectionIds.length === 0) return {} as Record<string, string>;

    const { data, error } = await this.supabase
      .from('live_classes')
      .select('course_section_id, start_time')
      .in('course_section_id', sectionIds)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    return (data || []).reduce((acc: Record<string, string>, row: any) => {
      if (!acc[row.course_section_id]) acc[row.course_section_id] = row.start_time;
      return acc;
    }, {});
  }
}
