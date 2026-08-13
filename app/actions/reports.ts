'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { ReportService } from '@/lib/services/report.service';

// Basic wrapper for server components/actions if they want to fetch directly via action rather than fetch() API
export async function getUniversityReportOverviewAction() {
    const supabase = await createClient();
    const session = await requireRole('admin');
    
    const service = new ReportService(supabase as any);
    try {
        const result = await service.getUniversityOverview(session.profile!.university_id!);
        return { success: true, data: result };
    } catch (err: any) {
        return { error: err.message };
    }
}
