import { AuthLayout } from "@/components/auth/AuthLayout"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export default function ForgotPasswordPage() {
  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Enter your email address and we'll send you instructions to reset your password."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
