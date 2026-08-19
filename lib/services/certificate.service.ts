import { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

export type CertificateStatus = 'valid' | 'expired' | 'revoked';

/** What a public lookup can conclude, including that it could not conclude. */
export type VerificationStatus = CertificateStatus | 'missing' | 'unavailable';

export type Eligibility = {
  studentId: string;
  studentName: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  finalScore: number | null;
  passMark: number | null;
  eligible: boolean;
  /** Why not, in words a trainer can act on. Empty when eligible. */
  blockers: string[];
};

/** Unambiguous alphabet: no O/0, I/1, so a serial read off paper is typable. */
const SERIAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateSerial(random: () => string = randomUUID): string {
  const source = random().replace(/-/g, '').toUpperCase();
  let serial = '';
  for (let index = 0; index < 12; index += 1) {
    const byte = parseInt(source.slice(index * 2, index * 2 + 2) || '0', 16);
    serial += SERIAL_ALPHABET[byte % SERIAL_ALPHABET.length];
  }
  return `${serial.slice(0, 4)}-${serial.slice(4, 8)}-${serial.slice(8, 12)}`;
}

export class CertificateService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async requireCourseStaff(courseSectionId: string, userId: string) {
    const { data } = await this.supabase
      .from('course_lecturers')
      .select('id')
      .eq('course_section_id', courseSectionId)
      .eq('lecturer_id', userId)
      .maybeSingle();
    if (!data) throw new Error('Unauthorized: not assigned to this course section');
  }

  /**
   * Completion is measured against published lessons only: unpublished drafts a
   * learner never saw must not hold a certificate back. A pass mark on the
   * course adds a grade bar on top.
   */
  async evaluate(courseSectionId: string): Promise<Eligibility[]> {
    const { data: section, error: sectionError } = await this.supabase
      .from('course_sections')
      .select('id, course_id, courses(id, title, code, pass_mark, valid_for_months)')
      .eq('id', courseSectionId)
      .single();
    if (sectionError) throw sectionError;

    const course: any = Array.isArray(section.courses) ? section.courses[0] : section.courses;
    const passMark: number | null = course?.pass_mark ?? null;

    const { data: lessons } = await this.supabase
      .from('lessons')
      .select('id, course_modules!inner(course_id)')
      .eq('course_modules.course_id', section.course_id)
      .eq('is_published', true);

    const lessonIds = (lessons || []).map((lesson: any) => lesson.id);
    const lessonsTotal = lessonIds.length;

    const { data: enrolled } = await this.supabase
      .from('course_enrollments')
      .select('student_id, profiles(first_name, last_name, email)')
      .eq('course_section_id', courseSectionId)
      .eq('status', 'active');

    const { data: progress } = await this.supabase
      .from('lesson_progress')
      .select('student_id, lesson_id, is_completed')
      .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']);

    const completedByStudent = new Map<string, Set<string>>();
    for (const row of progress || []) {
      if (!row.is_completed) continue;
      const set = completedByStudent.get(row.student_id) || new Set<string>();
      set.add(row.lesson_id);
      completedByStudent.set(row.student_id, set);
    }

    const { data: grades } = await this.supabase
      .from('student_course_grades')
      .select('student_id, total_weighted_score')
      .eq('course_section_id', courseSectionId);

    const scoreByStudent = new Map<string, number>();
    for (const row of grades || []) {
      if (row.total_weighted_score !== null && row.total_weighted_score !== undefined) {
        scoreByStudent.set(row.student_id, Math.round(Number(row.total_weighted_score) * 100) / 100);
      }
    }

    return (enrolled || []).map((enrollment: any) => {
      const profile = Array.isArray(enrollment.profiles) ? enrollment.profiles[0] : enrollment.profiles;
      const lessonsCompleted = completedByStudent.get(enrollment.student_id)?.size ?? 0;
      const finalScore = scoreByStudent.has(enrollment.student_id)
        ? scoreByStudent.get(enrollment.student_id)!
        : null;

      const blockers: string[] = [];
      if (lessonsTotal === 0) {
        blockers.push('This course has no published lessons yet');
      } else if (lessonsCompleted < lessonsTotal) {
        blockers.push(`${lessonsTotal - lessonsCompleted} of ${lessonsTotal} lessons still incomplete`);
      }
      if (passMark !== null) {
        if (finalScore === null) blockers.push('No final score recorded yet');
        else if (finalScore < passMark) blockers.push(`Score ${finalScore}% is below the ${passMark}% pass mark`);
      }

      return {
        studentId: enrollment.student_id,
        studentName:
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Student',
        lessonsCompleted,
        lessonsTotal,
        finalScore,
        passMark,
        eligible: blockers.length === 0,
        blockers,
      };
    });
  }

  async issue(params: {
    universityId: string;
    courseSectionId: string;
    studentId: string;
    issuedBy: string;
    /** Injectable clock so expiry is testable. */
    now?: Date;
  }) {
    await this.requireCourseStaff(params.courseSectionId, params.issuedBy);

    const eligibility = (await this.evaluate(params.courseSectionId)).find(
      (entry) => entry.studentId === params.studentId,
    );

    if (!eligibility) throw new Error('That learner is not actively enrolled in this section');
    if (!eligibility.eligible) throw new Error(eligibility.blockers.join('; '));

    const { data: section, error: sectionError } = await this.supabase
      .from('course_sections')
      .select('id, name, course_id, courses(title, code, valid_for_months)')
      .eq('id', params.courseSectionId)
      .single();
    if (sectionError) throw sectionError;

    const course: any = Array.isArray(section.courses) ? section.courses[0] : section.courses;

    // A course with a validity period issues certificates that lapse. Month
    // arithmetic goes through Date.UTC so the anniversary lands on the same
    // calendar day rather than drifting by the length of the months crossed.
    const validForMonths: number | null = course?.valid_for_months ?? null;
    const issuedAt = params.now ?? new Date();
    const expiresAt = validForMonths
      ? new Date(
          Date.UTC(
            issuedAt.getUTCFullYear(),
            issuedAt.getUTCMonth() + validForMonths,
            issuedAt.getUTCDate(),
            issuedAt.getUTCHours(),
            issuedAt.getUTCMinutes(),
            issuedAt.getUTCSeconds(),
            issuedAt.getUTCMilliseconds(),
          ),
        ).toISOString()
      : null;

    const { data: organisation } = await this.supabase
      .from('universities')
      .select('name')
      .eq('id', params.universityId)
      .maybeSingle();

    const { data, error } = await this.supabase
      .from('certificates')
      .insert({
        university_id: params.universityId,
        course_id: section.course_id,
        course_section_id: params.courseSectionId,
        student_id: params.studentId,
        serial: generateSerial(),
        issued_by: params.issuedBy,
        lessons_completed: eligibility.lessonsCompleted,
        lessons_total: eligibility.lessonsTotal,
        final_score: eligibility.finalScore,
        expires_at: expiresAt,
        snapshot: {
          studentName: eligibility.studentName,
          courseTitle: course?.title || 'Course',
          courseCode: course?.code || '',
          sectionName: section.name,
          organisationName: organisation?.name || '',
        },
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('This learner already holds a certificate for this section');
      throw error;
    }

    // The certificate is the proof the assignment was asking for, so close it.
    // An assignment left open is a reporting wrinkle; a lost certificate is not,
    // which is why this never throws.
    try {
      await this.supabase
        .from('training_assignments')
        .update({ completed_at: new Date().toISOString() })
        .eq('course_section_id', params.courseSectionId)
        .eq('student_id', params.studentId)
        .is('completed_at', null);
    } catch {
      // Deliberately ignored.
    }

    return data;
  }

  async revoke(certificateId: string, userId: string, reason: string) {
    const { data: certificate, error: readError } = await this.supabase
      .from('certificates')
      .select('id, course_section_id')
      .eq('id', certificateId)
      .single();
    if (readError) throw readError;

    await this.requireCourseStaff(certificate.course_section_id, userId);

    const { error } = await this.supabase
      .from('certificates')
      .update({ revoked_at: new Date().toISOString(), revoked_reason: reason })
      .eq('id', certificateId);
    if (error) throw error;

    return { revoked: true };
  }

  /**
   * Public lookup by serial. Reads through whichever client it is given: the
   * verification page passes a service-role client, because the person checking
   * a certificate is a stranger with no account.
   */
  async verify(serial: string, now: Date = new Date()) {
    const { data, error } = await this.supabase
      .from('certificates')
      .select('serial, issued_at, expires_at, revoked_at, revoked_reason, lessons_completed, lessons_total, final_score, snapshot')
      .eq('serial', serial.trim().toUpperCase())
      .maybeSingle();

    // A failed lookup is not an unknown serial. Reporting one as the other told
    // whoever was checking that a real certificate does not exist, and hid a
    // missing column or a permissions fault behind a polite page.
    if (error) {
      console.error('Certificate lookup failed:', error);
      return { found: false as const, status: 'unavailable' as const, error: error.message };
    }

    if (!data) return { found: false as const, status: 'missing' as const };

    // Revocation outranks expiry: a certificate withdrawn for cause should not
    // read as though it merely lapsed.
    const status: CertificateStatus = data.revoked_at
      ? 'revoked'
      : data.expires_at && new Date(data.expires_at).getTime() <= now.getTime()
        ? 'expired'
        : 'valid';

    return {
      found: true as const,
      status,
      valid: status === 'valid',
      certificate: data,
    };
  }
}
