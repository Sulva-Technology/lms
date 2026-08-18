import { PauseCircle } from "lucide-react";
import { StatusScreen } from "@/components/layout/StatusScreen";

export default function SchoolUnavailablePage() {
  return (
    <StatusScreen
      icon={PauseCircle}
      eyebrow="Paused"
      title="This school is unavailable"
      description="Access has been paused for this institution. Your school administrator can restore it by contacting platform support."
    />
  );
}
