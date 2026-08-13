import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { apiError, apiResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const session = await requireRole('admin');
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const departmentId = searchParams.get('departmentId');

    let q = supabase.from('courses')
      .select('*, departments(id, name)')
      .eq('university_id', session.profile.university_id!);

    if (departmentId) {
      q = q.eq('department_id', departmentId);
    }

    const { data, error } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
