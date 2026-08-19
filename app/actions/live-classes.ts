'use server'

import { createClient } from '@/lib/supabase/server';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { createLiveClassSchema } from '@/lib/validation/live-class';
import { LiveClassService } from '@/lib/services/live-class.service';
import { DailyLiveClassProvider } from '@/lib/live-class/daily-provider';

export async function createLiveClassAction(payload: any) {
    const supabase = await createClient();
    const session = await requireUser();

    if (session.role !== 'lecturer' && session.role !== 'admin') {
        return { error: 'Unauthorized' };
    }

    const parsed = createLiveClassSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    
    const provider = new DailyLiveClassProvider();
    const service = new LiveClassService(supabase as any, provider);
    
    try {
        const result = await service.createLiveClass(session.universityId!, session.user!.id, parsed.data as any);
        return { success: true, liveClass: result };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function cancelLiveClassAction(classId: string) {
    const supabase = await createClient();
    const session = await requireUser();
    
    const provider = new DailyLiveClassProvider();
    const service = new LiveClassService(supabase as any, provider);

    try {
        await service.cancelLiveClass(session.universityId!, session.user!.id, classId);
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function updateLiveClassAction(payload: any) {
    const supabase = await createClient();
    const session = await requireRole('lecturer');
    const parsed = createLiveClassSchema.extend({ id: createLiveClassSchema.shape.courseId }).safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const start = new Date(parsed.data.startTime);
    const end = new Date(start.getTime() + parsed.data.durationMinutes * 60000);
    const { data: current, error: currentError } = await supabase
        .from('live_classes')
        .select('id, lecturer_id, provider_session_id, meeting_id')
        .eq('id', parsed.data.id)
        .single();
    if (currentError) return { error: currentError.message };
    if (current.lecturer_id !== session.user.id) return { error: 'Unauthorized' };

    try {
        const provider = new DailyLiveClassProvider();
        await provider.updateSession(current.provider_session_id || current.meeting_id, {
            properties: {
                nbf: Math.max(0, Math.floor(start.getTime() / 1000) - 15 * 60),
                exp: Math.floor(end.getTime() / 1000) + 60 * 60,
                enable_recording: parsed.data.isRecordingEnabled ? 'cloud' : 'off',
            },
        });
    } catch (error: any) {
        return { error: error.message };
    }

    const { data, error } = await supabase
        .from('live_classes')
        .update({
            course_id: parsed.data.courseId,
            course_section_id: parsed.data.courseSectionId,
            title: parsed.data.topic,
            topic: parsed.data.topic,
            description: parsed.data.description || null,
            start_time: parsed.data.startTime,
            end_time: end.toISOString(),
            duration: parsed.data.durationMinutes,
            is_recording_enabled: parsed.data.isRecordingEnabled,
            is_waiting_room_enabled: parsed.data.isWaitingRoomEnabled,
            join_before_host: parsed.data.joinBeforeHost,
            tracking_rule: parsed.data.trackingRule,
            attendance_threshold_percent: parsed.data.attendanceThresholdPercent,
        })
        .eq('id', parsed.data.id)
        .select()
        .single();
    if (error) return { error: error.message };

    return { success: true, liveClass: data };
}
