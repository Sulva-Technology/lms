import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { apiError, apiResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const session = await requireRole('admin');
    const { data, error } = await supabase.from('universities').select('*').eq('id', session.profile.university_id!).single();
    if (error) throw error;
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
