import { SupabaseClient } from '@supabase/supabase-js';
import type { TenantMode } from '@/lib/tenant/mode';

export type BootstrapNames = {
  facultyName: string;
  departmentName: string;
  sessionName: string;
  semesterName: string;
};

export type BootstrapResult = {
  /** False when the tenant already had a structure, or needs none at all. */
  created: boolean;
  facultyId: string | null;
  departmentId: string | null;
  academicSessionId: string | null;
  semesterId: string | null;
};

const slugCode = (value: string, fallback: string) => {
  const code = value.replace(/[^a-zA-Z0-9]+/g, '').slice(0, 8).toUpperCase();
  return code || fallback;
};

export const defaultBootstrapNames = (now = new Date()): BootstrapNames => ({
  facultyName: 'Training',
  departmentName: 'General',
  sessionName: String(now.getUTCFullYear()),
  semesterName: `${now.getUTCFullYear()} Term 1`,
});

/**
 * Gives a fresh tenant the academic chain every course depends on.
 *
 * `courses.department_id` and `course_sections.semester_id` are both NOT NULL,
 * so a new organisation cannot publish anything until a faculty, department,
 * session and semester exist. Organisations that do not think in faculties and
 * semesters should never have to assemble that by hand, so this creates one
 * sensible default of each.
 *
 * Idempotent: a tenant that already has a department keeps what it has.
 */
export async function bootstrapAcademicStructure(
  client: SupabaseClient<any>,
  universityId: string,
  options: Partial<BootstrapNames> & { now?: Date; mode?: TenantMode } = {},
): Promise<BootstrapResult> {
  // A training tenant needs none of this: courses attach straight to the tenant
  // and cohorts carry their own dates. Creating a "Training" faculty holding a
  // "General" department was a costume, not a structure.
  if (options.mode === 'training') {
    return { created: false, facultyId: null, departmentId: null, academicSessionId: null, semesterId: null };
  }

  const names = { ...defaultBootstrapNames(options.now), ...options };

  const { data: existingDepartment } = await client
    .from('departments')
    .select('id, faculty_id')
    .eq('university_id', universityId)
    .limit(1)
    .maybeSingle();

  const { data: existingSemester } = await client
    .from('semesters')
    .select('id, academic_session_id')
    .eq('university_id', universityId)
    .limit(1)
    .maybeSingle();

  if (existingDepartment && existingSemester) {
    return {
      created: false,
      facultyId: existingDepartment.faculty_id,
      departmentId: existingDepartment.id,
      academicSessionId: existingSemester.academic_session_id,
      semesterId: existingSemester.id,
    };
  }

  let facultyId = existingDepartment?.faculty_id as string | undefined;
  let departmentId = existingDepartment?.id as string | undefined;

  if (!departmentId) {
    const { data: faculty, error: facultyError } = await client
      .from('faculties')
      .insert({
        university_id: universityId,
        name: names.facultyName,
        code: slugCode(names.facultyName, 'TRN'),
      })
      .select('id')
      .single();
    if (facultyError) throw new Error(`Could not create the default faculty: ${facultyError.message}`);
    facultyId = faculty.id;

    const { data: department, error: departmentError } = await client
      .from('departments')
      .insert({
        university_id: universityId,
        faculty_id: facultyId,
        name: names.departmentName,
        code: slugCode(names.departmentName, 'GEN'),
      })
      .select('id')
      .single();
    if (departmentError) throw new Error(`Could not create the default department: ${departmentError.message}`);
    departmentId = department.id;
  }

  let academicSessionId = existingSemester?.academic_session_id as string | undefined;
  let semesterId = existingSemester?.id as string | undefined;

  if (!semesterId) {
    const reference = options.now ?? new Date();
    const year = reference.getUTCFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: session, error: sessionError } = await client
      .from('academic_sessions')
      .insert({
        university_id: universityId,
        name: names.sessionName,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      })
      .select('id')
      .single();
    if (sessionError) throw new Error(`Could not create the default session: ${sessionError.message}`);
    academicSessionId = session.id;

    const { data: semester, error: semesterError } = await client
      .from('semesters')
      .insert({
        university_id: universityId,
        academic_session_id: academicSessionId,
        name: names.semesterName,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      })
      .select('id')
      .single();
    if (semesterError) throw new Error(`Could not create the default term: ${semesterError.message}`);
    semesterId = semester.id;
  }

  return {
    created: true,
    facultyId: facultyId ?? null,
    departmentId: departmentId ?? null,
    academicSessionId: academicSessionId ?? null,
    semesterId: semesterId ?? null,
  };
}
