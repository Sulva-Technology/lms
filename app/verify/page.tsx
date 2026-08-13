import { AuthLayout } from "@/components/auth/AuthLayout"
import { VerificationSuccessUI } from "@/components/auth/VerificationSuccessUI"

export default function VerifyPage() {
  return (
    <AuthLayout title="Verification" subtitle="Your account setup is almost complete.">
      <VerificationSuccessUI />
    </AuthLayout>
  )
}
