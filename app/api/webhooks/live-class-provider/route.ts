import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DailyLiveClassProvider } from '@/lib/live-class/daily-provider';
import { verifyDailyWebhookSignature } from '@/lib/live-class/webhook-verification';
import { RecordingService } from '@/lib/services/recording.service';

type DailyRecordingPayload = {
  type: string;
  recording_id: string;
  room_name: string;
  duration: number;
  s3_key?: string;
  status?: string;
};

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    if (event.test === 'test') {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const isVerified = verifyDailyWebhookSignature(
      rawBody,
      req.headers.get('x-webhook-signature'),
      req.headers.get('x-webhook-timestamp'),
      process.env.LIVE_CLASS_PROVIDER_WEBHOOK_SECRET,
    );

    if (!isVerified) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (event.type !== 'recording.ready-to-download') {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const payload = event.payload as DailyRecordingPayload;
    if (!payload?.recording_id || !payload.room_name) {
      return NextResponse.json({ error: 'Malformed recording payload' }, { status: 400 });
    }

    const provider = new DailyLiveClassProvider();
    const recordingUrl = await provider.getRecordingAccessLink(payload.recording_id);
    const service = new RecordingService(createAdminClient() as any);

    await service.processWebhookRecording({
      providerSessionId: payload.room_name,
      providerRecordingId: payload.recording_id,
      recordingUrl,
      durationSeconds: payload.duration || 0,
      s3Key: payload.s3_key,
      providerMetadata: event,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Live class provider webhook failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
