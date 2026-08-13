import { AuthLayout } from "@/components/auth/AuthLayout"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Enter your credentials to access your account.">
      <LoginForm />
    </AuthLayout>
  )
}
