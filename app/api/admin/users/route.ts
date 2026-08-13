import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/guards';
import { apiError, apiResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const session = await requireRole('admin');
    const adminClient = createAdminClient();
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const query = searchParams.get('query') || '';

    let q = adminClient.from('profiles')
      .select('id, first_name, last_name, email, role, avatar_url, student_id')
      .eq('university_id', session.profile.university_id!);

    if (query) {
      q = q.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
