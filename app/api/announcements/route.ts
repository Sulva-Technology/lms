import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { apiError, apiResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const session = await requireUser();
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Very simplified logic for "relevant": university-wide + courses the user is enrolled in
    // A complete implementation would filter by user's faculty/dept as well.
    let q = supabase.from('announcements')
      .select('*, profiles(first_name, last_name, avatar_url)')
      .eq('university_id', session.profile.university_id!)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Assuming we do further client side or complex joined filtering for course specific
    // since we can't easily query "target_id in (select course_section_id from enrollments)" here without RPC
    
    const { data, error } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
