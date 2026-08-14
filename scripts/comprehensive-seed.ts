import { adminClient } from './lib/clients';

const admin = adminClient();

async function seed() {
  console.log("--- Starting Comprehensive Seed ---");

  // 1. Get the REAL University ID for vui.edu
  const { data: uni, error: uniFetchError } = await admin
    .from('universities')
    .select('id')
    .eq('domain', 'vui.edu')
    .single();

  if (uniFetchError || !uni) {
    console.error("Could not find university vui.edu. Please ensure it exists.");
    return;
  }

  const REAL_UNI_ID = uni.id;
  console.log(`Found University 'vui.edu' with ID: ${REAL_UNI_ID}`);

  const users = [
    {
      id: '99999999-9999-9999-9999-999999999999', // Changed to avoid collision with uni ID
      email: 'superadmin@example.com',
      password: 'VuiDemo123!',
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      universityId: null,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'admin@example.com',
      password: 'VuiDemo123!',
      role: 'admin',
      firstName: 'Univ',
      lastName: 'Admin',
      universityId: REAL_UNI_ID,
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'lecturer@example.com',
      password: 'VuiDemo123!',
      role: 'lecturer',
      firstName: 'John',
      lastName: 'Lecturer',
      universityId: REAL_UNI_ID,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'student@example.com',
      password: 'VuiDemo123!',
      role: 'student',
      firstName: 'Jane',
      lastName: 'Student',
      universityId: REAL_UNI_ID,
    },
  ];

  // 2. Cleanup broken users
  console.log("Cleaning up existing demo users...");
  for (const user of users) {
    await admin.auth.admin.deleteUser(user.id);
    // Also delete any existing auth users with these emails just in case
    const { data: { users: existing } } = await admin.auth.admin.listUsers();
    const match = existing.find(u => u.email === user.email);
    if (match) {
      await admin.auth.admin.deleteUser(match.id);
    }
  }

  // 3. Create users correctly via Admin API
  const LECTURER_ID = users.find((user) => user.role === 'lecturer')!.id;
  const STUDENT_ID = users.find((user) => user.role === 'student')!.id;

  console.log("Creating users via Admin API...");
  for (const user of users) {
    const { data: authUser, error: createError } = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        role: user.role,
        university_id: user.universityId,
      },
    } as any);

    if (createError) {
      console.error(`Failed to create auth user ${user.email}:`, createError.message);
      continue;
    }

    console.log(`Created auth user: ${user.email}`);

    // 4. Create Profile
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        university_id: user.universityId,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        role: user.role,
      });

    if (profileError) {
      console.error(`Failed to create profile for ${user.email}:`, profileError.message);
    } else {
      console.log(`Created profile for: ${user.email}`);
    }
  }

  await seedAcademicContent(REAL_UNI_ID, LECTURER_ID, STUDENT_ID);

  console.log("--- Seed Finished ---");
}

/**
 * Builds one complete course the demo logins can actually exercise: faculty ->
 * department -> program -> course -> section, with the lecturer assigned, the
 * student enrolled, and published content on top.
 *
 * Every step is upsert-or-find so the script can be re-run safely.
 */
async function seedAcademicContent(universityId: string, lecturerId: string, studentId: string) {
  console.log("Seeding academic content...");

  const findOrCreate = async (table: string, match: Record<string, any>, insert: Record<string, any>) => {
    let query = admin.from(table).select('id');
    for (const [column, value] of Object.entries(match)) query = query.eq(column, value);

    const { data: existing } = await query.maybeSingle();
    if (existing) return existing.id as string;

    const { data, error } = await admin.from(table).insert({ ...match, ...insert }).select('id').single();
    if (error) {
      console.error(`Failed to seed ${table}:`, error.message);
      return null;
    }
    return data.id as string;
  };

  const sessionId = await findOrCreate('academic_sessions',
    { university_id: universityId, name: '2026/2027' },
    { start_date: '2026-09-01', end_date: '2027-07-31', is_active: true });

  if (!sessionId) {
    console.error('Could not seed the academic session; stopping content seed.');
    return;
  }

  const semesterId = await findOrCreate('semesters',
    { university_id: universityId, academic_session_id: sessionId, name: '2026 First Semester' },
    { start_date: '2026-09-01', end_date: '2027-01-31', is_active: true });

  const facultyId = await findOrCreate('faculties',
    { university_id: universityId, name: 'Faculty of Computing' },
    { code: 'FOC' });

  const departmentId = facultyId && await findOrCreate('departments',
    { university_id: universityId, faculty_id: facultyId, name: 'Computer Science' },
    { code: 'CSC' });

  const programId = departmentId && await findOrCreate('programs',
    { university_id: universityId, department_id: departmentId, name: 'BSc Computer Science' },
    { code: 'BSC-CS', description: 'Four-year undergraduate programme in computer science.' });

  const courseId = departmentId && await findOrCreate('courses',
    { university_id: universityId, code: 'CSC101' },
    { department_id: departmentId, title: 'Introduction to Programming',
      description: 'Fundamentals of programming, algorithms, and problem solving.', credits: 3 });

  if (!courseId || !semesterId) {
    console.error('Could not seed the demo course; stopping content seed.');
    return;
  }

  const sectionId = await findOrCreate('course_sections',
    { university_id: universityId, course_id: courseId, name: 'Group A' },
    { semester_id: semesterId, capacity: 120 });

  if (!sectionId) return;

  await findOrCreate('course_lecturers',
    { course_section_id: sectionId, lecturer_id: lecturerId },
    { university_id: universityId, is_primary: true });

  await findOrCreate('course_enrollments',
    { course_section_id: sectionId, student_id: studentId },
    { university_id: universityId, status: 'active' });

  const moduleId = await findOrCreate('course_modules',
    { course_id: courseId, title: 'Week 1 — Getting Started' },
    { university_id: universityId, description: 'Setting up your tools and writing a first program.', order_index: 0 });

  if (moduleId) {
    await findOrCreate('lessons',
      { module_id: moduleId, title: 'What is a program?' },
      { university_id: universityId, content: 'A program is a sequence of instructions a computer can execute.',
        resource_type: 'video', order_index: 0, is_published: true });

    await findOrCreate('lessons',
      { module_id: moduleId, title: 'Your first script' },
      { university_id: universityId, content: 'Write, run, and debug a short script end to end.',
        resource_type: 'document', order_index: 1, is_published: true });
  }

  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await findOrCreate('assignments',
    { course_section_id: sectionId, title: 'Assignment 1 — Hello, world' },
    { university_id: universityId, description: 'Write a program that prints a greeting, then explain each line.',
      due_date: dueDate, total_points: 100, is_published: true, allow_late_submissions: true, max_resubmissions: 2 });

  const quizId = await findOrCreate('quizzes',
    { course_section_id: sectionId, title: 'Week 1 knowledge check' },
    { university_id: universityId, description: 'Two quick questions on the week 1 material.',
      total_points: 20, time_limit_minutes: 15, is_published: true, published_at: new Date().toISOString() });

  if (quizId) {
    const questionId = await findOrCreate('quiz_questions',
      { quiz_id: quizId, question_text: 'What does a compiler do?' },
      { university_id: universityId, question_type: 'multiple_choice', points: 10, order_index: 0 });

    if (questionId) {
      await findOrCreate('quiz_options',
        { question_id: questionId, option_text: 'Translates source code into machine code' },
        { university_id: universityId, is_correct: true });
      await findOrCreate('quiz_options',
        { question_id: questionId, option_text: 'Stores files on disk' },
        { university_id: universityId, is_correct: false });
    }
  }

  await findOrCreate('announcements',
    { course_section_id: sectionId, title: 'Welcome to CSC101' },
    { university_id: universityId, content: 'Read the week 1 material before our first live class.',
      author_id: lecturerId, is_published: true });

  const discussionId = await findOrCreate('discussions',
    { course_section_id: sectionId, title: 'Which editor should I use?' },
    { university_id: universityId, author_id: studentId,
      content: 'Is there an editor you recommend for the assignments?' });

  if (discussionId) {
    await findOrCreate('discussion_replies',
      { discussion_id: discussionId, content: 'Any editor is fine. Start with the one in the setup guide.' },
      { university_id: universityId, author_id: lecturerId, is_endorsed: true });
  }

  console.log('Seeded demo course CSC101 with content, enrollment, and discussion.');
}

seed();
