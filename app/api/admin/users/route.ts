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

    const universityId = session.universityId;
    if (!universityId) throw new Error('Forbidden');

    // The listing is of this organisation's members. An account may appear in
    // another organisation's listing too, with a different role.
    let q = adminClient.from('memberships')
      .select('role, student_id, created_at, profiles!inner(id, first_name, last_name, email, avatar_url)')
      .eq('university_id', universityId)
      .is('deleted_at', null);

    if (query) {
      q = q.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`,
        { foreignTable: 'profiles' },
      );
    }

    const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const users = (data || []).map((row: any) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return { ...profile, role: row.role, student_id: row.student_id };
    });

    return apiResponse(users);
  } catch (error) {
    return apiError(error);
  }
}
