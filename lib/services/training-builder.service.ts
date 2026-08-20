import { SupabaseClient } from '@supabase/supabase-js';
import { TrainingAssignmentService } from './training-assignment.service';

export type TrainingMaterial = {
  title: string;
  /** written = text the learner reads, video = an uploaded file, document = a download. */
  kind: 'written' | 'video' | 'document';
  /** Prose for a written lesson, or the storage path for video and documents. */
  body?: string;
};

export type TrainingInput = {
  name: string;
  description?: string;
  material: TrainingMaterial[];
  /** Percentage a learner must score before a certificate can be issued. */
  passMark?: number | null;
  /** Months a certificate stays valid. Null never expires. */
  validForMonths?: number | null;
  startsOn: string;
  endsOn?: string | null;
  dueOn?: string | null;
  assignTo: { learnerIds?: string[]; teamIds?: string[] };
  publish: boolean;
};

const RESOURCE_TYPE: Record<TrainingMaterial['kind'], string> = {
  written: 'document',
  video: 'video',
  document: 'document',
};

/**
 * One submission becomes a whole training.
 *
 * A course, a cohort, a module, the lessons in order and an assignment per
 * person are six writes and four vocabularies that an organisation running
 * staff training has no reason to learn. The words it does not use never reach
 * the screen; they only exist down here.
 */
export class TrainingBuilderService {
  constructor(private supabase: SupabaseClient<any>) {}

  private async slugCode(universityId: string, name: string) {
    const base =
      name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 12) || 'TRAINING';

    // courses is UNIQUE(university_id, code), and a second "Fire Safety" is a
    // normal thing to want rather than an error to show someone.
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const code = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const { data } = await this.supabase
        .from('courses')
        .select('id')
        .eq('university_id', universityId)
        .eq('code', code)
        .maybeSingle();
      if (!data) return code;
    }
    return `${base}-${Date.now().toString().slice(-5)}`;
  }

  async createTraining(params: {
    universityId: string;
    ownerId: string;
    input: TrainingInput;
  }) {
    const { universityId, ownerId, input } = params;

    const { data: course, error: courseError } = await this.supabase
      .from('courses')
      .insert({
        university_id: universityId,
        // A training organisation has no departments; the column is nullable.
        department_id: null,
        title: input.name,
        code: await this.slugCode(universityId, input.name),
        description: input.description || null,
        credits: 1,
        pass_mark: input.passMark ?? null,
        valid_for_months: input.validForMonths ?? null,
        // Draft until the material is in: a training that appears in someone's
        // list before it has any lessons is worse than one that appears late.
        status: 'draft',
      })
      .select()
      .single();
    if (courseError) throw new Error(`Could not create the training: ${courseError.message}`);

    const { data: section, error: sectionError } = await this.supabase
      .from('course_sections')
      .insert({
        university_id: universityId,
        course_id: course.id,
        semester_id: null,
        name: input.name,
        starts_on: input.startsOn,
        ends_on: input.endsOn || null,
      })
      .select()
      .single();
    if (sectionError) throw new Error(`Could not create the cohort: ${sectionError.message}`);

    // Whoever built it runs it, so they can mark work and issue certificates
    // without a second screen and without an administrator assigning them.
    await this.supabase.from('course_lecturers').insert({
      university_id: universityId,
      course_section_id: section.id,
      lecturer_id: ownerId,
      is_primary: true,
    });

    const { data: module, error: moduleError } = await this.supabase
      .from('course_modules')
      .insert({
        university_id: universityId,
        course_id: course.id,
        title: input.name,
        description: input.description || null,
        order_index: 0,
      })
      .select()
      .single();
    if (moduleError) throw new Error(`Could not create the material: ${moduleError.message}`);

    const lessons = input.material.map((item, index) => ({
      university_id: universityId,
      module_id: module.id,
      title: item.title,
      content: item.body || null,
      resource_type: RESOURCE_TYPE[item.kind],
      order_index: index,
      is_published: input.publish,
    }));

    if (lessons.length > 0) {
      const { error: lessonError } = await this.supabase.from('lessons').insert(lessons);
      if (lessonError) throw new Error(`Could not add the material: ${lessonError.message}`);
    }

    // Published last: everything a learner needs exists before they can see it.
    if (input.publish) {
      await this.supabase.from('courses').update({ status: 'published' }).eq('id', course.id);
    }

    const assignments = new TrainingAssignmentService(this.supabase);
    let assigned = 0;

    for (const learnerId of input.assignTo.learnerIds || []) {
      await assignments.assign({
        universityId,
        courseSectionId: section.id,
        studentId: learnerId,
        dueOn: input.dueOn,
        assignedBy: ownerId,
      });
      assigned += 1;
    }

    for (const teamId of input.assignTo.teamIds || []) {
      const created = await assignments.assignTeam({
        universityId,
        courseSectionId: section.id,
        departmentId: teamId,
        dueOn: input.dueOn,
        assignedBy: ownerId,
      });
      assigned += created.length;
    }

    return {
      trainingId: course.id,
      cohortId: section.id,
      moduleId: module.id,
      lessons: lessons.length,
      assigned,
      published: input.publish,
    };
  }
}
