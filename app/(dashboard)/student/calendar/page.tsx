import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { StudentReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { CalendarIcon } from "lucide-react";

export default async function StudentCalendarPage() {
  const session = await requireRole("student");
  const service = new StudentReadService((await createClient()) as any);
  const sectionIds = await readOr(service.getSectionIds(session.user.id), []);
  const events = await readOr(service.getCalendar(session.user.id, session.profile.university_id!, sectionIds), []);

  return (
    <GenericList title="Calendar" description="A unified schedule for classes, assessments, and university events." icon={CalendarIcon}>
      {events.length === 0 ? (
        <EmptyState title="No events" description="Your calendar fills as courses, assignments, and live classes are scheduled." />
      ) : (
        <DataTable
          data={events}
          keyExtractor={(item: any) => `${item.type}-${item.id}`}
          columns={[
            { key: "title", header: "Event", cell: (item: any) => <span className="font-medium text-white">{item.title}</span> },
            { key: "type", header: "Type", cell: (item: any) => <span className="capitalize">{String(item.type).replace(/_/g, " ")}</span> },
            { key: "course", header: "Course", cell: (item: any) => item.course || "University" },
            { key: "starts", header: "Starts", cell: (item: any) => item.startsAt ? new Date(item.startsAt).toLocaleString() : "Not scheduled" },
          ]}
        />
      )}
    </GenericList>
  );
}
