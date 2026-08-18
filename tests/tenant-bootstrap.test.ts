import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { bootstrapAcademicStructure, defaultBootstrapNames } from '@/lib/services/tenant-bootstrap';
import { labelsFor, translateLabel } from '@/lib/ui/labels';
import { getNavigationForRole } from '@/lib/navigation';

describe('bootstrapAcademicStructure', () => {
  it('creates the whole chain a course depends on', async () => {
    const { client, inserted } = createSupabaseStub({
      faculties: [], departments: [], academic_sessions: [], semesters: [],
    });

    const result = await bootstrapAcademicStructure(client, 'uni1', { now: new Date('2026-03-04T00:00:00Z') });

    expect(result.created).toBe(true);
    expect(inserted.faculties).toHaveLength(1);
    expect(inserted.departments).toHaveLength(1);
    expect(inserted.academic_sessions).toHaveLength(1);
    expect(inserted.semesters).toHaveLength(1);
    // courses.department_id and course_sections.semester_id are both NOT NULL,
    // so both ends of the chain have to exist.
    expect(inserted.departments[0].faculty_id).toBe(inserted.faculties[0].id);
    expect(inserted.semesters[0].academic_session_id).toBe(inserted.academic_sessions[0].id);
  });

  it('dates the default session to the reference year', async () => {
    const { client, inserted } = createSupabaseStub({ faculties: [], departments: [], academic_sessions: [], semesters: [] });

    await bootstrapAcademicStructure(client, 'uni1', { now: new Date('2026-03-04T00:00:00Z') });

    expect(inserted.academic_sessions[0]).toMatchObject({ start_date: '2026-01-01', end_date: '2026-12-31' });
    expect(defaultBootstrapNames(new Date('2026-03-04T00:00:00Z')).sessionName).toBe('2026');
  });

  it('writes nothing when the tenant already has a structure', async () => {
    const { client, inserted } = createSupabaseStub({
      departments: [{ id: 'dep1', university_id: 'uni1', faculty_id: 'fac1' }],
      semesters: [{ id: 'sem1', university_id: 'uni1', academic_session_id: 'ses1' }],
    });

    const result = await bootstrapAcademicStructure(client, 'uni1');

    expect(result).toMatchObject({ created: false, departmentId: 'dep1', semesterId: 'sem1' });
    expect(inserted.faculties).toBeUndefined();
    expect(inserted.semesters).toBeUndefined();
  });

  it('accepts names an organisation would actually use', async () => {
    const { client, inserted } = createSupabaseStub({ faculties: [], departments: [], academic_sessions: [], semesters: [] });

    await bootstrapAcademicStructure(client, 'uni1', {
      facultyName: 'Legal Practice',
      departmentName: 'Paralegals',
      semesterName: 'Intake 1',
    });

    expect(inserted.faculties[0].name).toBe('Legal Practice');
    expect(inserted.departments[0].name).toBe('Paralegals');
    expect(inserted.semesters[0].name).toBe('Intake 1');
  });
});

describe('tenant vocabulary', () => {
  it('renames the academic words an organisation does not use', () => {
    expect(translateLabel('Lecturers', 'organization')).toBe('Trainers');
    expect(translateLabel('Course Registration', 'organization')).toBe('Programme Enrolment');
    expect(translateLabel('Live Classes', 'organization')).toBe('Live Sessions');
  });

  it('leaves academic tenants untouched', () => {
    expect(translateLabel('Lecturers', 'academic')).toBe('Lecturers');
    expect(labelsFor('academic').learner).toBe('Student');
  });

  it('renames navigation labels without touching the routes', () => {
    const academic = getNavigationForRole('lecturer');
    const corporate = getNavigationForRole('lecturer', 'organization');

    expect(corporate.map((item) => item.href)).toEqual(academic.map((item) => item.href));
    expect(academic.find((item) => item.href === '/lecturer/live-classes')?.label).toBe('Live Classes');
    expect(corporate.find((item) => item.href === '/lecturer/live-classes')?.label).toBe('Live Sessions');
  });
});
