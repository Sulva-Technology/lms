import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.VIDEO_PROVIDER_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-webhook-signature')
    const body = await req.text()

    if (!WEBHOOK_SECRET || !signature) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    // Simple signature validation for the video provider dummy logic
    if (signature !== expectedSignature) {
      console.warn('Invalid signature for video webhook')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payload = JSON.parse(body)

    const supabase = createAdminClient()

    // Example payload logic
    if (payload.event === 'video.ready') {
      const { asset_id, duration } = payload.data

      // Find the lesson and update it
      const { error } = await supabase
        .from('lessons')
        .update({ video_duration: duration })
        .eq('video_asset_id', asset_id)

      if (error) {
        console.error('Failed to update lesson duration:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
