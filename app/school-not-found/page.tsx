import { SearchX } from "lucide-react";
import { StatusScreen } from "@/components/layout/StatusScreen";

export default function SchoolNotFoundPage() {
  return (
    <StatusScreen
      icon={SearchX}
      eyebrow="Nothing here"
      title="School not found"
      description="No school is registered at this web address. Check the link with your institution, then try again."
    />
  );
}
