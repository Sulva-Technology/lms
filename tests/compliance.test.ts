import { describe, it, expect } from 'vitest';
import { createSupabaseStub } from './helpers/supabase-stub';
import { ComplianceService } from '@/lib/services/compliance.service';

const NOW = new Date('2026-08-18T00:00:00.000Z');
const section = { name: 'Jan', courses: { title: 'Confidentiality', code: 'C-1' } };

function stub() {
  return createSupabaseStub({
    training_assignments: [
      { id: 'a1', university_id: 'uni1', student_id: 'stu1', course_section_id: 'sec1', due_on: '2026-08-01', completed_at: null, cancelled_at: null, profiles: { first_name: 'Ada', last_name: 'Obi' }, course_sections: section },
      { id: 'a2', university_id: 'uni1', student_id: 'stu2', course_section_id: 'sec1', due_on: '2026-08-25', completed_at: null, cancelled_at: null, profiles: { first_name: 'Bola', last_name: 'Eze' }, course_sections: section },
      { id: 'a3', university_id: 'uni1', student_id: 'stu3', course_section_id: 'sec1', due_on: '2026-08-01', completed_at: '2026-07-20T00:00:00Z', cancelled_at: null, profiles: { first_name: 'Chi', last_name: 'Nwo' }, course_sections: section },
      { id: 'a4', university_id: 'uni1', student_id: 'stu4', course_section_id: 'sec1', due_on: '2026-08-01', completed_at: null, cancelled_at: '2026-07-01T00:00:00Z', profiles: { first_name: 'Dee', last_name: 'Ola' }, course_sections: section },
    ],
    certificates: [
      { id: 'c1', university_id: 'uni1', student_id: 'stu5', serial: 'AAAA-BBBB-CCCC', expires_at: '2026-09-10T00:00:00Z', revoked_at: null, snapshot: { studentName: 'Eve Ade', courseTitle: 'Confidentiality' } },
      { id: 'c2', university_id: 'uni1', student_id: 'stu6', serial: 'DDDD-EEEE-FFFF', expires_at: '2027-05-10T00:00:00Z', revoked_at: null, snapshot: { studentName: 'Fay Ojo', courseTitle: 'Confidentiality' } },
      { id: 'c3', university_id: 'uni1', student_id: 'stu7', serial: 'GGGG-HHHH-IIII', expires_at: '2026-09-01T00:00:00Z', revoked_at: '2026-08-01T00:00:00Z', snapshot: { studentName: 'Gus Ibe', courseTitle: 'Confidentiality' } },
      { id: 'c4', university_id: 'uni1', student_id: 'stu8', serial: 'JJJJ-KKKK-LLLL', expires_at: '2026-08-10T00:00:00Z', revoked_at: null, snapshot: { studentName: 'Hal Eze', courseTitle: 'Confidentiality' } },
    ],
  });
}

describe('ComplianceService.getOverview', () => {
  it('counts an assignment past its due date as overdue', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    expect(overview.overdue.map((row) => row.studentId)).toEqual(['stu1']);
    expect(overview.totals.overdue).toBe(1);
  });

  it('separates due soon from overdue', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    expect(overview.dueSoon.map((row) => row.studentId)).toEqual(['stu2']);
  });

  it('excludes completed and cancelled assignments from both', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    const flagged = [...overview.overdue, ...overview.dueSoon].map((row) => row.studentId);
    expect(flagged).not.toContain('stu3');
    expect(flagged).not.toContain('stu4');
    expect(overview.totals.completed).toBe(1);
  });

  it('lists certificates expiring within thirty days, ignoring revoked ones', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    // c2 is too far out, c3 is revoked, c4 already lapsed.
    expect(overview.expiring.map((row) => row.serial)).toEqual(['AAAA-BBBB-CCCC']);
  });

  it('reports a compliance rate over the assignments that still count', async () => {
    const overview = await new ComplianceService(stub().client).getOverview('uni1', NOW);

    // A cancelled assignment is not a failure to comply, so it leaves the
    // denominator: three live assignments, one of them done.
    expect(overview.totals.active).toBe(3);
    expect(overview.totals.compliantPercent).toBe(33);
  });

  it('reports full compliance rather than zero when nothing is assigned', async () => {
    const { client } = createSupabaseStub({ training_assignments: [], certificates: [] });

    const overview = await new ComplianceService(client).getOverview('uni1', NOW);

    expect(overview.totals.compliantPercent).toBe(100);
  });
});
