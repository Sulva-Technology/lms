import type { Discussion, DiscussionReply } from '@/components/discussions/DiscussionBoard';

const one = <T,>(value: T | T[] | null | undefined): T | undefined =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

export const personName = (profile: any): string =>
  [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || 'Member';

export const courseLabel = (row: any): string => {
  const section = one<any>(row?.course_sections);
  const course = one<any>(section?.courses);
  return course?.code || section?.name || 'Course';
};

/** Maps a `discussions` row (with joined profile, section and replies) to the board shape. */
export function toDiscussion(row: any): Discussion {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author_name: personName(one<any>(row.profiles)),
    course_label: courseLabel(row),
    is_answered: Boolean(row.is_answered),
    created_at: row.created_at,
    reply_count: (row.discussion_replies || []).length,
  };
}

export function toReply(row: any): DiscussionReply {
  return {
    id: row.id,
    content: row.content,
    author_name: personName(one<any>(row.profiles)),
    is_endorsed: Boolean(row.is_endorsed),
    created_at: row.created_at,
  };
}
