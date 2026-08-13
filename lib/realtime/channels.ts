import { SupabaseClient } from '@supabase/supabase-js';

// Helps setting up realtime channels in components.
// Example:
// const channel = setupNotificationChannel(supabase, userId, (payload) => {
//    console.log('New notification!', payload);
// });

export function setupNotificationChannel(
  supabase: SupabaseClient, 
  userId: string, 
  onNotification: (payload: any) => void
) {
  return supabase.channel(`notifications:user_id=eq.${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      onNotification
    )
    .subscribe();
}

export function setupDiscussionChannel(
  supabase: SupabaseClient,
  courseSectionId: string,
  onUpdate: (payload: any) => void
) {
  return supabase.channel(`discussions:course_section_id=eq.${courseSectionId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'discussions', filter: `course_section_id=eq.${courseSectionId}` },
      onUpdate
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'discussion_replies' },
      onUpdate
    )
    .subscribe();
}
