import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { apiError, apiResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const session = await requireRole('admin');
    const { data, error } = await supabase.from('programs').select('*').eq('university_id', session.profile.university_id!);
    if (error) throw error;
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
