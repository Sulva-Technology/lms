import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { SuperadminService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { BarChart } from "lucide-react";

export default async function SuperadminUsagePage() {
  await requireRole("super_admin");
  const usage = await readOr(new SuperadminService((await createClient()) as any).getUsage(), []);
  return (
    <GenericList title="Usage" description="Storage, content, and account footprint by university." icon={BarChart}>
      <DataTable
        data={usage}
        keyExtractor={(item: any) => item.id}
        columns={[
          { key: "name", header: "University", cell: (item: any) => <span className="font-medium text-white">{item.name}</span> },
          { key: "users", header: "Users", cell: (item: any) => (item.profiles || []).length },
          { key: "courses", header: "Courses", cell: (item: any) => (item.courses || []).length },
          { key: "videos", header: "Videos", cell: (item: any) => (item.video_assets || []).length },
          { key: "storage", header: "Storage", cell: (item: any) => `${((item.files || []).reduce((sum: number, file: any) => sum + Number(file.file_size || 0), 0) / 1024 / 1024).toFixed(1)} MB` },
        ]}
      />
    </GenericList>
  );
}
