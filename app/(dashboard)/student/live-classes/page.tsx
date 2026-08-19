import { LiveClassList } from "@/components/live/LiveClassList";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { CoreReadService } from "@/lib/services/core-read.service";
import { createClient } from "@/lib/supabase/server";
import { Calendar } from "lucide-react";

export default async function StudentLiveClassesPage() {
  const session = await requireRole("student");
  const service = new CoreReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getStudentSectionIds(session.user.id), []);
  const sessions = await readOr(service.getLiveClasses(session.profile.university_id!, sectionIds), []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-ink mb-2 tracking-tight">Live Classes</h1>
          <p className="text-ink-muted">Join scheduled lectures, seminars, and study sessions from your enrolled courses.</p>
        </div>
        <div className="panel px-4 py-2 border border-line rounded-lg flex items-center gap-2 text-sm text-ink-muted">
          <Calendar size={16} /> Schedule
        </div>
      </div>

      <LiveClassList role="student" sessions={sessions} />
    </div>
  );
}
