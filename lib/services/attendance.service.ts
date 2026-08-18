import { SupabaseClient } from '@supabase/supabase-js';
import { AttendanceChange, AttendanceStatus, MarkAttendancePayload } from '@/types/attendance';

export class AttendanceService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async checkLecturerAccess(sectionId: string, lecturerId: string) {
    const { data } = await this.supabase.from('course_lecturers')
      .select('id')
      .eq('course_section_id', sectionId)
      .eq('lecturer_id', lecturerId)
      .single();
    if (!data) throw new Error('Unauthorized: Lecturer not assigned to this course section');
  }

  async markAttendance(universityId: string, lecturerId: string, payload: MarkAttendancePayload) {
    await this.checkLecturerAccess(payload.courseSectionId, lecturerId);

    const period = payload.period ?? 1;

    // Upserting rather than reading first: two staff marking the same register
    // at once would otherwise race and one would hit a duplicate key error.
    const { data: session, error: sessErr } = await this.supabase
      .from('attendance_sessions')
      .upsert({
        university_id: universityId,
        course_section_id: payload.courseSectionId,
        live_class_id: payload.liveClassId || null,
        date: payload.date,
        period,
        title: payload.title,
      }, { onConflict: 'course_section_id,date,period' })
      .select()
      .single();

    if (sessErr) throw sessErr;
    const sessionId = session.id;

    const records = payload.records.map(r => ({
      university_id: universityId,
      session_id: sessionId,
      course_section_id: payload.courseSectionId,
      student_id: r.studentId,
      record_date: payload.date,
      status: r.status,
      notes: r.notes?.trim() ? r.notes.trim() : null,
      created_by: lecturerId,
      updated_by: lecturerId,
    }));

    const { error: recErr } = await this.supabase.from('attendance_records')
      .upsert(records, { onConflict: 'session_id,student_id' });

    if (recErr) throw recErr;

    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: lecturerId,
      action: 'ATTENDANCE_MARKED',
      entity_type: 'attendance_sessions',
      entity_id: sessionId
    });

    return { sessionId, period, count: records.length };
  }

  /**
   * The period a live class register belongs to. A live class already tied to a
   * session keeps its period; otherwise it takes the next free slot that day, so
   * two live classes on one date no longer overwrite each other.
   */
  private async resolvePeriodForLiveClass(courseSectionId: string, date: string, liveClassId: string) {
    const { data: existing } = await this.supabase
      .from('attendance_sessions')
      .select('period')
      .eq('live_class_id', liveClassId)
      .maybeSingle();

    if (existing) return existing.period ?? 1;

    const { data: sameDay } = await this.supabase
      .from('attendance_sessions')
      .select('period')
      .eq('course_section_id', courseSectionId)
      .eq('date', date)
      .order('period', { ascending: false })
      .limit(1);

    const highest = sameDay?.[0]?.period ?? 0;
    return Math.min(highest + 1, 20);
  }

  async calculateFromLiveClass(universityId: string, lecturerId: string, liveClassId: string) {
    const { data: lc } = await this.supabase.from('live_classes')
        .select('course_section_id, start_time, topic, duration, tracking_rule, attendance_threshold_percent')
        .eq('id', liveClassId)
        .single();

    if (!lc) throw new Error('Live class not found');
    await this.checkLecturerAccess(lc.course_section_id, lecturerId);

    const { data: participants } = await this.supabase.from('live_class_participants')
        .select('student_id, total_seconds')
        .eq('live_class_id', liveClassId)
        .not('student_id', 'is', null);

    const { data: enrolled } = await this.supabase.from('course_enrollments')
        .select('student_id')
        .eq('course_section_id', lc.course_section_id)
        .eq('status', 'active');

    const attendedSeconds = new Map<string, number>();
    for (const participant of participants || []) {
      attendedSeconds.set(participant.student_id, participant.total_seconds ?? 0);
    }

    const durationRule = lc.tracking_rule === 'duration';
    const scheduledSeconds = Math.max(1, (lc.duration ?? 60) * 60);
    const thresholdPercent = lc.attendance_threshold_percent ?? 75;
    const presentSeconds = (scheduledSeconds * thresholdPercent) / 100;

    const records = (enrolled || []).map(e => {
      const joined = attendedSeconds.has(e.student_id);

      if (!durationRule) {
        return {
          studentId: e.student_id,
          status: (joined ? 'present' : 'absent') as AttendanceStatus,
          notes: joined ? 'Joined the live class' : 'No live class join recorded',
        };
      }

      const seconds = attendedSeconds.get(e.student_id) ?? 0;
      const minutes = Math.round(seconds / 60);
      const status: AttendanceStatus =
        seconds >= presentSeconds ? 'present' : seconds >= presentSeconds / 2 ? 'late' : 'absent';

      return {
        studentId: e.student_id,
        status,
        notes: joined
          ? `Present for ${minutes} of ${Math.round(scheduledSeconds / 60)} scheduled minutes`
          : 'No live class join recorded',
      };
    });

    const date = new Date(lc.start_time).toISOString().split('T')[0];
    const period = await this.resolvePeriodForLiveClass(lc.course_section_id, date, liveClassId);

    return this.markAttendance(universityId, lecturerId, {
        courseSectionId: lc.course_section_id,
        date,
        period,
        title: `Attendance: ${lc.topic}`,
        liveClassId,
        records
    });
  }

  /** Every status or note change on a register, newest first. */
  async getSessionHistory(sessionId: string, lecturerId: string): Promise<AttendanceChange[]> {
    const { data: session, error: sessionError } = await this.supabase
      .from('attendance_sessions')
      .select('course_section_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;
    await this.checkLecturerAccess(session.course_section_id, lecturerId);

    const { data, error } = await this.supabase
      .from('attendance_record_changes')
      .select('id,student_id,previous_status,new_status,previous_notes,new_notes,changed_by,changed_at,profiles:changed_by(first_name,last_name,email)')
      .eq('session_id', sessionId)
      .order('changed_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return (data || []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
      return {
        id: row.id,
        studentId: row.student_id,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        previousNotes: row.previous_notes,
        newNotes: row.new_notes,
        changedBy: row.changed_by,
        changedByName: name || profile?.email || 'Unknown',
        changedAt: row.changed_at,
      };
    });
  }

  /**
   * Attendance rate per student for the given sections, lowest first.
   * `present` and `late` both count as attended, matching the student view.
   */
  async getAttendanceRates(sectionIds: string[], thresholdPercent = 75) {
    if (sectionIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('attendance_records')
      .select('student_id,status,course_section_id,profiles(first_name,last_name,email,student_id)')
      .in('course_section_id', sectionIds);

    if (error) throw error;

    const totals = new Map<
      string,
      { studentId: string; sectionId: string; name: string; identifier: string; attended: number; total: number }
    >();

    for (const row of data || []) {
      const key = `${row.course_section_id}:${row.student_id}`;
      const profile: any = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const entry = totals.get(key) || {
        studentId: row.student_id,
        sectionId: row.course_section_id,
        name:
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Student',
        identifier: profile?.student_id || profile?.email || '',
        attended: 0,
        total: 0,
      };

      entry.total += 1;
      if (row.status === 'present' || row.status === 'late') entry.attended += 1;
      totals.set(key, entry);
    }

    return [...totals.values()]
      .map((entry) => {
        const rate = entry.total === 0 ? 0 : Math.round((entry.attended / entry.total) * 100);
        return { ...entry, rate, belowThreshold: rate < thresholdPercent };
      })
      .sort((a, b) => a.rate - b.rate);
  }
}
