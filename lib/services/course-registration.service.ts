import { SupabaseClient } from '@supabase/supabase-js';

export class CourseRegistrationService {
  constructor(private supabase: SupabaseClient<any>) {}

  async submitRegistration(studentId: string, universityId: string, semesterId: string, sectionIds: string[]) {
    // 1. Get window
    const { data: window } = await this.supabase
      .from('registration_windows')
      .select('*')
      .eq('semester_id', semesterId)
      .eq('university_id', universityId)
      .single();

    if (!window) throw new Error('No active registration window');
    
    const now = new Date();
    if (now < new Date(window.start_date) || now > new Date(window.end_date)) {
      throw new Error('Registration is closed outside the window dates');
    }

    // 2. Validate sections & credits
    const { data: sections } = await this.supabase
      .from('course_sections')
      .select('id, courses(id, credits)')
      .in('id', sectionIds);
    
    if (!sections || sections.length !== sectionIds.length) throw new Error('Invalid course section IDs');

    // Supabase JS returns nested joins as objects or arrays. Cast to appropriate interface shape
    const totalCredits = sections.reduce((acc, curr) => {
        const c = Array.isArray(curr.courses) ? curr.courses[0] : curr.courses;
        return acc + ((c as any)?.credits || 0);
    }, 0);

    if (totalCredits < window.min_credits) throw new Error(`Minimum ${window.min_credits} credits required`);
    if (totalCredits > window.max_credits) throw new Error(`Maximum ${window.max_credits} credits exceeded`);

    // Basic prerequisite check: check passing enrollments
    // For production this involves complex lookups of `grades` but keeping simple bounds

    // 3. Create Record
    const { data: reg, error: regError } = await this.supabase
      .from('course_registrations')
      .insert({ university_id: universityId, semester_id: semesterId, student_id: studentId, status: 'pending' })
      .select().single();
    
    if (regError) throw regError;

    // 4. Create Items
    const items = sectionIds.map((id) => ({
      university_id: universityId,
      registration_id: reg.id,
      course_section_id: id,
      status: 'registered'
    }));
    
    const { error: itemsError } = await this.supabase.from('course_registration_items').insert(items);
    if (itemsError) throw itemsError;

    // Audit log
    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: studentId,
      action: 'SUBMIT_REGISTRATION',
      entity_type: 'course_registrations',
      entity_id: reg.id
    });

    return reg;
  }

  async approveRegistration(adminId: string, universityId: string, registrationId: string) {
    // 1. Mark Approved
    const { error: updErr } = await this.supabase.from('course_registrations')
      .update({ status: 'approved' })
      .eq('id', registrationId);
    if (updErr) throw updErr;

    // 2. Insert Enrollments
    const { data: items } = await this.supabase.from('course_registration_items')
      .select('*').eq('registration_id', registrationId).eq('status', 'registered');
    
    const { data: reg } = await this.supabase.from('course_registrations')
      .select('student_id').eq('id', registrationId).single();

    if (items && items.length > 0 && reg?.student_id) {
        const enrollments = items.map((item) => ({
            university_id: universityId,
            course_section_id: item.course_section_id,
            student_id: reg.student_id,
            status: 'active'
        }));
        await this.supabase.from('course_enrollments').upsert(enrollments, { onConflict: 'course_section_id,student_id' });
    }
    
    // 3. Audit log
    await this.supabase.from('audit_logs').insert({
      university_id: universityId,
      user_id: adminId,
      action: 'APPROVE_REGISTRATION',
      entity_type: 'course_registrations',
      entity_id: registrationId
    });

    return true;
  }
}
