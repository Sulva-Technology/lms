import { GenericList } from "@/components/academic/GenericList";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";

export default async function StudentAnnouncementsPage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const announcements = await readOr(service.getAnnouncements(session.profile.university_id!, sectionIds), []);

  return (
    <GenericList title="Announcements" description="Official updates from your courses and university." icon={Bell}>
      {announcements.length === 0 ? (
        <EmptyState title="No announcements" description="Published course and university updates will appear here." />
      ) : announcements.map((item: any) => (
        <article key={item.id} className="bg-surface backdrop-blur-2xl border border-line rounded-[24px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-outfit text-xl font-semibold text-ink">{item.title}</h2>
              <p className="text-sm text-ink-subtle mt-1">{new Date(item.created_at).toLocaleString()}</p>
            </div>
            <span className="rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-medium text-primary capitalize">{item.target_scope}</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-muted">{item.content}</p>
        </article>
      ))}
    </GenericList>
  );
}
