import { SupabaseClient } from '@supabase/supabase-js';
import { MarkAttendancePayload } from '@/types/attendance';

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

    // 1. Upsert session
    let sessionId: string;
    
    // Check if session exists for this date/section
    const { data: existingSession } = await this.supabase.from('attendance_sessions')
      .select('id')
      .eq('course_section_id', payload.courseSectionId)
      .eq('date', payload.date)
      .single();
      
    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessErr } = await this.supabase.from('attendance_sessions').insert({
        university_id: universityId,
        course_section_id: payload.courseSectionId,
        live_class_id: payload.liveClassId || null,
        date: payload.date,
        title: payload.title
      }).select().single();
      
      if (sessErr) throw sessErr;
      sessionId = newSession.id;
    }

    // 2. Upsert records
    const records = payload.records.map(r => ({
      university_id: universityId,
      session_id: sessionId,
      course_section_id: payload.courseSectionId,
      student_id: r.studentId,
      record_date: payload.date,
      status: r.status,
      created_by: lecturerId
    }));

    const { error: recErr } = await this.supabase.from('attendance_records')
      .upsert(records, { onConflict: 'session_id,student_id' });
      
    if (recErr) throw recErr;

    // 3. Audit log
    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: lecturerId,
      action: 'ATTENDANCE_MARKED',
      entity_type: 'attendance_sessions',
      entity_id: sessionId
    });

    return { sessionId, count: records.length };
  }

  async calculateFromLiveClass(universityId: string, lecturerId: string, liveClassId: string) {
    // Basic calculation: anyone in live_class_participants gets 'present', 
    // enrolled students not in participants get 'absent'.
    
    const { data: lc } = await this.supabase.from('live_classes')
        .select('course_section_id, start_time, topic')
        .eq('id', liveClassId)
        .single();
        
    if (!lc) throw new Error('Live class not found');
    await this.checkLecturerAccess(lc.course_section_id, lecturerId);

    const { data: participants } = await this.supabase.from('live_class_participants')
        .select('student_id')
        .eq('live_class_id', liveClassId)
        .not('student_id', 'is', null);

    const { data: enrolled } = await this.supabase.from('course_enrollments')
        .select('student_id')
        .eq('course_section_id', lc.course_section_id)
        .eq('status', 'active');

    const participantSet = new Set((participants || []).map(p => p.student_id));
    const records = (enrolled || []).map(e => ({
        studentId: e.student_id,
        status: (participantSet.has(e.student_id) ? 'present' : 'absent') as 'present' | 'absent'
    }));

    return this.markAttendance(universityId, lecturerId, {
        courseSectionId: lc.course_section_id,
        date: new Date(lc.start_time).toISOString().split('T')[0],
        title: `Attendance: ${lc.topic}`,
        liveClassId,
        records
    });
  }
}
