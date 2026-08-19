import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { apiError, apiResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const session = await requireRole('admin');
    
    // Pagination params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { data, error } = await supabase.from('faculties')
      .select('*')
      .eq('university_id', session.universityId!)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
