import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createSupabaseStub } from './helpers/supabase-stub';
import { CertificateService, generateSerial } from '@/lib/services/certificate.service';

function stub(options: { passMark?: number | null; completed?: string[]; score?: number | null; validForMonths?: number | null } = {}) {
  const completed = options.completed ?? ['l1', 'l2'];
  return createSupabaseStub({
    course_lecturers: [{ id: 'cl1', course_section_id: 'sec1', lecturer_id: 'lec1' }],
    course_sections: [
      {
        id: 'sec1',
        name: 'Cohort A',
        course_id: 'course1',
        courses: { id: 'course1', title: 'Paralegal Induction', code: 'PL-101', pass_mark: options.passMark ?? null, valid_for_months: options.validForMonths ?? null },
      },
    ],
    lessons: [
      { id: 'l1', is_published: true, course_modules: { course_id: 'course1' } },
      { id: 'l2', is_published: true, course_modules: { course_id: 'course1' } },
      { id: 'l3', is_published: false, course_modules: { course_id: 'course1' } },
    ],
    course_enrollments: [
      { course_section_id: 'sec1', student_id: 'stu1', status: 'active', profiles: { first_name: 'Ada', last_name: 'Obi' } },
    ],
    lesson_progress: completed.map((lessonId) => ({ student_id: 'stu1', lesson_id: lessonId, is_completed: true })),
    student_course_grades:
      options.score === undefined || options.score === null
        ? []
        : [{ student_id: 'stu1', course_section_id: 'sec1', total_weighted_score: options.score }],
    universities: [{ id: 'uni1', name: 'Sulva Law' }],
    certificates: [],
    training_assignments: [
      { id: 'ta1', course_section_id: 'sec1', student_id: 'stu1', completed_at: null, cancelled_at: null },
    ],
  });
}

describe('CertificateService.evaluate', () => {
  it('ignores unpublished lessons when measuring completion', async () => {
    const [candidate] = await new CertificateService(stub().client).evaluate('sec1');

    // Three lessons exist but only two are published.
    expect(candidate.lessonsTotal).toBe(2);
    expect(candidate.lessonsCompleted).toBe(2);
    expect(candidate.eligible).toBe(true);
  });

  it('blocks a learner with lessons outstanding', async () => {
    const [candidate] = await new CertificateService(stub({ completed: ['l1'] }).client).evaluate('sec1');

    expect(candidate.eligible).toBe(false);
    expect(candidate.blockers[0]).toBe('1 of 2 lessons still incomplete');
  });

  it('applies the course pass mark when one is set', async () => {
    const [failing] = await new CertificateService(stub({ passMark: 70, score: 55 }).client).evaluate('sec1');
    expect(failing.eligible).toBe(false);
    expect(failing.blockers[0]).toBe('Score 55% is below the 70% pass mark');

    const [passing] = await new CertificateService(stub({ passMark: 70, score: 82 }).client).evaluate('sec1');
    expect(passing.eligible).toBe(true);
  });

  it('blocks on a missing score only when a pass mark is set', async () => {
    const [noBar] = await new CertificateService(stub({ passMark: null, score: null }).client).evaluate('sec1');
    expect(noBar.eligible).toBe(true);

    const [withBar] = await new CertificateService(stub({ passMark: 50, score: null }).client).evaluate('sec1');
    expect(withBar.blockers).toContain('No final score recorded yet');
  });
});

describe('CertificateService.issue', () => {
  it('refuses to issue to a learner who has not finished', async () => {
    const { client } = stub({ completed: ['l1'] });

    await expect(
      new CertificateService(client).issue({
        universityId: 'uni1',
        courseSectionId: 'sec1',
        studentId: 'stu1',
        issuedBy: 'lec1',
      }),
    ).rejects.toThrow('1 of 2 lessons still incomplete');
  });

  it('refuses a lecturer who does not teach the section', async () => {
    const { client } = createSupabaseStub({ course_lecturers: [] });

    await expect(
      new CertificateService(client).issue({
        universityId: 'uni1',
        courseSectionId: 'sec1',
        studentId: 'stu1',
        issuedBy: 'someone-else',
      }),
    ).rejects.toThrow('Unauthorized: not assigned to this course section');
  });

  it('freezes the names onto the certificate at issue time', async () => {
    const { client, inserted } = stub();

    await new CertificateService(client).issue({
      universityId: 'uni1',
      courseSectionId: 'sec1',
      studentId: 'stu1',
      issuedBy: 'lec1',
    });

    const record = inserted.certificates[0];
    expect(record.snapshot).toMatchObject({
      studentName: 'Ada Obi',
      courseTitle: 'Paralegal Induction',
      courseCode: 'PL-101',
      organisationName: 'Sulva Law',
    });
    expect(record.serial).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});

describe('certificate serials', () => {
  it('avoids characters that are misread off paper', () => {
    const serial = generateSerial(() => 'ffffffffffffffffffffffffffffffff');
    expect(serial).not.toMatch(/[OI01]/);
  });

  it('is unique per section and learner, and never deletable', () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), 'supabase', 'migrations', '035_certificates.sql'),
      'utf8',
    );

    expect(migration).toContain('UNIQUE (course_section_id, student_id)');
    // Revocation is an update; nothing may delete an issued certificate.
    expect(migration).not.toMatch(/certificates[\s\S]*FOR DELETE/);
  });
});

describe('certificate validity', () => {
  it('leaves expiry unset when the course never lapses', async () => {
    const { client, inserted } = stub();

    await new CertificateService(client).issue({
      universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1', issuedBy: 'lec1',
    });

    expect(inserted.certificates[0].expires_at).toBeNull();
  });

  it('dates expiry from the validity period on the course', async () => {
    const { client, inserted } = stub({ validForMonths: 12 });

    await new CertificateService(client).issue({
      universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1', issuedBy: 'lec1',
      now: new Date('2026-08-18T00:00:00.000Z'),
    });

    expect(inserted.certificates[0].expires_at).toBe('2027-08-18T00:00:00.000Z');
  });

  it('lands the anniversary on the same day when months are uneven', async () => {
    const { client, inserted } = stub({ validForMonths: 6 });

    await new CertificateService(client).issue({
      universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1', issuedBy: 'lec1',
      now: new Date('2026-08-31T00:00:00.000Z'),
    });

    // 31 August plus six months has no 31 February; Date.UTC rolls it forward
    // rather than silently clamping to a shorter month.
    expect(inserted.certificates[0].expires_at).toBe('2027-03-03T00:00:00.000Z');
  });

  it('reports an expired certificate as expired, not valid', async () => {
    const { client } = createSupabaseStub({
      certificates: [{
        serial: 'ABCD-EFGH-JKLM', issued_at: '2025-01-01T00:00:00Z',
        expires_at: '2026-01-01T00:00:00Z', revoked_at: null,
        lessons_completed: 2, lessons_total: 2, final_score: 90, snapshot: {},
      }],
    });

    const result = await new CertificateService(client).verify('ABCD-EFGH-JKLM', new Date('2026-08-18T00:00:00Z'));

    expect(result.found).toBe(true);
    expect(result.status).toBe('expired');
    expect(result.valid).toBe(false);
  });

  it('reports revoked ahead of expired when both are true', async () => {
    const { client } = createSupabaseStub({
      certificates: [{
        serial: 'ABCD-EFGH-JKLM', issued_at: '2025-01-01T00:00:00Z',
        expires_at: '2026-01-01T00:00:00Z', revoked_at: '2025-06-01T00:00:00Z',
        revoked_reason: 'Issued in error', lessons_completed: 2, lessons_total: 2, final_score: 90, snapshot: {},
      }],
    });

    const result = await new CertificateService(client).verify('ABCD-EFGH-JKLM', new Date('2026-08-18T00:00:00Z'));

    expect(result.status).toBe('revoked');
  });

  it('closes the assignment the certificate was issued for', async () => {
    const { client, updated } = stub();

    await new CertificateService(client).issue({
      universityId: 'uni1', courseSectionId: 'sec1', studentId: 'stu1', issuedBy: 'lec1',
    });

    expect(updated.training_assignments?.[0]?.completed_at).toBeTruthy();
  });
});
