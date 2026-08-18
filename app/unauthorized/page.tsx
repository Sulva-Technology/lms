import { ShieldAlert } from "lucide-react";
import { StatusScreen } from "@/components/layout/StatusScreen";

export default function UnauthorizedPage() {
  return (
    <StatusScreen
      icon={ShieldAlert}
      tone="danger"
      eyebrow="Access blocked"
      title="You do not have access to this workspace."
      description="Your account is signed in, but this page belongs to another role or another institution."
      actions={[
        { href: "/login", label: "Switch account" },
        { href: "/", label: "Back home", variant: "outline" },
      ]}
    />
  );
}
