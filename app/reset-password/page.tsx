import { AuthLayout } from "@/components/auth/AuthLayout"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export default function ResetPasswordPage() {
  return (
    <AuthLayout 
      title="Create New Password" 
      subtitle="Your new password must be different from previous used passwords."
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}
