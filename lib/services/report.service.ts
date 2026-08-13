import { SupabaseClient } from '@supabase/supabase-js';

export class ReportService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getCourseProgress(universityId: string, courseId: string) {
    // How many lessons completed by students
    const { data } = await this.supabase.from('lesson_progress')
        .select('is_completed, lessons!inner(course_modules!inner(course_id))')
        .eq('university_id', universityId)
        .eq('lessons.course_modules.course_id', courseId as any);

    const totalStats = { completed: 0, total_tracked: 0 };
    (data || []).forEach(d => {
        totalStats.total_tracked++;
        if (d.is_completed) totalStats.completed++;
    });

    return {
        completionRate: totalStats.total_tracked > 0 ? (totalStats.completed / totalStats.total_tracked) * 100 : 0,
        totalTrackedEvents: totalStats.total_tracked
    };
  }

  async getUniversityOverview(universityId: string) {
    // Top level counts
    const [{ count: studentCount }, { count: courseCount }, { count: videoCount }] = await Promise.all([
      this.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('university_id', universityId).eq('role', 'student'),
      this.supabase.from('courses').select('id', { count: 'exact', head: true }).eq('university_id', universityId),
      this.supabase.from('video_assets').select('id', { count: 'exact', head: true }).eq('university_id', universityId)
    ]);

    return {
        studentCount: studentCount || 0,
        courseCount: courseCount || 0,
        videoCount: videoCount || 0
    };
  }
}
