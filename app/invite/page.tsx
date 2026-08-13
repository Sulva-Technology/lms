import { AuthLayout } from "@/components/auth/AuthLayout"
import { InviteAcceptanceUI } from "@/components/auth/InviteAcceptanceUI"

export default function InvitePage() {
  return (
    <AuthLayout title="Platform Invitation" subtitle="Join your institution's digital campus.">
      <InviteAcceptanceUI />
    </AuthLayout>
  )
}
