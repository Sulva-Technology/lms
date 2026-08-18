/**
 * Tenant vocabulary.
 *
 * The data model is academic — universities, faculties, semesters, lecturers —
 * because that is what it was built for. An organisation running internal
 * training uses the same structures under different names, so the words are
 * chosen per tenant rather than baked into the pages.
 *
 * Column and route names are unchanged; only what a person reads is swapped.
 */
export type Vocabulary = 'academic' | 'organization';

export type LabelSet = {
  tenant: string;
  tenantPlural: string;
  instructor: string;
  instructorPlural: string;
  learner: string;
  learnerPlural: string;
  course: string;
  coursePlural: string;
  faculty: string;
  facultyPlural: string;
  department: string;
  departmentPlural: string;
  program: string;
  programPlural: string;
  term: string;
  termPlural: string;
  enrollment: string;
  registration: string;
  liveClass: string;
  liveClassPlural: string;
  learnerIdentifier: string;
};

const academic: LabelSet = {
  tenant: 'University',
  tenantPlural: 'Universities',
  instructor: 'Lecturer',
  instructorPlural: 'Lecturers',
  learner: 'Student',
  learnerPlural: 'Students',
  course: 'Course',
  coursePlural: 'Courses',
  faculty: 'Faculty',
  facultyPlural: 'Faculties',
  department: 'Department',
  departmentPlural: 'Departments',
  program: 'Programme',
  programPlural: 'Programmes',
  term: 'Semester',
  termPlural: 'Semesters',
  enrollment: 'Enrollment',
  registration: 'Course Registration',
  liveClass: 'Live Class',
  liveClassPlural: 'Live Classes',
  learnerIdentifier: 'Matric number',
};

const organization: LabelSet = {
  tenant: 'Organization',
  tenantPlural: 'Organizations',
  instructor: 'Trainer',
  instructorPlural: 'Trainers',
  learner: 'Trainee',
  learnerPlural: 'Trainees',
  course: 'Programme',
  coursePlural: 'Programmes',
  faculty: 'Division',
  facultyPlural: 'Divisions',
  department: 'Team',
  departmentPlural: 'Teams',
  program: 'Learning Track',
  programPlural: 'Learning Tracks',
  term: 'Cohort',
  termPlural: 'Cohorts',
  enrollment: 'Assignment',
  registration: 'Programme Enrolment',
  liveClass: 'Live Session',
  liveClassPlural: 'Live Sessions',
  learnerIdentifier: 'Staff ID',
};

const sets: Record<Vocabulary, LabelSet> = { academic, organization };

export const VOCABULARIES: Vocabulary[] = ['academic', 'organization'];

export const isVocabulary = (value: unknown): value is Vocabulary =>
  value === 'academic' || value === 'organization';

export const labelsFor = (vocabulary: Vocabulary = 'academic'): LabelSet => sets[vocabulary] ?? academic;

/** Rewrites a label written in academic wording into the tenant's vocabulary. */
export function translateLabel(label: string, vocabulary: Vocabulary): string {
  if (vocabulary === 'academic') return label;
  const target = labelsFor(vocabulary);

  const swaps: Array<[RegExp, string]> = [
    [/\bLecturers\b/g, target.instructorPlural],
    [/\bLecturer\b/g, target.instructor],
    [/\bStudents\b/g, target.learnerPlural],
    [/\bStudent\b/g, target.learner],
    [/\bUniversities\b/g, target.tenantPlural],
    [/\bUniversity\b/g, target.tenant],
    [/\bFaculties\b/g, target.facultyPlural],
    [/\bFaculty\b/g, target.faculty],
    [/\bDepartments\b/g, target.departmentPlural],
    [/\bDepartment\b/g, target.department],
    [/\bSemesters\b/g, target.termPlural],
    [/\bSemester\b/g, target.term],
    [/\bLive Classes\b/g, target.liveClassPlural],
    [/\bLive Class\b/g, target.liveClass],
    [/\bCourse Registration\b/g, target.registration],
  ];

  return swaps.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), label);
}
