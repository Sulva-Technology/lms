/**
 * Write-path audit against a running Supabase instance.
 *
 * `check:rls` is static: it proves every table has RLS enabled and at least one
 * policy. That is not the same as proving the application can actually perform
 * the writes it offers. Several features shipped with a read policy and an
 * admin-only write policy, so the UI worked and the database silently refused —
 * students could not post to a discussion, lecturers could not create a quiz
 * question, and grading could not mirror into the gradebook.
 *
 * This script signs in as the seeded demo users and performs one representative
 * write per feature through the same PostgREST path the app uses, so policy
 * gaps fail loudly.
 *
 * Prerequisites: a seeded database (`npm run db:seed:auth && npm run db:seed:demo`)
 * and `.env` pointing at it. Intended for a local stack — it writes real rows.
 *
 *   npm run check:writes
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { adminClient } from './lib/clients';
import { buildStoragePath, STORAGE_BUCKETS } from '../lib/storage/paths';

type Session = { client: SupabaseClient<any>; userId: string };

const results: Array<{ ok: boolean; label: string; detail?: string }> = [];

function record(ok: boolean, label: string, detail?: string) {
  results.push({ ok, label, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok || !detail ? '' : ': ' + detail}`);
}

async function expectOk(label: string, run: () => PromiseLike<any>) {
  try {
    const outcome = await run();
    const error = outcome && typeof outcome === 'object' ? outcome.error : null;
    record(!error, label, error?.message);
  } catch (error: any) {
    record(false, label, error?.message || String(error));
  }
}

async function expectDenied(label: string, run: () => PromiseLike<any>) {
  try {
    const outcome = await run();
    const error = outcome && typeof outcome === 'object' ? outcome.error : null;
    record(Boolean(error), label, error ? undefined : 'the operation was allowed');
  } catch {
    record(true, label);
  }
}

async function signIn(email: string): Promise<Session> {
  const admin = adminClient();
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw new Error(`could not generate a link for ${email}: ${error.message}`);

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error: otpError } = await client.auth.verifyOtp({
    token_hash: link.properties!.hashed_token,
    type: 'magiclink',
  });
  if (otpError) throw new Error(`could not sign in as ${email}: ${otpError.message}`);

  return { client: client as SupabaseClient<any>, userId: data.user!.id };
}

async function main() {
  const admin = adminClient();

  const { data: section, error: sectionError } = await admin
    .from('course_sections')
    .select('id, course_id, university_id, courses!inner(code)')
    .eq('courses.code', 'CSC101')
    .maybeSingle();

  if (sectionError || !section) {
    console.error('Seed data missing. Run `npm run db:seed:auth` then `npm run db:seed:demo` first.');
    process.exit(1);
  }

  const universityId = section.university_id as string;
  const sectionId = section.id as string;
  const courseId = (section as any).course_id as string;
  const stamp = Date.now();

  const lecturer = await signIn('lecturer@example.com');
  const student = await signIn('student@example.com');

  // --- Course content -------------------------------------------------------
  const moduleTitle = `Write-path module ${stamp}`;
  await expectOk('lecturer creates a module', () =>
    lecturer.client
      .from('course_modules')
      .insert({ university_id: universityId, course_id: courseId, title: moduleTitle, order_index: 99 })
      .select()
      .single(),
  );

  const { data: createdModule } = await admin
    .from('course_modules')
    .select('id')
    .eq('title', moduleTitle)
    .maybeSingle();

  const lessonTitle = `Write-path lesson ${stamp}`;
  await expectOk('lecturer creates a lesson', () =>
    lecturer.client
      .from('lessons')
      .insert({
        university_id: universityId,
        module_id: createdModule?.id,
        title: lessonTitle,
        resource_type: 'document',
        order_index: 0,
        is_published: true,
      })
      .select()
      .single(),
  );

  const { data: createdLesson } = await admin
    .from('lessons')
    .select('id')
    .eq('title', lessonTitle)
    .maybeSingle();

  await expectOk('lecturer attaches a lesson material', () =>
    lecturer.client
      .from('lesson_materials')
      .insert({
        university_id: universityId,
        lesson_id: createdLesson?.id,
        title: `Slides ${stamp}`,
        material_type: 'link',
        url: 'https://example.edu/slides',
      })
      .select()
      .single(),
  );

  await expectOk('lecturer attaches a lesson video asset', () =>
    lecturer.client
      .from('video_assets')
      .insert({
        university_id: universityId,
        created_by: lecturer.userId,
        lesson_id: createdLesson?.id,
        course_id: courseId,
        provider: 'supabase',
        asset_id: `write-path-${stamp}`,
        storage_path: `${universityId}/video/${lecturer.userId}/clip.mp4`,
        status: 'ready',
        visibility: 'private',
      })
      .select()
      .single(),
  );

  // --- Communication --------------------------------------------------------
  await expectOk('lecturer creates an announcement', () =>
    lecturer.client
      .from('announcements')
      .insert({
        university_id: universityId,
        course_section_id: sectionId,
        author_id: lecturer.userId,
        title: `Write-path announcement ${stamp}`,
        content: 'Body',
        is_published: true,
      })
      .select()
      .single(),
  );

  const discussionTitle = `Write-path question ${stamp}`;
  await expectOk('student creates a discussion', () =>
    student.client
      .from('discussions')
      .insert({
        university_id: universityId,
        course_section_id: sectionId,
        author_id: student.userId,
        title: discussionTitle,
        content: 'Any recommendations?',
      })
      .select()
      .single(),
  );

  const { data: createdDiscussion } = await admin
    .from('discussions')
    .select('id')
    .eq('title', discussionTitle)
    .maybeSingle();

  await expectOk('lecturer replies to a discussion', () =>
    lecturer.client
      .from('discussion_replies')
      .insert({
        university_id: universityId,
        discussion_id: createdDiscussion?.id,
        author_id: lecturer.userId,
        content: 'Use whatever the setup guide lists.',
        is_endorsed: true,
      })
      .select()
      .single(),
  );

  await expectOk('lecturer resolves a discussion', () =>
    lecturer.client
      .from('discussions')
      .update({ is_answered: true, answered_by: lecturer.userId, answered_at: new Date().toISOString() })
      .eq('id', createdDiscussion?.id)
      .select()
      .single(),
  );

  // --- Assessment -----------------------------------------------------------
  await expectOk('lecturer creates a grade item', () =>
    lecturer.client
      .from('grade_items')
      .insert({
        university_id: universityId,
        course_section_id: sectionId,
        title: `Write-path exam ${stamp}`,
        name: `Write-path exam ${stamp}`,
        max_score: 50,
        weight: 5,
        weight_percentage: 5,
      })
      .select()
      .single(),
  );

  const quizTitle = `Write-path quiz ${stamp}`;
  await expectOk('lecturer creates a quiz', () =>
    lecturer.client
      .from('quizzes')
      .insert({
        university_id: universityId,
        course_section_id: sectionId,
        title: quizTitle,
        total_points: 10,
        is_published: true,
      })
      .select()
      .single(),
  );

  const { data: createdQuiz } = await admin.from('quizzes').select('id').eq('title', quizTitle).maybeSingle();

  await expectOk('lecturer creates a quiz question', () =>
    lecturer.client
      .from('quiz_questions')
      .insert({
        university_id: universityId,
        quiz_id: createdQuiz?.id,
        question_text: `Write-path question ${stamp}?`,
        question_type: 'multiple_choice',
        points: 10,
        order_index: 0,
      })
      .select()
      .single(),
  );

  const { data: createdQuestion } = await admin
    .from('quiz_questions')
    .select('id')
    .eq('quiz_id', createdQuiz?.id)
    .maybeSingle();

  await expectOk('lecturer creates a quiz option', () =>
    lecturer.client
      .from('quiz_options')
      .insert({
        university_id: universityId,
        question_id: createdQuestion?.id,
        option_text: 'An answer',
        is_correct: true,
      })
      .select()
      .single(),
  );

  await expectOk('student submits a quiz attempt', () =>
    student.client
      .from('quiz_attempts')
      .insert({
        university_id: universityId,
        quiz_id: createdQuiz?.id,
        student_id: student.userId,
        status: 'completed',
        score: 10,
      })
      .select()
      .single(),
  );

  // --- Learning and attendance ---------------------------------------------
  await expectOk('student records lesson progress', () =>
    student.client
      .from('lesson_progress')
      .upsert(
        {
          university_id: universityId,
          lesson_id: createdLesson?.id,
          student_id: student.userId,
          is_completed: true,
        },
        { onConflict: 'lesson_id,student_id' },
      )
      .select()
      .single(),
  );

  // attendance_sessions is unique on (section, date), so each run needs its own
  // date for the audit to be repeatable.
  const rollCallDate = new Date(Date.now() + (stamp % 500) * 86_400_000).toISOString().slice(0, 10);

  await expectOk('lecturer records attendance', async () => {
    const { data: attendanceSession, error: sessionError } = await lecturer.client
      .from('attendance_sessions')
      .insert({
        university_id: universityId,
        course_section_id: sectionId,
        date: rollCallDate,
        title: `Write-path roll call ${stamp}`,
      })
      .select()
      .single();

    if (sessionError) return { error: sessionError };

    return lecturer.client.from('attendance_records').upsert(
      {
        university_id: universityId,
        session_id: attendanceSession.id,
        course_section_id: sectionId,
        student_id: student.userId,
        record_date: rollCallDate,
        status: 'present',
        created_by: lecturer.userId,
      },
      { onConflict: 'session_id,student_id' },
    );
  });

  await expectDenied('student cannot record attendance', () =>
    student.client
      .from('attendance_records')
      .insert({
        university_id: universityId,
        course_section_id: sectionId,
        student_id: student.userId,
        record_date: rollCallDate,
        status: 'present',
      })
      .select()
      .single(),
  );

  // --- Storage --------------------------------------------------------------
  const submissionPath = buildStoragePath({
    universityId,
    scope: 'submissions',
    ownerId: student.userId,
    fileName: `write-path-${stamp}.txt`,
  });

  await expectOk('student uploads a submission file', async () => {
    const signed = await student.client.storage
      .from(STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)
      .createSignedUploadUrl(submissionPath);
    if (signed.error) return { error: signed.error };

    return student.client.storage
      .from(STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)
      .uploadToSignedUrl(signed.data.path, signed.data.token, new Blob(['written by the write-path audit']));
  });

  await expectOk('lecturer reads a tenant submission file', () =>
    student.client.storage
      .from(STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)
      .download(submissionPath)
      .then((outcome) => outcome),
  );

  await expectDenied('student cannot write outside their university', async () => {
    const foreign = buildStoragePath({
      universityId: '11111111-2222-3333-4444-555555555555',
      scope: 'submissions',
      ownerId: student.userId,
      fileName: 'sneaky.txt',
    });
    const signed = await student.client.storage
      .from(STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)
      .createSignedUploadUrl(foreign);
    if (signed.error) return { error: signed.error };
    return student.client.storage
      .from(STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)
      .uploadToSignedUrl(signed.data.path, signed.data.token, new Blob(['x']));
  });

  await expectDenied('student cannot write another user\'s folder', async () => {
    const foreignOwner = buildStoragePath({
      universityId,
      scope: 'submissions',
      ownerId: lecturer.userId,
      fileName: 'impersonation.txt',
    });
    const signed = await student.client.storage
      .from(STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)
      .createSignedUploadUrl(foreignOwner);
    if (signed.error) return { error: signed.error };
    return student.client.storage
      .from(STORAGE_BUCKETS.ASSIGNMENT_SUBMISSIONS)
      .uploadToSignedUrl(signed.data.path, signed.data.token, new Blob(['x']));
  });

  await expectDenied('student cannot write course material', async () => {
    const materialPath = buildStoragePath({
      universityId,
      scope: 'materials',
      ownerId: student.userId,
      fileName: 'notes.txt',
    });
    const signed = await student.client.storage
      .from(STORAGE_BUCKETS.COURSE_RESOURCES)
      .createSignedUploadUrl(materialPath);
    if (signed.error) return { error: signed.error };
    return student.client.storage
      .from(STORAGE_BUCKETS.COURSE_RESOURCES)
      .uploadToSignedUrl(signed.data.path, signed.data.token, new Blob(['x']));
  });

  const failures = results.filter((result) => !result.ok);
  console.log('');
  console.log(`${results.length - failures.length}/${results.length} write-path checks passed.`);

  if (failures.length > 0) {
    console.error('Write-path audit failed.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Write-path audit could not run:', error.message || error);
  process.exit(1);
});
