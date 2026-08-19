import { GenericList } from "@/components/academic/GenericList";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guards";
import { readOr } from "@/lib/safe-read";
import { AdminReadService } from "@/lib/services/completion-read.service";
import { createClient } from "@/lib/supabase/server";
import { HardDrive } from "lucide-react";

export default async function AdminStoragePage() {
  const session = await requireRole("department_admin");
  const files = await readOr(new AdminReadService((await createClient()) as any).getStorage(session.profile.university_id!), []);

  return (
    <GenericList title="Storage" description="University files and storage usage." icon={HardDrive}>
      {files.length === 0 ? (
        <EmptyState title="No files" description="Uploaded course and submission files will appear here." />
      ) : (
        <DataTable
          data={files}
          keyExtractor={(item: any) => item.id}
          columns={[
            { key: "name", header: "File", cell: (item: any) => <span className="font-medium text-ink">{item.file_name}</span> },
            { key: "type", header: "Type", cell: (item: any) => item.file_type },
            { key: "size", header: "Size", cell: (item: any) => `${(Number(item.file_size || 0) / 1024 / 1024).toFixed(2)} MB` },
            { key: "visibility", header: "Visibility", cell: (item: any) => item.is_public ? "Public" : "Private" },
            { key: "date", header: "Uploaded", cell: (item: any) => new Date(item.created_at).toLocaleDateString() },
          ]}
        />
      )}
    </GenericList>
  );
}
