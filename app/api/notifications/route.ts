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

    const { data, error } = await supabase.from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('university_id', session.universityId!)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
