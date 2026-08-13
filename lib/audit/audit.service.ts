import { SupabaseClient } from '@supabase/supabase-js';
import { AuditLogPayload } from '@/types/audit';
import { headers } from 'next/headers';

export class AuditService {
  constructor(private supabase: SupabaseClient<any>) {}

  async logAction(payload: AuditLogPayload) {
    let ipAddress = payload.ipAddress;
    
    // In server actions/routes, we can try to extract IP if not explicitly provided
    if (!ipAddress) {
      try {
        const headersList = await headers();
        ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
      } catch (e) {
        // Ignored. Server components/actions might not have access to headers depending on context
      }
    }

    const { error } = await this.supabase.from('audit_logs').insert({
      university_id: payload.universityId,
      user_id: payload.userId,
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      metadata: payload.metadata || {},
      ip_address: ipAddress
    });

    if (error) {
      console.error('[AuditService] Failed to log action:', error);
      // We generally do not throw here, as audit logging failure shouldn't necessarily block the primary action
    }
  }
}
