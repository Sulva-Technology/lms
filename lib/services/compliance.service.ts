import { SupabaseClient } from '@supabase/supabase-js';
import { deriveStatus } from './training-assignment.service';

/** Days ahead to warn about a certificate that is about to lapse. */
export const EXPIRING_WINDOW_DAYS = 30;

export type ComplianceRow = {
  assignmentId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  cohortName: string;
  dueOn: string | null;
  status: string;
};

export type ExpiringRow = {
  certificateId: string;
  studentId: string;
  studentName: string;
  courseTitle: string;
  serial: string;
  expiresAt: string;
};

const one = (value: any) => (Array.isArray(value) ? value[0] : value);

export class ComplianceService {
  constructor(private supabase: SupabaseClient<any>) {}

  async getOverview(universityId: string, now: Date = new Date()) {
    const { data: assignments, error: assignmentError } = await this.supabase
      .from('training_assignments')
      .select('id,student_id,course_section_id,due_on,completed_at,cancelled_at,profiles(first_name,last_name,email),course_sections(name,courses(title,code))')
      .eq('university_id', universityId);
    if (assignmentError) throw assignmentError;

    const rows = (assignments || []).map((row: any) => {
      const profile = one(row.profiles);
      const section = one(row.course_sections);
      const course = one(section?.courses);
      return {
        assignmentId: row.id,
        studentId: row.student_id,
        studentName:
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Learner',
        courseTitle: course?.title || 'Course',
        cohortName: section?.name || '',
        dueOn: row.due_on,
        status: deriveStatus(row, now),
        completed: Boolean(row.completed_at),
        cancelled: Boolean(row.cancelled_at),
      };
    });

    // A withdrawn assignment is not a failure to comply, so it leaves the
    // denominator entirely rather than counting against anyone.
    const live = rows.filter((row) => !row.cancelled);
    const overdue: ComplianceRow[] = live.filter((row) => row.status === 'overdue');
    const dueSoon: ComplianceRow[] = live.filter((row) => row.status === 'due_soon');
    const completed = live.filter((row) => row.completed);

    const { data: certificates, error: certificateError } = await this.supabase
      .from('certificates')
      .select('id,student_id,serial,expires_at,revoked_at,snapshot')
      .eq('university_id', universityId);
    if (certificateError) throw certificateError;

    const horizon = now.getTime() + EXPIRING_WINDOW_DAYS * 86_400_000;
    const expiring: ExpiringRow[] = (certificates || [])
      .filter((row: any) => !row.revoked_at && row.expires_at)
      .filter((row: any) => {
        // Already lapsed is a different problem from about to lapse: the first
        // needs a new assignment, the second needs a nudge.
        const expiresAt = new Date(row.expires_at).getTime();
        return expiresAt > now.getTime() && expiresAt <= horizon;
      })
      .map((row: any) => ({
        certificateId: row.id,
        studentId: row.student_id,
        studentName: row.snapshot?.studentName || 'Learner',
        courseTitle: row.snapshot?.courseTitle || 'Course',
        serial: row.serial,
        expiresAt: row.expires_at,
      }))
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));

    return {
      totals: {
        active: live.length,
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        completed: completed.length,
        expiring: expiring.length,
        // Nothing assigned is full compliance, not zero: an organisation with
        // no required training has not failed at it.
        compliantPercent: live.length === 0 ? 100 : Math.round((completed.length / live.length) * 100),
      },
      overdue,
      dueSoon,
      expiring,
    };
  }
}
